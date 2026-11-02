import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/lib/theme';
const icon = (glyph: string) => ({ color }: { color: any }) => <Text style={{ color, fontSize: 20 }} accessibilityElementsHidden>{glyph}</Text>;
export default function TabsLayout() {
  return (<Tabs screenOptions={{ headerStyle: { backgroundColor: colors.cream }, headerShadowVisible: false, headerTitleStyle: { fontFamily: 'Georgia', color: colors.ink }, tabBarActiveTintColor: colors.wine, tabBarInactiveTintColor: colors.inkMuted, tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.cream2, minHeight: 60 }, tabBarLabelStyle: { fontSize: 12 }, sceneStyle: { backgroundColor: colors.cream } }}>
    <Tabs.Screen name="descubrir" options={{ title: 'Descubrir', tabBarIcon: icon('✦') }} />
    <Tabs.Screen name="conexiones" options={{ title: 'Conexiones', tabBarIcon: icon('♡') }} />
    <Tabs.Screen name="mensajes" options={{ title: 'Mensajes', tabBarIcon: icon('▭'), headerShown: false }} />
    <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icon('◯'), headerShown: false }} />
  </Tabs>);
}
