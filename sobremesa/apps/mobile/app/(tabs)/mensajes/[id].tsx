import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import type { Message } from '@sobremesa/shared';
import { api, ApiError } from '@/lib/api';
import { useRealtime } from '@/lib/realtime';
import { useAuth } from '@/lib/auth';
import { Button, Muted, StateView } from '@/components/ui';
import { ReportSheet } from '@/components/ReportSheet';
import { colors } from '@/lib/theme';
type Pending = { clientId: string; body: string; status: 'sending' | 'queued' | 'failed'; error?: string };
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>(); const router = useRouter(); const nav = useNavigation(); const { user } = useAuth();
  const [conv, setConv] = useState<any>(null); const [msgs, setMsgs] = useState<Message[]>([]); const [pending, setPending] = useState<Pending[]>([]); const [text, setText] = useState(''); const [err, setErr] = useState<ApiError | null>(null); const [sugs, setSugs] = useState<any[] | null>(null); const [report, setReport] = useState(false);
  const lastSeq = useRef(0); const list = useRef<FlatList>(null);
  const sync = useCallback(async () => { const r = await api<{ messages: Message[] }>(`/conversations/${id}/messages?after=${lastSeq.current}&limit=100`); if (r.messages.length) { setMsgs((m) => merge(m, r.messages)); lastSeq.current = Math.max(lastSeq.current, ...r.messages.map((x) => x.seq)); api(`/conversations/${id}/read`, { method: 'POST', json: { seq: lastSeq.current } }).catch(() => {}); } }, [id]);
  useEffect(() => { api<{ conversation: any }>(`/conversations/${id}`).then(async (r) => { setConv(r.conversation); nav.setOptions({ title: r.conversation.other.displayName }); await sync(); }).catch((e: ApiError) => setErr(e)); }, [id, sync, nav]);
  const { connected, send } = useRealtime((e) => {
    if (e.type === 'message.new' && e.message.conversationId === id) { setMsgs((m) => merge(m, [e.message])); lastSeq.current = Math.max(lastSeq.current, e.message.seq); setPending((p) => p.filter((x) => x.clientId !== e.message.clientId)); setConv((c: any) => (c ? { ...c, initiation: 'started' } : c)); api(`/conversations/${id}/read`, { method: 'POST', json: { seq: e.message.seq } }).catch(() => {}); }
    if (e.type === 'message.ack') setPending((p) => p.filter((x) => x.clientId !== e.clientId));
    if (e.type === 'error' && (e as any).clientId) setPending((p) => p.map((x) => (x.clientId === (e as any).clientId ? { ...x, status: 'failed', error: e.message } : x)));
    if (e.type === 'conversation.removed' && e.conversationId === id) router.back();
  });
  useEffect(() => { if (connected) { sync(); setPending((q) => { q.filter((x) => x.status === 'queued').forEach((x) => deliver({ ...x, status: 'sending' })); return q.map((x) => (x.status === 'queued' ? { ...x, status: 'sending' as const } : x)); }); } /* eslint-disable-next-line */ }, [connected]);
  async function deliver(p: Pending) {
    try { const r = await api<{ message: Message }>(`/conversations/${id}/messages`, { method: 'POST', json: { clientId: p.clientId, body: p.body } }); setMsgs((m) => merge(m, [r.message])); lastSeq.current = Math.max(lastSeq.current, r.message.seq); setPending((q) => q.filter((x) => x.clientId !== p.clientId)); setConv((c: any) => (c ? { ...c, initiation: 'started' } : c)); }
    catch (e) { const a = e as ApiError; setPending((q) => q.map((x) => (x.clientId === p.clientId ? { ...x, status: a.status === 0 ? 'queued' : 'failed', error: a.status === 0 ? undefined : a.message } : x))); }
  }
  function submit() { const body = text.trim(); if (!body) return; const p: Pending = { clientId: newId(), body, status: 'sending' }; setPending((q) => [...q, p]); setText(''); setSugs(null); if (!send({ type: 'message.send', conversationId: id, clientId: p.clientId, body })) deliver(p); }
  if (err) return <StateView state={err.status === 404 ? 'empty' : 'error'} title={err.status === 404 ? 'Conversación no disponible' : undefined} body={err.status === 404 ? 'Esta conexión terminó o ya no está disponible.' : err.message} action={<Button title="Volver" variant="secondary" onPress={() => router.back()} />} />;
  if (!conv || !user) return <StateView state="loading" />;
  const canWrite = conv.initiation !== 'them';
  const data: Array<{ key: string; mine: boolean; body: string; meta: string; failed?: boolean; retry?: () => void }> = [
    ...msgs.map((m) => ({ key: m.id, mine: m.senderId === user.id, body: m.body, meta: new Date(m.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) })),
    ...pending.map((p) => ({ key: p.clientId, mine: true, body: p.body, meta: p.status === 'queued' ? 'En cola (sin conexión)' : p.status === 'failed' ? `No enviado: ${p.error}` : 'Enviando…', failed: p.status === 'failed', retry: p.status === 'failed' ? () => deliver({ ...p, status: 'sending' }) : undefined })),
  ];
  return (<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90} style={{ flex: 1 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6 }}><Muted>{connected ? 'En línea con el servidor' : 'Reconectando…'}</Muted><Pressable accessibilityRole="button" accessibilityLabel="Más opciones" onPress={() => Alert.alert('Opciones', undefined, [{ text: 'Denunciar o bloquear', onPress: () => setReport(true) }, { text: 'Deshacer conexión', style: 'destructive', onPress: async () => { await api(`/matches/${conv.matchId}`, { method: 'DELETE' }); router.back(); } }, { text: 'Cancelar', style: 'cancel' }])}><Text style={{ color: colors.wine, fontSize: 20, paddingHorizontal: 8 }}>⋯</Text></Pressable></View>
    <FlatList ref={list} data={data} keyExtractor={(x) => x.key} contentContainerStyle={{ padding: 16, gap: 8 }} onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })} ListHeaderComponent={msgs.length === 0 ? (<View style={{ backgroundColor: colors.paper, borderRadius: 16, padding: 16, marginBottom: 8 }}><Text style={{ color: colors.inkSoft, textAlign: 'center' }}>{conv.initiation === 'them' ? 'En esta conexión, ella da el primer paso. Cuando escriba, podrás responder.' : conv.initiation === 'you' ? 'Tú das el primer paso. Escribe cuando quieras; sin prisa.' : 'Cualquiera de los dos puede iniciar.'}</Text></View>) : undefined}
      renderItem={({ item }) => (<View style={{ alignItems: item.mine ? 'flex-end' : 'flex-start' }}><View style={{ maxWidth: '80%', backgroundColor: item.mine ? colors.wine : colors.paper, borderRadius: 18, padding: 12, borderWidth: item.failed ? 2 : 0, borderColor: colors.danger }}><Text style={{ color: item.mine ? colors.cream : colors.ink, fontSize: 16 }}>{item.body}</Text><Text style={{ color: item.mine ? 'rgba(250,244,238,0.7)' : colors.inkMuted, fontSize: 11, marginTop: 4 }}>{item.meta}{item.retry ? <Text onPress={item.retry} style={{ textDecorationLine: 'underline' }}>  Reintentar</Text> : null}</Text></View></View>)} />
    {sugs && <View style={{ backgroundColor: colors.paper, margin: 12, borderRadius: 16, padding: 12 }}><Muted style={{ marginBottom: 6 }}>Sugerencias (plantillas): nada se envía hasta que pulses Enviar.</Muted>{sugs.map((s, i) => <Pressable key={i} onPress={() => { setText(s.text); setSugs(null); }} style={{ paddingVertical: 8 }}><Text>{s.kind === 'plan' ? '📍 ' : '💬 '}{s.text}</Text></Pressable>)}</View>}
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.cream2, backgroundColor: colors.cream }}>
      <Button title="✦" variant="secondary" accessibilityLabel="Rompehielos y propuestas de plan" disabled={!canWrite} onPress={async () => setSugs((await api<{ suggestions: any[] }>(`/conversations/${id}/icebreakers`)).suggestions)} />
      <TextInput accessibilityLabel="Mensaje" placeholder={canWrite ? 'Escribe un mensaje…' : 'Ella escribe primero'} placeholderTextColor={colors.inkMuted} editable={canWrite} multiline maxLength={2000} value={text} onChangeText={setText} style={{ flex: 1, minHeight: 48, maxHeight: 120, backgroundColor: colors.paper, borderRadius: 12, borderWidth: 1, borderColor: colors.cream2, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.ink }} />
      <Button title="Enviar" disabled={!canWrite || !text.trim()} onPress={submit} />
    </View>
    {report && <ReportSheet target={conv.other} conversationId={id} onClose={(done) => { setReport(false); if (done) router.back(); }} />}
  </KeyboardAvoidingView>);
}
function merge(a: Message[], b: Message[]) { const m = new Map(a.map((x) => [x.id, x])); for (const x of b) m.set(x.id, x); return [...m.values()].sort((x, y) => x.seq - y.seq); }
