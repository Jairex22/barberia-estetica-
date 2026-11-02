/**
 * Prueba de carga reproducible: N usuarios concurrentes (por defecto 200) navegando y chateando contra el API local.
 * Carga definida por usuario (bucle durante DURATION_S): GET /discover, POST /discover/swipe (pass), GET /conversations,
 * y para parejas emparejadas: envío de mensajes por WebSocket (1 msg / 3 s) + lectura por REST.
 * Mide latencias p50/p95/p99, errores y uso de CPU/memoria del proceso del API (via /proc si corre en esta máquina).
 * NO toca proveedores externos (Stripe, RevenueCat, Anthropic): solo endpoints internos.
 * Uso: pnpm load:test  (variables: LOAD_USERS=200 LOAD_DURATION_S=60 LOAD_API=http://127.0.0.1:4000 LOAD_API_PID=<pid>)
 */
import WebSocket from 'ws';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const API = process.env.LOAD_API ?? 'http://127.0.0.1:4000';
const USERS = Number(process.env.LOAD_USERS ?? 200);
const DURATION_S = Number(process.env.LOAD_DURATION_S ?? 60);
const PID = process.env.LOAD_API_PID ? Number(process.env.LOAD_API_PID) : null;
const PASSWORD = 'CargaSegura123!xyz';
const tag = Date.now().toString(36);

