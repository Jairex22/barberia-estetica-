import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import type { PublicProfile } from '@sobremesa/shared';
import { Badge, Card, Chip } from './ui';
import { colors } from '@/lib/theme';
export const label = (k: string | null | undefined) => { if (!k) return ''; const t = k.replace(/_/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };
const DIST: Record<string, string> = { muy_cerca: 'Muy cerca', cerca: 'Cerca', misma_zona: 'Misma zona', lejos: 'Lejos' };
const INTENT: Record<string, string> = { relacion_seria: 'Relación seria', conocer_gente: 'Conocer gente', algo_casual: 'Algo casual', no_lo_se: 'Aún no lo sé' };
export function ProfileCard({ p, footer }: { p: PublicProfile; footer?: React.ReactNode }) {
  const [i, setI] = useState(0); const photo = p.photos[i] ?? p.photos[0];
  return (<Card style={{ padding: 0, overflow: 'hidden' }} >
    <View style={{ aspectRatio: 3 / 4, backgroundColor: colors.cream2 }}>
      {photo ? <Image source={{ uri: photo.url }} style={{ width: '100%', height: '100%' }} accessibilityLabel={`Foto ${i + 1} de ${p.displayName}`} /> : null}
      {p.photos.length > 1 && <View style={{ position: 'absolute', top: 8, left: 8, right: 8, flexDirection: 'row', gap: 4 }}>{p.photos.map((ph, k) => <Pressable key={ph.id} accessibilityRole="tab" accessibilityLabel={`Foto ${k + 1}`} onPress={() => setI(k)} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: k === i ? '#fff' : 'rgba(255,255,255,0.4)' }} />)}</View>}
      <View style={{ position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', gap: 6 }}>{p.isDemo && <Badge>Demostración</Badge>}{p.verified && <Badge kind="ok">✓ Verificado</Badge>}{p.distanceBucket && <View style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}><Text style={{ fontSize: 12, color: colors.inkSoft }}>{DIST[p.distanceBucket]}</Text></View>}</View>
    </View>
    <View style={{ padding: 16 }}>
      <Text accessibilityRole="header" style={{ fontFamily: 'Georgia', fontSize: 24, fontWeight: '600', color: colors.ink }}>{p.displayName}{p.age ? <Text style={{ color: colors.inkMuted, fontWeight: '400' }}>, {p.age}</Text> : null}</Text>
      <Text style={{ color: colors.inkMuted, fontSize: 13 }}>{[p.occupation, p.city, p.intent ? INTENT[p.intent] : null].filter(Boolean).join(' · ')}</Text>
      {p.bio ? <Text style={{ color: colors.inkSoft, marginTop: 10, lineHeight: 22 }}>{p.bio}</Text> : null}
      {p.idealPlan ? <Text style={{ marginTop: 10 }}><Text style={{ color: colors.inkMuted, fontSize: 13 }}>Plan ideal: </Text>{p.idealPlan}</Text> : null}
      {p.signals && (p.signals.sharedInterests.length > 0 || p.signals.sameIntent) ? <View style={{ backgroundColor: colors.cream, borderRadius: 12, padding: 12, marginTop: 12 }}><Text style={{ fontWeight: '600', color: colors.inkSoft, fontSize: 13 }}>Por qué te mostramos a {p.displayName}</Text>{p.signals.sharedInterests.length > 0 && <Text style={{ color: colors.inkSoft, fontSize: 13 }}>• Comparten: {p.signals.sharedInterests.map(label).join(', ')}</Text>}{p.signals.sameIntent && <Text style={{ color: colors.inkSoft, fontSize: 13 }}>• Misma intención: {INTENT[p.intent ?? ''] ?? ''}</Text>}</View> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>{p.interests.map((x) => <Chip key={x} label={label(x)} on={p.signals?.sharedInterests.includes(x) ?? false} onPress={() => {}} />)}</ScrollView>
      {footer}
    </View>
  </Card>);
}
