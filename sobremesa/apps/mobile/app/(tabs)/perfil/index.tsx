import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Muted, Title } from '@/components/ui';
import { colors } from '@/lib/theme';
export default function Perfil() {
  const { user, logout } = useAuth(); const router = useRouter(); const [p, setP] = useState<any>(null); const [ent, setEnt] = useState<any>(null);
  useFocusEffect(useCallback(() => { api('/profile/me').then((r) => setP(r.profile)).catch(() => {}); api('/billing/entitlement').then((r) => setEnt(r.entitlement)).catch(() => {}); }, []));
  const items: [string, string, string][] = [
    ['/(tabs)/perfil/editar', 'Editar perfil', 'Fotos, presentación, intereses, preferencias'],
    ['/(tabs)/perfil/premium', ent?.plan === 'premium' ? 'Premium activo' : 'Premium', ent?.plan === 'premium' ? `Hasta ${new Date(ent.premiumUntil).toLocaleDateString('es-MX')} · ${ent.channel}` : 'Qué incluye y precio local'],
    ['/(tabs)/perfil/ayuda', 'Ayuda', 'Asistente de IA y preguntas frecuentes'],
    ['/(tabs)/perfil/cuenta', 'Cuenta y privacidad', 'Pausar, eliminar, bloqueados, datos'],
  ];
  return (<ScrollView contentContainerStyle={{ padding: 16 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.cream2, overflow: 'hidden' }}>{p?.photos?.[0] && <Image source={{ uri: p.photos[0].url }} style={{ width: '100%', height: '100%' }} />}</View><View style={{ flex: 1 }}><Title>{p?.displayName ?? '…'}</Title><Muted>{user?.email} · {user?.plan === 'premium' ? 'Premium' : 'Gratis'}</Muted>{!user?.emailVerifiedAt && <Text style={{ color: colors.ember, fontSize: 13 }}>Verifica tu correo (revisa tu bandeja) para aparecer en Descubrir.</Text>}{p && !p.completedAt && <Text style={{ color: colors.ember, fontSize: 13 }}>Perfil incompleto: aún no apareces en Descubrir.</Text>}</View></View>
    <View style={{ backgroundColor: colors.paper, borderRadius: 16, marginTop: 20 }}>{items.map(([href, t, d], i) => <Pressable key={href} accessibilityRole="button" onPress={() => router.push(href as any)} style={{ padding: 16, borderTopWidth: i ? 1 : 0, borderTopColor: colors.cream2 }}><Text style={{ fontWeight: '600', fontSize: 16 }}>{t}</Text><Muted>{d}</Muted></Pressable>)}</View>
    <Button title="Cerrar sesión" variant="secondary" style={{ marginTop: 20 }} onPress={logout} />
  </ScrollView>);
}
