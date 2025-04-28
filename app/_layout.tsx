// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
// *** VERIFY PATHS ***
import { ThemeProvider, useTheme } from '../context/ThemeContext'; // Use correct path
import ThemeToggleButton from '../components/ThemeToggleButton'; // Use correct path
import { LoveProvider } from '@/context/LoveContext';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colors } = useTheme(); // Use theme hook inside component wrapped by Provider

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight: () => <ThemeToggleButton />,
      }}
    >
      {/* Tabs layout defined in app/(tabs)/_layout.tsx */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Detail screen defined in app/pokemon/[name].tsx */}
      <Stack.Screen
        name="pokemon/[name]"
        options={{
            title: 'Pokémon Details', // Default title
            // presentation: 'modal', // Optional: if you want modal presentation
        }}
       />
       {/* Add other non-tab screens here */}
    </Stack>
  );
}

export default function RootLayout() {
  // Load fonts (replace with your actual fonts)
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // ...other fonts
  });

  useEffect(() => {
    if (error) throw error; // Handle font loading errors
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync(); // Hide splash screen once fonts are loaded
    }
  }, [loaded]);

  if (!loaded) {
    return null; // Return null or a loading indicator while fonts load
  }

  // Wrap the entire navigation structure with ThemeProvider
  return (
    <LoveProvider>
      <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
    </LoveProvider>
    
  );
}
