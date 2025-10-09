import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <TouchableOpacity testID="theme-toggle" onPress={() => toggleTheme()} style={styles.btn}>
      <Text style={styles.text}>{theme === 'light' ? '☀️' : '🌙'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: { padding: 8, marginRight: 8 },
  text: { fontSize: 18 },
});

export default ThemeToggle;
