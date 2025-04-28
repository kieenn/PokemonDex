// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Example using Expo icons
import { useTheme } from '../../context/ThemeContext'; // Use theme for colors

export default function TabLayout() {
  const { colors } = useTheme(); // Get theme colors

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hide header for tab screens if desired
        tabBarActiveTintColor: colors.primary, // Use theme color for active tab
        tabBarInactiveTintColor: colors.text + '80', // Use theme color for inactive tab
        tabBarStyle: {
          backgroundColor: colors.card, // Use theme color for tab bar background
          borderTopColor: colors.border, // Use theme color for border
        },
      }}
    >
      <Tabs.Screen
        name="index" // Matches index.tsx
        options={{
          title: 'Pokédex',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="loveList" // Matches loveList.tsx
        options={{
          title: 'Favorites', // Or 'Loved'
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" color={color} size={size} /> // Heart icon
          ),
        }}
      />
      {/* Add other tabs here if needed */}
    </Tabs>
  );
}
