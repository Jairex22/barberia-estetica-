import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api, ApiError } from '@/lib/api';
import { Button, Chip, Muted, StateView } from '@/components/ui';
import { colors } from '@/lib/theme';
export default function Conexiones() {
  const router = useRouter(); const [m, setM] = useState<any[] | null>(null); const [likes, setLikes] = useState<any>(null); const [tab, setTab] = useState<'m' | 'l'>('m'); const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => Promise.all([api('/matches'), api('/discover/likes')]).then(([a, b]) => { setM(a.matches); setLikes(b); }).catch((e: ApiError) => setErr(e.message)), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (err) return <StateView state="error" body={err} action={<Button title="Reintentar" variant="secondary" onPress={load} />} />;
  if (!m || !likes) return <StateView state="loading" />;
  return (<View style={{ flex: 1, padding: 16 }}>
    <View style={{ flexDirection: 'row' }}><Chip label={`Conexiones (${m.length})`} on={tab === 'm'} onPress={() => setTab('m')} /><Chip label={`Likes recibidos (${likes.count})`} on={tab === 'l'} onPress={() => setTab('l')} /></View>
    {tab === 'm' ? (m.length === 0 ? <StateView state="empty" title="Aún no tienes conexiones" body="Cuando tú y otra persona se den like, aparecerá aquí." /> :
      <FlatList data={m} numColumns={2} keyExtractor={(x) => x.id} columnWrapperStyle={{ gap: 12 }} contentContainerStyle={{ gap: 12, paddingTop: 12 }} renderItem={({ item }) => (
        <Pressable accessibilityRole="button" accessibilityLabel={`Abrir conversación con ${item.other.displayName}`} onPress={() => router.push(`/(tabs)/mensajes/${item.conversationId}`)} style={{ flex: 1, backgroundColor: colors.paper, borderRadius: 16, overflow: 'hidden' }}>
          <View style={{ aspectRatio: 3 / 4, backgroundColor: colors.cream2 }}>{item.other.photoUrl ? <Image source={{ uri: item.other.photoUrl }} style={{ width: '100%', height: '100%' }} /> : null}</View>
          <View style={{ padding: 10 }}><Text style={{ fontWeight: '600' }} numberOfLines={1}>{item.other.displayName}</Text><Muted style={{ fontSize: 12 }}>{item.hasMessages ? 'Conversación iniciada' : 'Sin mensajes aún'}</Muted></View>
        </Pressable>)} />) :
      (likes.premiumRequired ? <View style={{ backgroundColor: colors.paper, borderRadius: 16, padding: 16, marginTop: 12 }}><Text style={{ fontSize: 17 }}>{likes.count === 0 ? 'Por ahora nadie te ha dado like. Es el número real.' : `${likes.count} ${likes.count === 1 ? 'persona te dio' : 'personas te dieron'} like.`}</Text><Muted style={{ marginTop: 6 }}>Con Premium puedes ver quiénes son. Sin Premium también los verás si coinciden contigo en Descubrir.</Muted>{likes.count > 0 && <Button title="Ver qué incluye Premium" style={{ marginTop: 12 }} onPress={() => router.push('/(tabs)/perfil/premium')} />}</View>
        : <FlatList data={likes.profiles ?? []} numColumns={2} keyExtractor={(x: any) => x.id} columnWrapperStyle={{ gap: 12 }} contentContainerStyle={{ gap: 12, paddingTop: 12 }} ListEmptyComponent={<StateView state="empty" title="Sin likes nuevos" body="Nadie te ha dado like todavía." />} renderItem={({ item }: any) => (
          <View style={{ flex: 1, backgroundColor: colors.paper, borderRadius: 16, overflow: 'hidden' }}><View style={{ aspectRatio: 3 / 4, backgroundColor: colors.cream2 }}>{item.photos[0] && <Image source={{ uri: item.photos[0].url }} style={{ width: '100%', height: '100%' }} />}</View><View style={{ padding: 10 }}><Text style={{ fontWeight: '600' }}>{item.displayName}{item.age ? `, ${item.age}` : ''}</Text><View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}><Button title="Pasar" variant="secondary" style={{ flex: 1, minHeight: 40 }} onPress={async () => { await api('/discover/swipe', { method: 'POST', json: { targetId: item.id, action: 'pass' } }); load(); }} /><Button title="Like" style={{ flex: 1, minHeight: 40 }} onPress={async () => { await api('/discover/swipe', { method: 'POST', json: { targetId: item.id, action: 'like' } }); load(); setTab('m'); }} /></View></View></View>)} />)}
  </View>);
}
