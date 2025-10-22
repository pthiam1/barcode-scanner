/**
 * Auteur: Papa Thiam
 * Fonctionnalité: Ajout manuel de produits avec interaction avec une API distante et gestion du panier local.
 */

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCart } from './CartContext';
import AddProductCard from '../components/AddProductCard';
import Constants from 'expo-constants';

export default function ManualAddScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { addItem } = useCart();
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const apiUrl = Constants.expoConfig?.extra?.API_URL ?? 'http://172.26.4.34:8000';

  const presets = [
    { title: 'Banane Bio', price: '250' },
    { title: 'Lait 1L', price: '450' },
    { title: 'Huile 1L', price: '1200' },
  ];

  const handleAddProduct = async () => {
    if (!barcode.trim() || !name.trim() || !price.trim()) {
      return Alert.alert('Erreur', 'Veuillez remplir tous les champs 😊');
    }

    const parsed = parseFloat(price.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed <= 0) {
      return Alert.alert('Erreur', 'Prix invalide');
    }

    setIsAdding(true);

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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: String(theme.colors.background) }]}>
      <AddProductCard
        barcode={barcode}
        name={name}
        price={price}
        onBarcodeChange={setBarcode}
        onNameChange={setName}
        onPriceChange={setPrice}
        onAdd={handleAddProduct}
        isAdding={isAdding}
        presets={presets}
        footerActions={
          <>
            <Pressable onPress={() => navigation.navigate('Cart')} style={({ pressed }) => [{ padding: 10, borderRadius: 8, backgroundColor: String(theme.colors.surface), opacity: pressed ? 0.9 : 1, marginRight: 8 }]}>
              <Text style={{ color: String(theme.colors.text) }}>Voir le panier</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('History')} style={({ pressed }) => [{ padding: 10, borderRadius: 8, backgroundColor: String(theme.colors.surface), opacity: pressed ? 0.9 : 1 }]}>
              <Text style={{ color: String(theme.colors.text) }}>Historique</Text>
            </Pressable>
          </>
        }
      />
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