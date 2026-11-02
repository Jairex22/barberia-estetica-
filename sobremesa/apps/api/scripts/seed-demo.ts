/**
 * Datos de DEMOSTRACIÓN, claramente marcados (users.is_demo = true, nombre con "(Demostración)").
 * Solo aparecen en Descubrir cuando DEMO_MODE=true. En producción (DEMO_MODE=false) están excluidos por SQL.
 * Ejecutar: pnpm db:seed:demo   (se niega a correr si NODE_ENV=production)
 */
import sharp from 'sharp';
import { createDb } from '../src/db/client.js';
import { users, profiles, photos, notificationPrefs } from '../src/db/schema.js';
import { hashPassword, randomToken } from '../src/services/crypto.js';
import { getStorage } from '../src/services/storage.js';
import { eq } from 'drizzle-orm';

if (process.env.NODE_ENV === 'production') { console.error('No se siembran datos de demostración en producción.'); process.exit(1); }
const { db, sql } = createDb();

const DEMO = [
  { email: 'demo.ana@sobremesa.demo', name: 'Ana', gender: 'mujer', interestedIn: 'hombres', birthdate: '1995-03-12', bio: 'Diseñadora. Café de especialidad, caminatas en Colomos y cine de autor. Busco algo serio, sin prisa.', intent: 'relacion_seria', interests: ['cafe', 'senderismo', 'cine', 'museos'], planTypes: ['cafe', 'caminata'], idealPlan: 'Café en Americana y caminar sin rumbo', color: [214, 104, 84], lat: 20.675, lng: -103.37 },
  { email: 'demo.luis@sobremesa.demo', name: 'Luis', gender: 'hombre', interestedIn: 'mujeres', birthdate: '1991-08-25', bio: 'Ingeniero, corro los domingos y cocino entre semana. Prefiero una buena plática a mil mensajes.', intent: 'relacion_seria', interests: ['running', 'cocinar', 'cafe', 'conciertos'], planTypes: ['cafe', 'cena'], idealPlan: 'Cenar algo que yo cocine y comparar playlists', color: [92, 76, 120], lat: 20.69, lng: -103.35 },
  { email: 'demo.sofia@sobremesa.demo', name: 'Sofía', gender: 'mujer', interestedIn: 'todas', birthdate: '1993-11-02', bio: 'Arquitecta recién llegada de Querétaro. Me gustan los mercados, el mezcal y las exposiciones pequeñas.', intent: 'conocer_gente', interests: ['mercados_y_tianguis', 'mezcal_y_vino', 'arte', 'fotografia'], planTypes: ['cultural', 'copa'], idealPlan: 'Expo en el Cabañas y una copa después', color: [178, 60, 72], lat: 20.68, lng: -103.34 },
  { email: 'demo.diego@sobremesa.demo', name: 'Diego', gender: 'hombre', interestedIn: 'hombres', birthdate: '1989-01-30', bio: 'Médico. Escalada en boulder, perros y domingos de brunch. Honesto y directo.', intent: 'relacion_seria', interests: ['escalada', 'perros', 'cafe', 'lectura'], planTypes: ['actividad', 'comida'], idealPlan: 'Boulder y después unos chilaquiles', color: [60, 110, 100], lat: 20.66, lng: -103.39 },
  { email: 'demo.valeria@sobremesa.demo', name: 'Valeria', gender: 'mujer', interestedIn: 'hombres', birthdate: '1986-06-15', bio: 'Mamá de una niña de 7. Abogada. Tiempo limitado, intenciones claras. Teatro y buena comida.', intent: 'relacion_seria', interests: ['teatro', 'cena', 'lectura', 'yoga'], planTypes: ['cena', 'cultural'], idealPlan: 'Función de teatro y cenar cerca', color: [196, 140, 90], lat: 20.70, lng: -103.41 },
  { email: 'demo.mateo@sobremesa.demo', name: 'Mateo', gender: 'no_binario', interestedIn: 'todas', birthdate: '1997-09-09', bio: 'Ilustre. Karaoke sin vergüenza, ciclismo urbano y juegos de mesa. Busco conocer gente linda.', intent: 'conocer_gente', interests: ['karaoke', 'ciclismo', 'juegos_de_mesa', 'arte'], planTypes: ['actividad', 'copa'], idealPlan: 'Juegos de mesa y cerveza artesanal', color: [120, 90, 160], lat: 20.67, lng: -103.36 },
] as const;

const password = await hashPassword('Demostracion123!');
let n = 0;
for (const d of DEMO) {
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, d.email)).limit(1);
  if (exists.length) continue;
  const [u] = await db.insert(users).values({ email: d.email, passwordHash: password, birthdate: d.birthdate, emailVerifiedAt: new Date().toISOString(), isDemo: true, locale: 'es', lastActiveAt: new Date().toISOString() }).returning();
  await db.insert(profiles).values({ userId: u!.id, displayName: `${d.name} (Demostración)`, bio: d.bio, gender: d.gender, interestedIn: d.interestedIn, intent: d.intent, interests: [...d.interests], planTypes: [...d.planTypes], idealPlan: d.idealPlan, city: 'Guadalajara', latCoarse: d.lat, lngCoarse: d.lng, prefAgeMin: 24, prefAgeMax: 50, completedAt: new Date().toISOString() });
  await db.insert(notificationPrefs).values({ userId: u!.id, unsubscribeToken: randomToken(24) });
  // Imagen ilustrativa generada (sin personas reales), con etiqueta "DEMOSTRACIÓN".
  const [r, g, b] = d.color;
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(${r},${g},${b})"/><stop offset="1" stop-color="rgb(${Math.max(0, r - 90)},${Math.max(0, g - 60)},${Math.max(0, b - 50)})"/></linearGradient></defs><rect width="900" height="1200" fill="url(#g)"/><circle cx="450" cy="470" r="190" fill="rgba(255,240,230,0.25)"/><text x="450" y="1080" font-family="Georgia, serif" font-size="88" fill="rgba(255,255,255,0.92)" text-anchor="middle">${d.name}</text><text x="450" y="1150" font-family="Arial, sans-serif" font-size="40" letter-spacing="6" fill="rgba(255,255,255,0.85)" text-anchor="middle">DEMOSTRACIÓN</text></svg>`);
  const img = await sharp(svg).webp({ quality: 80 }).toBuffer();
  const key = `photos/${u!.id}/demo.webp`;
  await getStorage().put(key, img, 'image/webp');
  await db.insert(photos).values({ userId: u!.id, storageKey: key, position: 0, status: 'approved', width: 900, height: 1200, moderationNotes: 'demo generada' });
  n++;
}
console.log(`Demostración: ${n} perfiles creados (contraseña: Demostracion123!). Visibles solo con DEMO_MODE=true.`);
await sql.end();
