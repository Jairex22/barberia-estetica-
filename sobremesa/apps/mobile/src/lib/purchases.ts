import { Platform } from 'react-native';
import { api } from './api';

/**
 * Compras en tienda vía RevenueCat (StoreKit 2 / Google Play Billing). app_user_id = id de usuario de Sobremesa.
 * Si no hay claves configuradas, el módulo informa "no disponible" y la app lo muestra tal cual; nunca simula una compra.
 * El acceso Premium lo decide el servidor con el webhook verificado de RevenueCat, no esta pantalla.
 */
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY; const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
let Purchases: any = null; let configured = false;
function load() { if (Purchases) return Purchases; try { Purchases = require('react-native-purchases').default; } catch { Purchases = null; } return Purchases; }
export function purchasesAvailable() { return Boolean(Platform.OS === 'ios' ? IOS_KEY : Platform.OS === 'android' ? ANDROID_KEY : false) && Boolean(load()); }
export function unavailableReason() {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return 'Las compras en tienda solo existen en iOS y Android.';
  if (!(Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY)) return 'La compra en la tienda aún no está configurada en esta versión (falta la clave de RevenueCat).';
  if (!load()) return 'El módulo nativo de compras no está incluido en este binario.';
  return null;
}
export async function configurePurchases(userId: string) {
  if (!purchasesAvailable() || configured) return;
  const P = load(); P.configure({ apiKey: (Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY)!, appUserID: userId }); configured = true;
}
export async function logoutPurchases() { if (configured) { try { await load().logOut(); } catch { /* anónimo */ } configured = false; } }
export async function getPremiumPackage(): Promise<{ priceString: string; identifier: string; pkg: any } | null> {
  if (!purchasesAvailable()) return null;
  const offerings = await load().getOfferings(); const pkg = offerings.current?.monthly ?? offerings.current?.availablePackages?.[0];
  return pkg ? { priceString: pkg.product.priceString, identifier: pkg.identifier, pkg } : null;
}
/** Compra: tras el flujo de la tienda, pedimos al SERVIDOR que verifique con RevenueCat (restore) en lugar de confiar en el cliente. */
export async function purchasePremium(pkg: any): Promise<'pending_server' | 'cancelled'> {
  try { await load().purchasePackage(pkg); } catch (e: any) { if (e?.userCancelled) return 'cancelled'; throw e; }
  await api('/billing/restore', { method: 'POST' }).catch(() => {});
  return 'pending_server';
}
export async function restorePurchases() { if (purchasesAvailable()) { try { await load().restorePurchases(); } catch { /* sin compras */ } } return api<{ restored: number; available: boolean; reason: string | null }>('/billing/restore', { method: 'POST' }); }
