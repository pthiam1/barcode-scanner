/**
 * Auteur: Papa Thiam
 * Fonctionnalité: Ajout manuel de produits avec interaction avec une API distante et gestion du panier local.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCart } from './CartContext';

export default function ManualAddScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { addItem } = useCart();
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const apiUrl = 'http://172.26.4.34:8000';

  const presets = [
    { title: 'Banane Bio', price: '250' },
    { title: 'Lait 1L', price: '450' },
    { title: 'Huile 1L', price: '1200' },
  ];

  const doPulse = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  const handleAddProduct = async () => {
    if (!barcode.trim() || !name.trim() || !price.trim()) {
      return Alert.alert('Erreur', 'Veuillez remplir tous les champs 😊');
    }

    const parsed = parseFloat(price.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed <= 0) {
      return Alert.alert('Erreur', 'Prix invalide');
    }

    setIsAdding(true);
    doPulse();

    try {
      const priceInCents = Math.round(parsed * 100);

      // create product on API
      const response = await fetch(`${apiUrl}/items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), price: priceInCents, barcode: barcode.trim() }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status} ${text}`);
      }

      const createdProduct = await response.json();

      await addItem({ id: String(createdProduct.id), title: createdProduct.name, price: createdProduct.price }, 1);

      Alert.alert('Succès', `✅ ${createdProduct.name} ajouté au panier`);

      // clear
      setBarcode('');
      setName('');
      setPrice('');
    } catch (err) {
      console.error('Erreur ajout produit:', err);
      Alert.alert('Erreur', 'Impossible d\'ajouter le produit. Vérifie ta connexion.');
    } finally {
      setIsAdding(false);
    }
  };

  const applyPreset = (p: { title: string; price: string }) => {
    setName(p.title);
    setPrice(p.price);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: String(theme.colors.background) }] }>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { backgroundColor: String(theme.colors.surface) }]}>
          <Text style={[styles.title, { color: String(theme.colors.primary) }]}>✨ Ajouter un produit</Text>
          <Text style={[styles.subtitle, { color: String(theme.colors.muted) }]}>Remplis les champs ou choisis un preset</Text>
        </View>

        <View style={styles.presetsRow}>
          {presets.map((p) => (
            <Pressable key={p.title} onPress={() => applyPreset(p)} style={({ pressed }) => [styles.preset, { backgroundColor: String(theme.colors.surface), borderColor: String(theme.colors.border), opacity: pressed ? 0.8 : 1 }]}>
              <Text style={[styles.presetTitle, { color: String(theme.colors.text) }]}>{p.title}</Text>
              <Text style={[styles.presetPrice, { color: String(theme.colors.muted) }]}>{p.price} FCFA</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.form, { backgroundColor: String(theme.colors.surface), borderColor: String(theme.colors.border) }] }>
          <TextInput
            placeholder="Code-barres"
            placeholderTextColor={String(theme.colors.muted)}
            value={barcode}
            onChangeText={setBarcode}
            style={[styles.input, { color: String(theme.colors.text) }]}
          />

          <TextInput
            placeholder="Nom du produit"
            placeholderTextColor={String(theme.colors.muted)}
            value={name}
            onChangeText={setName}
            style={[styles.input, { color: String(theme.colors.text) }]}
          />

          <TextInput
            placeholder="Prix (FCFA)"
            placeholderTextColor={String(theme.colors.muted)}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            style={[styles.input, { color: String(theme.colors.text) }]}
          />

          <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
            <Pressable onPress={handleAddProduct} style={({ pressed }) => [styles.addButton, { backgroundColor: String(theme.colors.primary), opacity: pressed ? 0.9 : 1 }]}>
              {isAdding ? (
                <ActivityIndicator color={String(theme.colors.primaryContrast)} />
              ) : (
                <Text style={[styles.addText, { color: String(theme.colors.primaryContrast) }]}>Ajouter au panier</Text>
              )}
            </Pressable>
          </Animated.View>

          <View style={styles.quickRow}>
            <Pressable onPress={() => navigation.navigate('Cart')} style={({ pressed }) => [styles.quickBtn, { backgroundColor: String(theme.colors.surface), borderColor: String(theme.colors.border), opacity: pressed ? 0.85 : 1 }]}>
              <Text style={{ color: String(theme.colors.text) }}>Voir le panier</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('History')} style={({ pressed }) => [styles.quickBtn, { backgroundColor: String(theme.colors.surface), borderColor: String(theme.colors.border), opacity: pressed ? 0.85 : 1 }]}>
              <Text style={{ color: String(theme.colors.text) }}>Historique</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footerSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { padding: 18, borderRadius: 12, marginBottom: 14 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 13 },
  presetsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  preset: { flex: 1, padding: 10, marginHorizontal: 6, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  presetTitle: { fontWeight: '600' },
  presetPrice: { marginTop: 6, fontSize: 12 },
  form: { padding: 14, borderRadius: 12, borderWidth: 1 },
  input: { borderWidth: 0, paddingVertical: 12, paddingHorizontal: 8, marginBottom: 10, fontSize: 16 },
  addButton: { height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addText: { fontWeight: '700', fontSize: 16 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  quickBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center', marginHorizontal: 6 },
  footerSpacing: { height: 10 },
});