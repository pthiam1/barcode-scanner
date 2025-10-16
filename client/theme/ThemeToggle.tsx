import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, AccessibilityRole } from 'react-native';
import { useTheme } from './ThemeProvider';

// Accent color chosen to be visible on both light and dark backgrounds
const ACCENT_COLOR = '#e618b9ff';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme.name === 'light';
  const anim = useRef(new Animated.Value(isLight ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: isLight ? 0 : 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [isLight, anim]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [4, theme.sizes.toggleWidth - theme.sizes.toggleThumb - 4] });

  const accessibilityLabel = isLight ? 'Activer le thème sombre' : 'Activer le thème clair';

  return (
    <Pressable
      accessibilityRole={'button' as AccessibilityRole}
      accessibilityLabel={accessibilityLabel}
      onPress={() => toggleTheme()}
      style={({ pressed }) => [
        styles.wrapper,
        {
          width: theme.sizes.toggleWidth,
          height: theme.sizes.toggleHeight,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.sizes.toggleHeight / 2,
          opacity: pressed ? 0.9 : 1,
          borderColor: theme.colors.border,
          borderWidth: 1,
        },
      ]}
    >
      {/* subtle accent background */}
      <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: theme.sizes.toggleHeight / 2, opacity: 0.06, backgroundColor: ACCENT_COLOR }]} pointerEvents="none" />

      <View style={[styles.track, { width: theme.sizes.toggleWidth, height: theme.sizes.toggleHeight, borderRadius: theme.sizes.toggleHeight / 2 }] } pointerEvents="none">
        <Animated.View
          style={[
            styles.thumb,
            {
              width: theme.sizes.toggleThumb,
              height: theme.sizes.toggleThumb,
              borderRadius: theme.sizes.toggleThumb / 2,
              transform: [{ translateX }],
              backgroundColor: ACCENT_COLOR,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 3,
            },
          ]}
        />
      </View>

      <View style={styles.icons} pointerEvents="none">
        <Text style={[styles.iconText, { color: isLight ? theme.colors.muted : theme.colors.muted }]}>☀️</Text>
        <Text style={[styles.iconText, { color: isLight ? theme.colors.muted : theme.colors.muted }]}>🌙</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: { justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  track: { justifyContent: 'center', position: 'relative' },
  thumb: { position: 'absolute', left: 4, top: 4 },
  icons: { position: 'absolute', left: 8, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  iconText: { fontSize: 14 },
});

export default ThemeToggle;
