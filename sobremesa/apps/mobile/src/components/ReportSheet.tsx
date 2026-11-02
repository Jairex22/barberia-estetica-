import { useState } from 'react';
import { Modal, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { REPORT_REASONS } from '@sobremesa/shared';
import { api, ApiError } from '@/lib/api';
import { Button, Chip, Title } from './ui';
import { colors } from '@/lib/theme';
const R: Record<string, string> = { perfil_falso: 'Perfil falso', menor_de_edad: 'Parece menor de edad', contenido_sexual: 'Contenido sexual', acoso: 'Acoso', estafa_o_spam: 'Estafa o spam', violencia_o_amenaza: 'Violencia o amenaza', fuera_de_la_app: 'Fuera de la app', otro: 'Otro' };
export function ReportSheet({ target, conversationId, onClose }: { target: { id: string; displayName: string }; conversationId?: string; onClose: (done: boolean) => void }) {
  const [reason, setReason] = useState(''); const [details, setDetails] = useState(''); const [alsoBlock, setAlsoBlock] = useState(true); const [msg, setMsg] = useState<string | null>(null); const [done, setDone] = useState(false);
  return (<Modal animationType="slide" transparent onRequestClose={() => onClose(done)}><View style={{ flex: 1, backgroundColor: 'rgba(29,20,19,0.6)', justifyContent: 'flex-end' }}><View style={{ backgroundColor: colors.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' }}><ScrollView>
    {done ? <><Title>Gracias por avisarnos</Title><Text style={{ color: colors.inkSoft, marginVertical: 12 }}>Revisaremos el caso. La otra persona no sabrá quién lo reportó.{alsoBlock ? ' También quedó bloqueada.' : ''}</Text><Button title="Cerrar" onPress={() => onClose(true)} /></> : <>
      <Title>Denunciar o bloquear a {target.displayName}</Title>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>{REPORT_REASONS.map((r) => <Chip key={r} role="radio" label={R[r]} on={reason === r} onPress={() => setReason(r)} />)}</View>
      <TextInput accessibilityLabel="Detalles (opcional)" placeholder="Detalles (opcional)" placeholderTextColor={colors.inkMuted} multiline value={details} onChangeText={setDetails} maxLength={1000} style={{ minHeight: 80, borderWidth: 1, borderColor: colors.cream2, borderRadius: 12, padding: 12, marginTop: 8, color: colors.ink }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12 }}><Text style={{ color: colors.inkSoft, flex: 1 }}>Bloquear también</Text><Switch value={alsoBlock} onValueChange={setAlsoBlock} trackColor={{ true: colors.wine }} /></View>
      {msg && <Text accessibilityRole="alert" style={{ color: colors.danger }}>{msg}</Text>}
      <View style={{ flexDirection: 'row', gap: 10 }}><Button title="Cancelar" variant="secondary" style={{ flex: 1 }} onPress={() => onClose(false)} /><Button title="Enviar" variant="danger" style={{ flex: 1 }} disabled={!reason} onPress={async () => { try { await api('/safety/report', { method: 'POST', json: { targetUserId: target.id, reason, details: details || undefined, conversationId, alsoBlock } }); setDone(true); } catch (e) { setMsg((e as ApiError).message); } }} /></View>
      <Button title="Solo bloquear, sin denunciar" variant="ghost" onPress={async () => { try { await api('/safety/block', { method: 'POST', json: { targetUserId: target.id } }); setAlsoBlock(true); setDone(true); } catch (e) { setMsg((e as ApiError).message); } }} />
    </>}
  </ScrollView></View></View></Modal>);
}
