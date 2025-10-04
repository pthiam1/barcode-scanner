/**
 * Auteur: Papa Thiam
 * Fonctionnalité: Scanner de code-barres avec caméra, ajout automatique au panier via API backend, gestion des erreurs et navigation.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useCart } from './CartContext';

export default function BarcodeScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const { addItem } = useCart();
  const apiUrl = 'http://192.168.0.23:8000'; // Remplace par l'IP de ton backend

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);

    try {
      // Nouvelle route backend qui accepte barcode
      const res = await fetch(`${apiUrl}/items/barcode/${encodeURIComponent(data)}`);

      if (res.status === 200) {
        const product = await res.json();
        // Enregistre automatiquement dans SQLite via CartContext
        await addItem({
          id: product.id.toString(),       // convertir ID en string
          title: product.name,
          price: product.price             // API renvoie price en centimes
        }, 1);

        Alert.alert('Ajouté', `${product.name} ajouté au panier`);
      } else if (res.status === 404) {
        Alert.alert('Produit inconnu', 'Ce code-barres n\'existe pas dans la base.');
      } else {
        Alert.alert('Erreur', 'Impossible de récupérer le produit.');
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      Alert.alert('Erreur réseau', 'Impossible de vérifier le produit. Essayez l\'ajout manuel.');
    }

    // Permettre un nouveau scan après 2 secondes
    setTimeout(() => setScanned(false), 2000);
  };

  if (hasPermission === null) return <Text>Demande d'accès caméra...</Text>;
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.centerText}>La caméra n'est pas disponible.</Text>
        <Button title="Ajouter manuellement" onPress={() => navigation.navigate('ManualAdd')} />
        <Button title="Voir panier" onPress={() => navigation.navigate('Cart')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'pdf417', 'ean13', 'ean8', 'code128', 'code39'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <View style={styles.buttonContainer}>
        <Button title="Voir panier" onPress={() => navigation.navigate('Cart')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  centerText: {
    textAlign: 'center',
    margin: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
});
