import { Stack } from 'expo-router';
import { colors } from '@/lib/theme';
export default function AuthLayout() { return <Stack screenOptions={{ headerStyle: { backgroundColor: colors.cream }, headerTintColor: colors.wine, headerShadowVisible: false, contentStyle: { backgroundColor: colors.cream } }}><Stack.Screen name="entrar" options={{ title: 'Entrar' }} /><Stack.Screen name="registro" options={{ title: 'Crear cuenta' }} /></Stack>; }
