import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { api } from '@/lib/api';
import { Button, Field, Title } from '@/components/ui';
export default function Olvide() {
  const [email, setEmail] = useState(''); const [done, setDone] = useState(false);
  return (<ScrollView contentContainerStyle={{ padding: 20 }}><Title>Recuperar acceso</Title>{done ? <Text accessibilityLiveRegion="polite" style={{ marginTop: 16 }}>Si existe una cuenta con ese correo, enviamos un enlace válido 30 minutos. Ábrelo desde el correo.</Text> : <><Field label="Correo" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} /><Button title="Enviar enlace" onPress={async () => { await api('/auth/forgot-password', { method: 'POST', json: { email: email.trim() } }).catch(() => {}); setDone(true); }} /></>}</ScrollView>);
}
