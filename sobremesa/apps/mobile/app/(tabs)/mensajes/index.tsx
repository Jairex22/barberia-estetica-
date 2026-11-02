import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import type { ConversationSummary } from '@sobremesa/shared';
import { api, ApiError } from '@/lib/api';
import { useRealtime } from '@/lib/realtime';
import { Badge, Button, Muted, StateView } from '@/components/ui';
import { colors } from '@/lib/theme';
const INIT: Record<string, string> = { them: 'Ella escribe primero', you: 'Tú das el primer paso', anyone: 'Cualquiera puede iniciar', started: '' };
export default function Inbox() {
  const router = useRouter(); const [c, setC] = useState<ConversationSummary[] | null>(null); const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => api<{ conversations: ConversationSummary[] }>('/conversations').then((r) => setC(r.conversations)).catch((e: ApiError) => setErr(e.message)), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useRealtime((e) => { if (e.type !== 'pong' && e.type !== 'message.ack') load(); });
  if (err) return <StateView state="error" body={err} action={<Button title="Reintentar" variant="secondary" onPress={load} />} />;
  if (!c) return <StateView state="loading" />;
  return (<FlatList data={c} keyExtractor={(x) => x.id} contentContainerStyle={{ padding: 16 }} ListEmptyComponent={<StateView state="empty" title="Sin conversaciones" body="Aquí aparecerán tus conexiones. Nunca verás mensajes inventados." />} renderItem={({ item }) => (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/(tabs)/mensajes/${item.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.paper, padding: 12, borderRadius: 16, marginBottom: 8 }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.cream2, overflow: 'hidden' }}>{item.other.photoUrl && <Image source={{ uri: item.other.photoUrl }} style={{ width: '100%', height: '100%' }} />}</View>
      <View style={{ flex: 1 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Text style={{ fontWeight: '600', fontSize: 16 }} numberOfLines={1}>{item.other.displayName}</Text>{item.other.isDemo && <Badge>Demo</Badge>}</View><Text numberOfLines={1} style={{ color: colors.inkMuted, fontSize: 14 }}>{item.lastMessage ? item.lastMessage.body : INIT[item.initiation]}</Text></View>
      {item.unreadCount > 0 && <View style={{ backgroundColor: colors.ember, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}><Text style={{ color: '#fff', fontSize: 12 }}>{item.unreadCount}</Text></View>}
    </Pressable>)} />);
}