type Sample = { name: string; ms: number; ok: boolean; status: number };
const samples: Sample[] = [];
async function timed(name: string, fn: () => Promise<Response>): Promise<Response | null> {
  const t0 = performance.now();
  try { const r = await fn(); samples.push({ name, ms: performance.now() - t0, ok: r.ok, status: r.status }); return r; }
  catch { samples.push({ name, ms: performance.now() - t0, ok: false, status: 0 }); return null; }
}
const json = (method: string, path: string, token: string | null, body?: unknown) => fetch(`${API}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });

async function setupUser(i: number) {
  const gender = i % 2 === 0 ? 'mujer' : 'hombre'; const interestedIn = gender === 'mujer' ? 'hombres' : 'mujeres';
  const email = `carga-${tag}-${i}@load.test`;
  const r = await json('POST', '/auth/register', null, { email, password: PASSWORD, birthdate: '1992-01-01', gender, interestedIn, displayName: `Carga${i}`, acceptTerms: true, acceptPrivacy: true, confirmAdult: true });
  if (!r.ok) throw new Error(`registro ${i}: ${r.status} ${await r.text()}`);
  const { token, userId } = (await r.json()) as { token: string; userId: string };
  return { token, userId, gender, email };
}

async function main() {
  console.log(`Prueba de carga: ${USERS} usuarios, ${DURATION_S}s, API ${API}`);
  // 1) Preparación (no medida como carga): registro + verificación directa en BD + perfil completo + foto aprobada + matches por parejas.
  const { createDb } = await import('../src/db/client.js');
  const { users: usersT, profiles: profilesT, photos: photosT, swipes: swipesT } = await import('../src/db/schema.js');
  const { sql: dsql, inArray } = await import('drizzle-orm');
  const { db, sql } = createDb();
  const users: Awaited<ReturnType<typeof setupUser>>[] = [];
  for (let b = 0; b < USERS; b += 25) users.push(...(await Promise.all(Array.from({ length: Math.min(25, USERS - b) }, (_, k) => setupUser(b + k)))));
  const ids = users.map((u) => u.userId);
  const now = new Date().toISOString();
  await db.update(usersT).set({ emailVerifiedAt: now, lastActiveAt: now }).where(inArray(usersT.id, ids));
  await db.update(profilesT).set({ bio: 'Perfil de prueba de carga con presentación suficientemente larga.', intent: 'relacion_seria', interests: ['cafe', 'cine', 'senderismo'], planTypes: ['cafe'], city: 'Guadalajara', latCoarse: 20.67, lngCoarse: -103.35, completedAt: now, prefAgeMin: 18, prefAgeMax: 60 }).where(inArray(profilesT.userId, ids));
  await db.insert(photosT).values(ids.map((id) => ({ userId: id, storageKey: `photos/${id}/carga.webp`, position: 0, status: 'approved' as const })));
  // Parejas (2k, 2k+1): like mutuo → match + conversación (vía API para ejercitar el camino real).
  for (let k = 0; k + 1 < users.length; k += 2) {
    await json('POST', '/discover/swipe', users[k]!.token, { targetId: users[k + 1]!.userId, action: 'like' });
    await json('POST', '/discover/swipe', users[k + 1]!.token, { targetId: users[k]!.userId, action: 'like' });
  }
  samples.length = 0;
  console.log('Preparación lista. Iniciando carga…');

  // 2) Carga medida.
  const rss: number[] = []; const cpu: number[] = [];
  let lastCpu = PID ? readCpu(PID) : null;
  const mon = setInterval(() => { if (!PID) return; try { const st = readFileSync(`/proc/${PID}/status`, 'utf8'); const m = st.match(/VmRSS:\s+(\d+)/); if (m) rss.push(Number(m[1]) / 1024); const c = readCpu(PID); if (lastCpu != null && c != null) cpu.push(((c - lastCpu) / 100) / 2 * 100); lastCpu = c; } catch { /* sin acceso */ } }, 2000);
  const end = Date.now() + DURATION_S * 1000;
  const wsErrors = { count: 0 }; let wsSent = 0; let wsAcked = 0;

  const workers = users.map(async (u, i) => {
    const convRes = await json('GET', '/conversations', u.token); const convs = convRes.ok ? ((await convRes.json()) as any).conversations : [];
    const conv = convs[0];
    let ws: WebSocket | null = null; const pendingAck = new Map<string, number>();
    if (conv) {
      ws = new WebSocket(`${API.replace(/^http/, 'ws')}/ws?token=${encodeURIComponent(u.token)}`);
      await new Promise<void>((res) => { ws!.on('open', () => res()); ws!.on('error', () => { wsErrors.count++; res(); }); });
      ws.on('message', (d) => { try { const e = JSON.parse(d.toString()); if (e.type === 'message.ack') { const t0 = pendingAck.get(e.clientId); if (t0) { samples.push({ name: 'ws.message.ack', ms: performance.now() - t0, ok: true, status: 200 }); pendingAck.delete(e.clientId); wsAcked++; } } if (e.type === 'error') wsErrors.count++; } catch { /* ignorar */ } });
    }
    await new Promise((r) => setTimeout(r, Math.random() * 3000)); // arranque escalonado
    let n = 0;
    while (Date.now() < end) {
      const d = await timed('GET /discover', () => json('GET', '/discover?limit=5', u.token));
      if (d?.ok) { const { profiles } = (await d.json()) as any; if (profiles[0]) await timed('POST /discover/swipe', () => json('POST', '/discover/swipe', u.token, { targetId: profiles[0].id, action: 'pass' })); }
      await timed('GET /conversations', () => json('GET', '/conversations', u.token));
      if (conv) {
        const canWrite = conv.initiation !== 'them';
        if (ws && ws.readyState === 1 && (canWrite || n > 0)) { const clientId = `${tag}-${i}-${n}`; pendingAck.set(clientId, performance.now()); ws.send(JSON.stringify({ type: 'message.send', conversationId: conv.id, clientId, body: `Mensaje de carga ${n}` })); wsSent++; }
        await timed('GET /conversations/:id/messages', () => json('GET', `/conversations/${conv.id}/messages?after=0&limit=50`, u.token));
      }
      n++;
      await new Promise((r) => setTimeout(r, 3000));
    }
    ws?.close();
  });
  await Promise.all(workers);
  clearInterval(mon);

  // 3) Informe.
  const byName = new Map<string, Sample[]>();
  for (const s of samples) { if (!byName.has(s.name)) byName.set(s.name, []); byName.get(s.name)!.push(s); }
  const pct = (arr: number[], p: number) => { const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))] ?? 0; };
  const rows = [...byName.entries()].map(([name, arr]) => { const ms = arr.map((x) => x.ms); const errs = arr.filter((x) => !x.ok); return { name, n: arr.length, p50: Math.round(pct(ms, 50)), p95: Math.round(pct(ms, 95)), p99: Math.round(pct(ms, 99)), max: Math.round(Math.max(...ms)), errors: errs.length, errorRate: `${((errs.length / arr.length) * 100).toFixed(2)}%`, statuses: [...new Set(errs.map((e) => e.status))].join(',') }; });
  console.table(rows);
  const total = samples.length; const totalErr = samples.filter((s) => !s.ok).length;
  const summary = { date: new Date().toISOString(), api: API, users: USERS, durationS: DURATION_S, requests: total, requestsPerSecond: Number((total / DURATION_S).toFixed(1)), errorRate: `${((totalErr / Math.max(1, total)) * 100).toFixed(2)}%`, wsSent, wsAcked, wsErrors: wsErrors.count, apiRssMb: rss.length ? { min: Math.round(Math.min(...rss)), max: Math.round(Math.max(...rss)) } : 'no medido (define LOAD_API_PID)', apiCpuPct: cpu.length ? { avg: Math.round(cpu.reduce((a, b) => a + b, 0) / cpu.length), max: Math.round(Math.max(...cpu)) } : 'no medido', rows };
  console.log(JSON.stringify({ ...summary, rows: undefined }, null, 2));
  mkdirSync('../../docs/pruebas', { recursive: true });
  writeFileSync(`../../docs/pruebas/carga-${USERS}u-${tag}.json`, JSON.stringify(summary, null, 2));
  // Limpieza de usuarios de carga.
  await db.delete(usersT).where(inArray(usersT.id, ids));
  await sql.end();
  console.log('Usuarios de carga eliminados.');
}
function readCpu(pid: number): number | null { try { const parts = readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1]!.split(' '); return Number(parts[11]) + Number(parts[12]); } catch { return null; } }
main().catch((e) => { console.error(e); process.exit(1); });
