import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Switch, Text, View } from 'react-native';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, Muted } from '@/components/ui';
import { colors } from '@/lib/theme';
const WEB = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://sobremesa.example';
export default function Cuenta() {
  const { user, refresh, logout } = useAuth(); const [blocks, setBlocks] = useState<any[]>([]); const [prefs, setPrefs] = useState<any>(null); const [msg, setMsg] = useState<string | null>(null);
  const load = () => { api('/safety/blocks').then((r) => setBlocks(r.blocks)).catch(() => {}); api('/notifications/prefs').then((r) => setPrefs(r.prefs)).catch(() => {}); };
  useEffect(load, []);
  const savePref = async (k: string, v: boolean) => { const r = await api('/notifications/prefs', { method: 'PATCH', json: { [k]: v } }); setPrefs(r.prefs); };
  return (<ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 60 }}>
    <Card><Text style={{ fontWeight: '600', fontSize: 16 }}>{user?.status === 'paused' ? 'Cuenta en pausa' : 'Pausar cuenta'}</Text><Muted style={{ marginTop: 4 }}>Ideal si encontraste pareja: dejas de aparecer en Descubrir y conservas conexiones y mensajes.</Muted><Button title={user?.status === 'paused' ? 'Reactivar' : 'Pausar'} variant="secondary" style={{ marginTop: 10 }} onPress={async () => { await api(user?.status === 'paused' ? '/account/resume' : '/account/pause', { method: 'POST' }); await refresh(); }} /></Card>
    {prefs && <Card><Text style={{ fontWeight: '600', fontSize: 16 }}>Notificaciones</Text><Muted>Avisos identificados como mensajes del sistema; seguridad y pagos siempre se envían.</Muted>{[['pushMatches', 'Nuevas conexiones'], ['pushMessages', 'Mensajes nuevos'], ['emailProduct', 'Correos de actividad'], ['emailMarketing', 'Novedades y eventos (promocional)']].map(([k, l]) => <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}><Text style={{ flex: 1 }}>{l}</Text><Switch value={!!prefs[k]} onValueChange={(v) => savePref(k, v)} trackColor={{ true: colors.wine }} accessibilityLabel={l} /></View>)}</Card>}
    <Card><Text style={{ fontWeight: '600', fontSize: 16 }}>Personas bloqueadas ({blocks.length})</Text>{blocks.length === 0 ? <Muted>No has bloqueado a nadie.</Muted> : blocks.map((b) => <View key={b.blockedId} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}><Text>Usuario bloqueado · {new Date(b.createdAt).toLocaleDateString('es-MX')}</Text><Button title="Desbloquear" variant="ghost" onPress={async () => { await api(`/safety/block/${b.blockedId}`, { method: 'DELETE' }); load(); }} /></View>)}</Card>
    <Card><Text style={{ fontWeight: '600', fontSize: 16 }}>Mis datos y verificación</Text><Muted>Descarga de datos, verificación por selfie, cambio de contraseña y sesiones están en la web con tu misma cuenta.</Muted><Button title="Abrir en la web" variant="secondary" style={{ marginTop: 10 }} onPress={() => Linking.openURL(`${WEB}/perfil/privacidad`)} /></Card>
    <Card style={{ borderWidth: 1, borderColor: colors.dangerSoft }}><Text style={{ fontWeight: '600', fontSize: 16, color: colors.danger }}>Eliminar cuenta</Text><Muted>Definitivo. Te enviamos un correo para confirmar. Si tienes Premium comprado en App Store o Google Play, cancélalo también en la tienda: eliminar la cuenta no lo cancela.</Muted><Button title="Solicitar eliminación" variant="danger" style={{ marginTop: 10 }} onPress={() => Alert.alert('Eliminar cuenta', 'Te enviaremos un correo de confirmación. ¿Continuar?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Enviar correo', style: 'destructive', onPress: async () => { try { const r = await api('/account/delete/request', { method: 'POST' }); setMsg(r.message + (r.storeSubscriptions?.length ? ` Tienes suscripción en ${r.storeSubscriptions.join(', ')}: cancélala en la tienda.` : '')); } catch (e) { setMsg((e as ApiError).message); } } }])} /></Card>
    {msg && <Text accessibilityLiveRegion="polite" style={{ color: colors.inkSoft }}>{msg}</Text>}
    <Button title="Cerrar sesión" variant="secondary" onPress={logout} />
  </ScrollView>);
}
