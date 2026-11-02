import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

function Gate() {
  const { user, loading } = useAuth(); const segments = useSegments(); const router = useRouter();
  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) router.replace('/(auth)/entrar');
    if (user && inAuth) router.replace('/(tabs)/descubrir');
  }, [user, loading, segments, router]);
  return (<Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}><Stack.Screen name="(auth)" /><Stack.Screen name="(tabs)" /></Stack>);
}
export default function Root() { return (<SafeAreaProvider><AuthProvider><StatusBar style="dark" /><Gate /></AuthProvider></SafeAreaProvider>); }
