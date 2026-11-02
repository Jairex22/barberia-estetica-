import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View, Linking } from 'react-native';
import { GENDERS, INTERESTED_IN } from '@sobremesa/shared';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Chip, Field, Muted, Title } from '@/components/ui';
import { colors } from '@/lib/theme';
const L: Record<string, string> = { mujer: 'Mujer', hombre: 'Hombre', no_binario: 'No binario', otro: 'Otro', mujeres: 'Mujeres', hombres: 'Hombres', todas: 'Todas las personas' };
const WEB = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://sobremesa.example';
export default function Registro() {
  const { setSession } = useAuth();
  const [f, setF] = useState<any>({ displayName: '', email: '', password: '', birthdate: '', gender: '', interestedIn: '', confirmAdult: false, acceptTerms: false, acceptPrivacy: false, marketingOptIn: false });
  const [errors, setErrors] = useState<Record<string, string[]>>({}); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const set = (k: string, v: unknown) => setF((s: any) => ({ ...s, [k]: v }));
  const Row = ({ k, label }: { k: string; label: string }) => <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}><Text style={{ flex: 1, color: colors.inkSoft }}>{label}</Text><Switch value={!!f[k]} onValueChange={(v) => set(k, v)} trackColor={{ true: colors.wine }} accessibilityLabel={label} /></View>;
  return (<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
    <Title>Crear cuenta</Title><Muted style={{ marginBottom: 16 }}>Solo mayores de 18 años. Verificarás tu correo antes de aparecer en Descubrir.</Muted>
    <Field label="Nombre que verán los demás" value={f.displayName} onChangeText={(v) => set('displayName', v)} error={errors.displayName} maxLength={30} />
    <Field label="Correo" autoCapitalize="none" keyboardType="email-address" value={f.email} onChangeText={(v) => set('email', v)} error={errors.email} />
    <Field label="Contraseña" secureTextEntry value={f.password} onChangeText={(v) => set('password', v)} error={errors.password} hint="Mínimo 10 caracteres" />
    <Field label="Fecha de nacimiento (AAAA-MM-DD)" placeholder="1995-06-30" value={f.birthdate} onChangeText={(v) => set('birthdate', v)} error={errors.birthdate} hint="No se muestra; solo tu edad si lo autorizas." />
    <Text style={{ color: colors.inkSoft, marginBottom: 6 }}>Me identifico como</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{GENDERS.map((g) => <Chip key={g} role="radio" label={L[g]} on={f.gender === g} onPress={() => set('gender', g)} />)}</View>
    <Muted style={{ marginBottom: 10 }}>Solo usamos lo que declaras; nunca lo deducimos de tus fotos.</Muted>
    <Text style={{ color: colors.inkSoft, marginBottom: 6 }}>Quiero conocer</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>{INTERESTED_IN.map((g) => <Chip key={g} role="radio" label={L[g]} on={f.interestedIn === g} onPress={() => set('interestedIn', g)} />)}</View>
    <Row k="confirmAdult" label="Confirmo que tengo 18 años o más" /><Row k="acceptTerms" label="Acepto los Términos y las Normas de comunidad" /><Row k="acceptPrivacy" label="He leído el Aviso de privacidad" /><Row k="marketingOptIn" label="Quiero novedades por correo (opcional, máx. 1/semana)" />
    <Pressable onPress={() => Linking.openURL(`${WEB}/legal/terminos`)} accessibilityRole="link"><Text style={{ color: colors.wine, marginVertical: 8 }}>Leer Términos, Normas y Aviso de privacidad</Text></Pressable>
    {msg && <Text accessibilityRole="alert" style={{ color: colors.danger, marginBottom: 10 }}>{msg}</Text>}
    <Button title={busy ? 'Creando…' : 'Crear cuenta'} disabled={busy} onPress={async () => { setBusy(true); setErrors({}); setMsg(null); try { const r = await api<{ token: string }>('/auth/register', { method: 'POST', json: { ...f, email: f.email.trim(), device: 'móvil' } }); await setSession(r.token); } catch (e) { const a = e as ApiError; setErrors((a.details as any) ?? {}); setMsg(a.message); } finally { setBusy(false); } }} />
  </ScrollView></KeyboardAvoidingView>);
}
