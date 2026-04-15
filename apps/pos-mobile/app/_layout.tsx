import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0a1628' },
          headerTintColor: '#e2e8f0',
          contentStyle: { backgroundColor: '#050c18' },
        }}>
        <Stack.Screen name="index" options={{ title: 'DukaPOS', headerShown: false }} />
      </Stack>
    </>
  );
}
