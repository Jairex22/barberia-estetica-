import { Stack } from 'expo-router';
import { colors } from '@/lib/theme';
export default function L() { return <Stack screenOptions={{ headerStyle: { backgroundColor: colors.cream }, headerShadowVisible: false, headerTintColor: colors.wine, headerTitleStyle: { color: colors.ink }, contentStyle: { backgroundColor: colors.cream } }}><Stack.Screen name="index" options={{ title: 'Mensajes' }} /><Stack.Screen name="[id]" options={{ title: 'Conversación' }} /></Stack>; }
