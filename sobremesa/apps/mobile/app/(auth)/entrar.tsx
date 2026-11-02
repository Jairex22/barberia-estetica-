import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { BRAND } from '@sobremesa/shared';
import { useAuth } from '@/lib/auth';
import { Button, Field, Title, Muted } from '@/components/ui';
import { colors } from '@/lib/theme';
import { ApiError } from '@/lib/api';
export default function Entrar() {
  const { login } = useAuth(); const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  return (<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><ScrollView contentContainerStyle={{ padding: 20, paddingTop: 40 }} keyboardShouldPersistTaps="handled">
    <Text style={{ fontFamily: 'Georgia', fontSize: 40, color: colors.wine, fontWeight: '600' }}>● {BRAND.name}</Text><Muted style={{ marginBottom: 24 }}>{BRAND.tagline_es}</Muted>
    <Title>Entrar</Title><View style={{ height: 12 }} />
    <Field label="Correo" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} />
    <Field label="Contraseña" secureTextEntry autoComplete="password" value={pw} onChangeText={setPw} />
    {msg && <Text accessibilityRole="alert" style={{ color: colors.danger, marginBottom: 10 }}>{msg}</Text>}
    <Button title={busy ? 'Entrando…' : 'Entrar'} disabled={busy} onPress={async () => { setBusy(true); setMsg(null); try { await login(email.trim(), pw); } catch (e) { setMsg((e as ApiError).message); } finally { setBusy(false); } }} />
    <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' }}><Link href="/(auth)/registro" style={{ color: colors.wine }}>Crear cuenta</Link><Link href="/(auth)/olvide" style={{ color: colors.wine }}>Olvidé mi contraseña</Link></View>
  </ScrollView></KeyboardAvoidingView>);
}
