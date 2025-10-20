import React, { useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Animated, Platform, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Preset = { title: string; price: string };

type Props = {
  barcode: string;
  name?: string;
  price?: string;
  onBarcodeChange?: (v: string) => void;
  onNameChange?: (v: string) => void;
  onPriceChange?: (v: string) => void;
  onAdd: () => void | Promise<void>;
  isAdding?: boolean;
  presets?: Preset[];
  showNameAndPrice?: boolean; // if false, only barcode input + add button
  footerActions?: React.ReactNode;
};

export default function AddProductCard({
  barcode,
  name = '',
  price = '',
  onBarcodeChange,
  onNameChange,
  onPriceChange,
  onAdd,
  isAdding = false,
  presets = [],
  showNameAndPrice = true,
  footerActions,
}: Props) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const doPulse = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 110, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = async () => {
    doPulse();
    await onAdd();
  };

  return (
    <ScrollView contentContainerStyle={styles.wrapper} keyboardShouldPersistTaps="handled">
      {showNameAndPrice ? (
        <View style={[styles.header, { backgroundColor: String(theme.colors.surface) }]}>
          <Text style={[styles.title, { color: String(theme.colors.primary) }]}>✨ Ajouter un produit</Text>
          <Text style={[styles.subtitle, { color: String(theme.colors.muted) }]}>Remplis les champs ou choisis un preset</Text>
        </View>
      ) : null}

      {presets.length > 0 && showNameAndPrice ? (
        <View style={styles.presetsRow}>
          {presets.map((p) => (
            <Pressable key={p.title} onPress={() => { onNameChange?.(p.title); onPriceChange?.(p.price); }}
              style={({ pressed }) => [styles.preset, { backgroundColor: String(theme.colors.surface), borderColor: String(theme.colors.border), opacity: pressed ? 0.9 : 1 }]}>
              <Text style={[styles.presetTitle, { color: String(theme.colors.text) }]}>{p.title}</Text>
              <Text style={[styles.presetPrice, { color: String(theme.colors.muted) }]}>{p.price} FCFA</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={[styles.form, { backgroundColor: String(theme.colors.surface), borderColor: String(theme.colors.border) }]}>
        <TextInput
          placeholder="Code-barres"
          placeholderTextColor={String(theme.colors.muted)}
          value={barcode}
          onChangeText={onBarcodeChange}
          style={[styles.input, { color: String(theme.colors.text) }]}
          keyboardType="number-pad"
        />

        {showNameAndPrice ? (
          <>
            <TextInput
              placeholder="Nom du produit"
              placeholderTextColor={String(theme.colors.muted)}
              value={name}
              onChangeText={onNameChange}
              style={[styles.input, { color: String(theme.colors.text) }]}
            />

            <TextInput
              placeholder="Prix (FCFA)"
              placeholderTextColor={String(theme.colors.muted)}
              value={price}
              onChangeText={onPriceChange}
              keyboardType="numeric"
              style={[styles.input, { color: String(theme.colors.text) }]}
            />
          </>
        ) : null}

        <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
          <Pressable onPress={handlePress} style={({ pressed }) => [styles.addButton, { backgroundColor: String(theme.colors.primary), opacity: pressed ? 0.9 : 1 }]} disabled={isAdding}>
            {isAdding ? <ActivityIndicator color={String(theme.colors.primaryContrast)} /> : <Text style={[styles.addText, { color: String(theme.colors.primaryContrast) }]}>Ajouter au panier</Text>}
          </Pressable>
        </Animated.View>

        {footerActions ? <View style={styles.footerRow}>{footerActions}</View> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingBottom: 4 },
  header: { padding: 12, borderRadius: 12, marginBottom: 10 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13 },
  presetsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  preset: { flex: 1, padding: 10, marginHorizontal: 6, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  presetTitle: { fontWeight: '600' },
  presetPrice: { marginTop: 6, fontSize: 12 },
  form: { padding: 12, borderRadius: 12, borderWidth: 1 },
  input: { borderWidth: 0, paddingVertical: 12, paddingHorizontal: 8, marginBottom: 10, fontSize: 16 },
  addButton: { height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addText: { fontWeight: '700', fontSize: 16 },
  footerRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
});
