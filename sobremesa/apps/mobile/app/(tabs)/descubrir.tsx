import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { PublicProfile, SwipeResult } from '@sobremesa/shared';
import { api, ApiError } from '@/lib/api';
import { ProfileCard } from '@/components/ProfileCard';
import { Button, Muted, StateView } from '@/components/ui';
import { ReportSheet } from '@/components/ReportSheet';
export default function Descubrir() {
  const router = useRouter(); const [queue, setQueue] = useState<PublicProfile[]>([]); const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'error' | 'offline' | 'unavailable' | 'blocked'>('loading'); const [err, setErr] = useState<ApiError | null>(null); const [likes, setLikes] = useState<number | null>(null); const [busy, setBusy] = useState(false); const [report, setReport] = useState<PublicProfile | null>(null);
  const load = useCallback(async () => { setState('loading'); try { const r = await api<{ profiles: PublicProfile[]; likesRemaining: number }>('/discover?limit=10'); setQueue(r.profiles); setLikes(r.likesRemaining); setState(r.profiles.length ? 'ready' : 'empty'); } catch (e) { const a = e as ApiError; setErr(a); setState(a.status === 0 ? 'offline' : a.status === 503 ? 'unavailable' : a.status === 403 ? 'blocked' : 'error'); } }, []);
  useEffect(() => { load(); }, [load]);
  const cur = queue[0];
  async function act(action: 'like' | 'pass') {
    if (!cur || busy) return; setBusy(true);
    try { const r = await api<SwipeResult>('/discover/swipe', { method: 'POST', json: { targetId: cur.id, action } }); if (r.remainingLikes != null) setLikes(r.remainingLikes); const rest = queue.slice(1); setQueue(rest); if (!rest.length) load();
      if (r.matched) Alert.alert('¡Conexión!', 'Ambos se dieron like. Revisa quién puede escribir primero.', [{ text: 'Seguir', style: 'cancel' }, { text: 'Ir al chat', onPress: () => router.push(`/(tabs)/mensajes/${r.conversationId}`) }]);
    } catch (e) { const a = e as ApiError; if (a.status === 404) setQueue((q) => q.slice(1)); else Alert.alert('Aviso', a.message); } finally { setBusy(false); }
  }
  if (state === 'loading') return <StateView state="loading" />;
  if (state === 'empty') return <StateView state="empty" action={<Button title="Revisar mis preferencias" variant="secondary" onPress={() => router.push('/(tabs)/perfil/editar')} />} />;
  if (state === 'blocked') return <StateView state="unavailable" title="Falta un paso" body={err?.message} action={<Button title={err?.message.includes('correo') ? 'Ya verifiqué mi correo' : 'Completar perfil'} onPress={() => (err?.message.includes('correo') ? load() : router.push('/(tabs)/perfil/editar'))} />} />;
  if (state !== 'ready') return <StateView state={state} action={<Button title="Reintentar" variant="secondary" onPress={load} />} />;
  return (<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>{likes != null && <Muted>{likes} likes hoy</Muted>}</View>
    {cur && <ProfileCard p={cur} footer={<View style={{ marginTop: 16 }}><View style={{ flexDirection: 'row', gap: 12 }}><Button title="Pasar" variant="secondary" style={{ flex: 1 }} disabled={busy} onPress={() => act('pass')} accessibilityLabel={`Pasar de ${cur.displayName}`} /><Button title="Me gusta" style={{ flex: 1 }} disabled={busy} onPress={() => act('like')} accessibilityLabel={`Me gusta ${cur.displayName}`} /></View><Button title="Denunciar o bloquear" variant="ghost" onPress={() => setReport(cur)} style={{ marginTop: 4 }} /></View>} />}
    <Muted style={{ textAlign: 'center', marginTop: 12, fontSize: 12 }}>Botones accesibles: no necesitas deslizar. Pasar no avisa a la otra persona.</Muted>
    {report && <ReportSheet target={report} onClose={(done) => { setReport(null); if (done) setQueue((q) => q.filter((x) => x.id !== report.id)); }} />}
  </ScrollView>);
}
