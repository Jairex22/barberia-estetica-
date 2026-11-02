import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type PressableProps, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, radius } from '@/lib/theme';

export function Button({ title, variant = 'primary', style, disabled, ...p }: PressableProps & { title: string; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; style?: ViewStyle }) {
  const bg = variant === 'primary' ? colors.wine : variant === 'secondary' ? colors.cream2 : variant === 'danger' ? colors.dangerSoft : 'transparent';
  const fg = variant === 'primary' ? colors.cream : variant === 'danger' ? colors.danger : variant === 'ghost' ? colors.wine : colors.ink;
  return (<Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }, style]} {...p}><Text style={[s.btnText, { color: fg }]}>{title}</Text></Pressable>);
}
export function Field({ label, error, hint, ...p }: TextInputProps & { label: string; error?: string | string[]; hint?: string }) {
  const err = Array.isArray(error) ? error.join(' ') : error;
  return (<View style={{ marginBottom: 14 }}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor={colors.inkMuted} style={[s.input, err ? { borderColor: colors.danger } : null]} {...p} />{hint && !err ? <Text style={s.hint}>{hint}</Text> : null}{err ? <Text accessibilityRole="alert" style={s.err}>{err}</Text> : null}</View>);
}
export function Chip({ label, on, onPress, role = 'button' }: { label: string; on: boolean; onPress: () => void; role?: 'button' | 'radio' }) {
  return (<Pressable accessibilityRole={role} accessibilityState={role === 'radio' ? { selected: on } : { selected: on }} onPress={onPress} style={[s.chip, on && { backgroundColor: colors.wine }]}><Text style={{ color: on ? colors.cream : colors.inkSoft, fontSize: 14 }}>{label}</Text></Pressable>);
}
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) { return <View style={[s.card, style]}>{children}</View>; }
export function Title({ children }: { children: React.ReactNode }) { return <Text accessibilityRole="header" style={s.title}>{children}</Text>; }
export function Muted({ children, style }: { children: React.ReactNode; style?: any }) { return <Text style={[{ color: colors.inkMuted, fontSize: 14 }, style]}>{children}</Text>; }
export function Badge({ children, kind = 'demo' }: { children: React.ReactNode; kind?: 'demo' | 'ai' | 'ok' }) {
  const bg = kind === 'demo' ? '#f1e6cf' : kind === 'ai' ? colors.infoSoft : colors.sageSoft; const fg = kind === 'demo' ? colors.gold : kind === 'ok' ? colors.sage : colors.inkSoft;
  return <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' }}><Text style={{ color: fg, fontSize: 11, fontWeight: '700', textTransform: kind === 'demo' ? 'uppercase' : 'none' }}>{children}</Text></View>;
}
/** Estados de interfaz: carga, vacío, error, sin conexión, permiso, pago pendiente, no disponible. */
export function StateView({ state, title, body, action }: { state: 'loading' | 'empty' | 'error' | 'offline' | 'permission' | 'payment_pending' | 'unavailable'; title?: string; body?: string; action?: React.ReactNode }) {
  const copy: Record<string, [string, string]> = {
    loading: ['Cargando…', ''], empty: ['No hay personas compatibles por ahora', 'Vuelve más tarde o amplía tus preferencias desde tu perfil. No inventamos perfiles.'], error: ['Algo salió mal', 'Inténtalo de nuevo.'],
    offline: ['Sin conexión', 'Lo que escribas se enviará al reconectar.'], permission: ['Sin permiso de ubicación', 'Indica tu ciudad manualmente en tu perfil.'], payment_pending: ['Pago pendiente de confirmación', 'Premium se activará cuando la tienda lo confirme.'], unavailable: ['Servicio no disponible', 'Vuelve a intentarlo más tarde.'],
  };
  const [t, b] = copy[state];
  return (<View accessibilityLiveRegion="polite" style={[s.card, { alignItems: 'center', padding: 28, margin: 16 }]}>{state === 'loading' ? <ActivityIndicator color={colors.wine} /> : <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: state === 'error' ? colors.dangerSoft : colors.emberSoft, marginBottom: 12 }} />}<Text style={[s.title, { fontSize: 20, textAlign: 'center' }]}>{title ?? t}</Text>{(body ?? b) ? <Text style={{ color: colors.inkSoft, textAlign: 'center', marginTop: 6 }}>{body ?? b}</Text> : null}{action ? <View style={{ marginTop: 16 }}>{action}</View> : null}</View>);
}
const s = StyleSheet.create({
  btn: { minHeight: 48, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 16, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '500', color: colors.inkSoft, marginBottom: 6 },
  input: { minHeight: 48, borderRadius: radius.input, borderWidth: 1, borderColor: colors.cream2, backgroundColor: colors.paper, paddingHorizontal: 14, fontSize: 16, color: colors.ink },
  hint: { color: colors.inkMuted, fontSize: 13, marginTop: 4 }, err: { color: colors.danger, fontSize: 13, marginTop: 4 },
  chip: { minHeight: 40, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.cream2, marginRight: 8, marginBottom: 8, justifyContent: 'center' },
  card: { backgroundColor: colors.paper, borderRadius: radius.card, padding: 16, shadowColor: colors.ink, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  title: { fontFamily: 'Georgia', fontSize: 26, fontWeight: '600', color: colors.ink },
});
