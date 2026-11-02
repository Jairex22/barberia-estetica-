import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { INTERESTS, PLAN_TYPES, RELATIONSHIP_INTENTS } from '@sobremesa/shared';
import { api, ApiError, API_URL, getToken } from '@/lib/api';
import { Button, Chip, Field, Muted, StateView } from '@/components/ui';
import { label } from '@/components/ProfileCard';
import { colors } from '@/lib/theme';
const INTENT: Record<string, string> = { relacion_seria: 'Relación seria', conocer_gente: 'Conocer gente', algo_casual: 'Algo casual', no_lo_se: 'Aún no lo sé' };
export default function Editar() {
  const [p, setP] = useState<any>(null); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null); const [geo, setGeo] = useState<'idle' | 'denied' | 'ok'>('idle');
  const load = () => api('/profile/me').then((r) => setP(r.profile)).catch((e: ApiError) => setMsg(e.message));
  useEffect(() => { load(); }, []);
  if (!p) return <StateView state="loading" />;
  const toggle = (k: string, v: string, max: number) => setP((s: any) => { const has = s[k].includes(v); if (!has && s[k].length >= max) return s; return { ...s, [k]: has ? s[k].filter((x: string) => x !== v) : [...s[k], v] }; });
  async function pick() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!perm.granted) { setMsg('Sin permiso para fotos. Puedes darlo en Ajustes del sistema.'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, exif: false }); if (r.canceled) return;
    const asset = r.assets[0]; const fd = new FormData(); fd.append('file', { uri: asset.uri, name: 'foto.jpg', type: asset.mimeType ?? 'image/jpeg' } as any);
    setBusy(true); try { const res = await fetch(`${API_URL}/profile/me/photos`, { method: 'POST', headers: { Authorization: `Bearer ${await getToken()}` }, body: fd }); if (!res.ok) throw new Error((await res.json())?.error?.message ?? 'No se pudo subir'); await load(); setMsg('Foto subida: pasará por revisión (sin metadatos de ubicación).'); } catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  }
  async function save() {
    setBusy(true); setMsg(null);
    try { const body: any = { displayName: p.displayName, bio: p.bio, intent: p.intent ?? undefined, interests: p.interests, planTypes: p.planTypes, idealPlan: p.idealPlan ?? '', occupation: p.occupation ?? '', city: p.city ?? '', showAge: p.showAge, showDistance: p.showDistance, prefAgeMin: p.prefAgeMin, prefAgeMax: p.prefAgeMax, prefMaxDistanceKm: p.prefMaxDistanceKm }; if (loc) body.location = loc;
      const r = await api('/profile/me', { method: 'PATCH', json: body }); setP(r.profile); setMsg(r.profile.completedAt ? 'Guardado. Tu perfil está completo.' : 'Guardado. Faltan datos para aparecer en Descubrir (presentación 20+ caracteres, qué buscas, 2 intereses, una foto).'); }
    catch (e) { setMsg((e as ApiError).message); } finally { setBusy(false); }
  }
  return (<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
    <Text style={{ color: colors.inkSoft, marginBottom: 8 }}>Fotos (máx. 6) · se revisan antes de publicarse</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{p.photos.map((ph: any) => <View key={ph.id} style={{ width: '31%', aspectRatio: 3 / 4, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.cream2 }}><Image source={{ uri: ph.url }} style={{ width: '100%', height: '100%' }} /><Text style={{ position: 'absolute', top: 4, left: 4, fontSize: 10, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 4, borderRadius: 4 }}>{ph.status === 'approved' ? 'Aprobada' : ph.status === 'rejected' ? 'Rechazada' : 'En revisión'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Eliminar foto" onPress={() => Alert.alert('Eliminar foto', '¿Seguro?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: async () => { await api(`/profile/me/photos/${ph.id}`, { method: 'DELETE' }); load(); } }])} style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}><Text>✕</Text></Pressable></View>)}{p.photos.length < 6 && <Pressable accessibilityRole="button" onPress={pick} disabled={busy} style={{ width: '31%', aspectRatio: 3 / 4, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.cream2, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.inkMuted }}>+ Añadir</Text></Pressable>}</View>
    <View style={{ height: 16 }} />
    <Field label="Nombre" value={p.displayName} onChangeText={(v) => setP({ ...p, displayName: v })} maxLength={30} />
    <Field label="Presentación (mín. 20 caracteres)" value={p.bio} onChangeText={(v) => setP({ ...p, bio: v })} multiline maxLength={500} style={{ minHeight: 100, textAlignVertical: 'top', borderRadius: 12, borderWidth: 1, borderColor: colors.cream2, backgroundColor: colors.paper, padding: 12, fontSize: 16 }} />
    <Field label="Plan ideal para una primera cita" value={p.idealPlan ?? ''} onChangeText={(v) => setP({ ...p, idealPlan: v })} maxLength={160} />
    <Field label="Ocupación (opcional)" value={p.occupation ?? ''} onChangeText={(v) => setP({ ...p, occupation: v })} maxLength={60} />
    <Text style={{ color: colors.inkSoft, marginBottom: 6 }}>Qué busco</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{RELATIONSHIP_INTENTS.map((i) => <Chip key={i} role="radio" label={INTENT[i]} on={p.intent === i} onPress={() => setP({ ...p, intent: i })} />)}</View>
    <Text style={{ color: colors.inkSoft, marginBottom: 6 }}>Intereses ({p.interests.length}/12, mínimo 2)</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{INTERESTS.map((i) => <Chip key={i} label={label(i)} on={p.interests.includes(i)} onPress={() => toggle('interests', i, 12)} />)}</View>
    <Text style={{ color: colors.inkSoft, marginBottom: 6 }}>Tipos de plan ({p.planTypes.length}/5)</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{PLAN_TYPES.map((i) => <Chip key={i} label={label(i)} on={p.planTypes.includes(i)} onPress={() => toggle('planTypes', i, 5)} />)}</View>
    <View style={{ flexDirection: 'row', gap: 12 }}><View style={{ flex: 1 }}><Field label="Edad mínima" keyboardType="number-pad" value={String(p.prefAgeMin)} onChangeText={(v) => setP({ ...p, prefAgeMin: Number(v) || 18 })} /></View><View style={{ flex: 1 }}><Field label="Edad máxima" keyboardType="number-pad" value={String(p.prefAgeMax)} onChangeText={(v) => setP({ ...p, prefAgeMax: Number(v) || 99 })} /></View></View>
    <Field label="Distancia máxima (km, 5–200)" keyboardType="number-pad" value={String(p.prefMaxDistanceKm)} onChangeText={(v) => setP({ ...p, prefMaxDistanceKm: Math.min(200, Math.max(5, Number(v) || 40)) })} />
    <View style={{ backgroundColor: colors.paper, borderRadius: 16, padding: 14, marginBottom: 14 }}><Text style={{ fontWeight: '600' }}>Ubicación aproximada</Text><Muted>Guardamos tu posición redondeada a ~1 km y solo mostramos rangos. {p.hasLocation ? 'Ya tienes ubicación guardada.' : 'Aún sin ubicación.'}</Muted>
      <Button title="Usar mi ubicación aproximada" variant="secondary" style={{ marginTop: 10 }} onPress={async () => { const perm = await Location.requestForegroundPermissionsAsync(); if (!perm.granted) { setGeo('denied'); return; } const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }); setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeo('ok'); }} />
      {geo === 'denied' && <Text accessibilityLiveRegion="polite" style={{ color: colors.inkSoft, marginTop: 8 }}>Sin permiso de ubicación. No pasa nada: indica tu ciudad abajo y seguirás apareciendo.</Text>}{geo === 'ok' && <Text style={{ color: colors.sage, marginTop: 8 }}>Ubicación lista; se guardará redondeada al pulsar Guardar.</Text>}
      <View style={{ marginTop: 10 }}><Field label="Ciudad" value={p.city ?? ''} onChangeText={(v) => setP({ ...p, city: v })} /></View></View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}><Text>Mostrar mi edad</Text><Switch value={p.showAge} onValueChange={(v) => setP({ ...p, showAge: v })} trackColor={{ true: colors.wine }} /></View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}><Text>Mostrar mi distancia aproximada</Text><Switch value={p.showDistance} onValueChange={(v) => setP({ ...p, showDistance: v })} trackColor={{ true: colors.wine }} /></View>
    {msg && <Text accessibilityLiveRegion="polite" style={{ color: msg.startsWith('Guardado') || msg.startsWith('Foto') ? colors.sage : colors.danger, marginVertical: 10 }}>{msg}</Text>}
    <Button title={busy ? 'Guardando…' : 'Guardar'} disabled={busy} onPress={save} style={{ marginTop: 10 }} />
  </ScrollView>);
}
