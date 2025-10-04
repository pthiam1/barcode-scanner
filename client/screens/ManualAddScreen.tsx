/**
 * Auteur: Papa Thiam
 * Fonctionnalité: Ajout manuel de produits avec interaction avec une API distante et gestion du panier local.
 */

import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { useCart } from './CartContext';

export default function ManualAddScreen({ navigation }: any) {
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const { addItem } = useCart();
  const apiUrl = 'http://192.168.0.23:8000';

  const handleAddProduct = async () => {
    if (!barcode || !name || !price) {
      Alert.alert('Erreur', 'Tous les champs sont requis');
      return;
    }

    try {
      const priceInCents = Math.round(parseFloat(price) * 100);
      
      // 1. D'abord ajouter le produit à l'API
      const response = await fetch(`${apiUrl}/items/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          price: priceInCents,
          barcode: barcode
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const createdProduct = await response.json();

      // 2. Ensuite l'ajouter au panier local
      await addItem({
        id: createdProduct.id.toString(), // Utiliser l'ID de l'API
        title: createdProduct.name,
        price: createdProduct.price
      }, 1);
      
      Alert.alert('Succès', `Produit "${name}" ajouté à l'API et au panier`);
      
      // Reset form
      setBarcode('');
      setName('');
      setPrice('');
    } catch (error) {
      console.error('Erreur ajout produit:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le produit à l\'API');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput 
        placeholder="Code-barres"
        value={barcode}
        onChangeText={setBarcode}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />
      <TextInput 
        placeholder="Nom du produit"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />
      <TextInput 
        placeholder="Prix (fcfa)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />
      <Button title="Ajouter au panier" onPress={handleAddProduct} />
      
      <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Button title="Voir panier" onPress={() => navigation.navigate('Cart')} />
        <Button title="Historique" onPress={() => navigation.navigate('History')} />
      </View>
    </View>
  );
}