import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') {
      router.replace('/');
    }
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="cockpit" options={{ headerShown: false }} />
        <Stack.Screen name="missions" options={{ headerShown: false }} />
        <Stack.Screen name="carselect" options={{ headerShown: false }} />
        <Stack.Screen name="docs" options={{ headerShown: false }} />
        <Stack.Screen name="drive" options={{ headerShown: false }} />
        <Stack.Screen name="quiz" options={{ headerShown: false }} />
        <Stack.Screen name="scenario" options={{ headerShown: false }} />
        <Stack.Screen name="endscreen" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
