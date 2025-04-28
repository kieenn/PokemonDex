// components/ThemeToggleButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext'; // Adjust path if needed

const ThemeToggleButton = () => {
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity onPress={toggleTheme} style={styles.button}>
      <Text style={[styles.text, { color: colors.text }]}>
        {theme === 'light' ? '🌙' : '☀️'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    marginRight: 15,
    padding: 5,
  },
  text: {
    fontSize: 24, // Slightly larger for better visibility
  },
});

export default ThemeToggleButton;
