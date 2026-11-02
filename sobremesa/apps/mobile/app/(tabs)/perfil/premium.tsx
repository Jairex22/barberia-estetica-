import { useEffect, useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getPremiumPackage, purchasePremium, purchasesAvailable, restorePurchases, unavailableReason } from '@/lib/purchases';
import { Button, Card, Muted, StateView, Title } from '@/components/ui';
import { colors } from '@/lib/theme';
export default function Premium() {
  const { user, refresh } = useAuth(); const [benefits, setBenefits] = useState<any[]>([]); const [pkg, setPkg] = useState<any>(null); const [ent, setEnt] = useState<any>(null); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { api('/billing/prices').then((r) => setBenefits(r.premiumBenefits)).catch(() => {}); api('/billing/entitlement').then((r) => setEnt(r.entitlement)).catch(() => {}); if (purchasesAvailable()) getPremiumPackage().then(setPkg).catch(() => setPkg(null)); }, []);
  if (!ent) return <StateView state="loading" />;
  const reason = unavailableReason();
  return (<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
    <Title>Premium</Title><Muted style={{ marginVertical: 8 }}>Conocer personas y chatear tras una conexión es gratis. Premium añade ventajas reales; no cambia quién inicia ni garantiza respuestas.</Muted>
    {benefits.map((b) => <Card key={b.key} style={{ marginBottom: 8, backgroundColor: b.key === 'never' ? colors.cream2 : colors.paper }}><Text style={{ color: colors.inkSoft }}>{b.es}</Text></Card>)}
    <Card style={{ marginTop: 12 }}>
      {ent.plan === 'premium' ? <><Text style={{ fontSize: 18, fontWeight: '600' }}>Premium activo</Text><Muted>Hasta {new Date(ent.premiumUntil).toLocaleDateString('es-MX', { dateStyle: 'long' })} · canal {ent.channel}{ent.cancelAtPeriodEnd ? ' · no se renovará' : ' · renovación automática'}</Muted>{ent.manageUrl && <Button title="Gestionar suscripción" variant="secondary" style={{ marginTop: 10 }} onPress={() => Linking.openURL(ent.manageUrl)} />}{(ent.channel === 'stripe' || ent.channel === 'mercadopago') && <Muted style={{ marginTop: 8 }}>Compraste en la web: cancela desde la web (Perfil → Suscripción) o con el botón de gestionar.</Muted>}</>
      : pkg ? <><Text style={{ fontSize: 22, fontWeight: '600' }}>{pkg.priceString} <Text style={{ fontSize: 14, color: colors.inkMuted }}>/ mes</Text></Text><Muted style={{ marginVertical: 8 }}>Precio local de la tienda con impuestos según su política. Renovación automática mensual hasta que la canceles en los ajustes de suscripciones de tu tienda. Premium se activa cuando la tienda confirma la compra.</Muted><Button title={busy ? 'Procesando…' : 'Suscribirme'} disabled={busy} onPress={async () => { setBusy(true); setMsg(null); try { const r = await purchasePremium(pkg.pkg); if (r === 'pending_server') { await refresh(); setMsg('Compra enviada. Premium se activa cuando la tienda la confirme (normalmente segundos).'); } } catch (e: any) { setMsg(e?.message ?? 'No se pudo completar la compra'); } finally { setBusy(false); } }} /></>
      : <><Text style={{ fontSize: 16, fontWeight: '600' }}>Compra en la tienda no disponible</Text><Muted style={{ marginTop: 6 }}>{reason ?? 'No se pudo cargar la oferta de la tienda.'}</Muted><Muted style={{ marginTop: 6 }}>No mostramos un botón de pago que no funcione. Si ya tienes Premium por la web, se sincroniza automáticamente con tu cuenta.</Muted></>}
      <Button title="Restaurar compras" variant="ghost" style={{ marginTop: 8 }} onPress={async () => { try { const r = await restorePurchases(); setMsg(r.available ? `Compras restauradas: ${r.restored}` : `Restaurar: ${r.reason}`); await refresh(); } catch (e) { setMsg((e as ApiError).message); } }} />
      {msg && <Text accessibilityLiveRegion="polite" style={{ color: colors.inkSoft, marginTop: 8 }}>{msg}</Text>}
    </Card>
    {user?.plan !== 'premium' && <Muted style={{ marginTop: 12, fontSize: 12 }}>Eliminar la cuenta no cancela una suscripción de App Store o Google Play: cancélala también en la tienda.</Muted>}
  </ScrollView>);
}
