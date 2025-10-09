/**
 * Auteur: Papa Thiam
 * Fonctionnalité: Scanner de code-barres avec caméra, ajout automatique au panier via API backend, gestion des erreurs et navigation.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useCart } from './CartContext';

export default function BarcodeScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();
  const apiUrl = 'http://172.26.4.134:8000'; // Remplace par l'IP de ton backend
  const [lastAdded, setLastAdded] = useState<string | null>(null);

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

  const handleManualAdd = async () => {
    const code = manualBarcode.trim();
    if (!code) {
      Alert.alert('Code vide', 'Veuillez entrer un numéro de code-barres.');
      return;
    }

    setIsAdding(true);

    try {
      const res = await fetch(`${apiUrl}/items/barcode/${encodeURIComponent(code)}`);

      if (res.status === 200) {
        const product = await res.json();
        await addItem({
          id: product.id.toString(),
          title: product.name,
          price: product.price,
        }, 1);

        Alert.alert('Ajouté', `${product.name} ajouté au panier`);
        setManualBarcode('');
  setLastAdded(product.name);
      } else if (res.status === 404) {
        Alert.alert('Produit inconnu', 'Ce code-barres n\'existe pas dans la base.');
      } else {
        Alert.alert('Erreur', 'Impossible de récupérer le produit.');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout manuel:', error);
      Alert.alert('Erreur réseau', 'Impossible de vérifier le produit.');
    } finally {
      setIsAdding(false);
    }
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
      <View style={styles.topHalf}>
        <CameraView 
          style={styles.camera}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'pdf417', 'ean13', 'ean8', 'code128', 'code39'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      </View>

      <View style={styles.bottomHalf}>
        <View style={styles.bottomContent}>939297
          <View style={styles.manualRow}>
            <TextInput
              placeholder="Entrer code-barres"
              style={styles.manualInput}
              value={manualBarcode}
              onChangeText={setManualBarcode}
              keyboardType="number-pad"
              returnKeyType="done"
              editable={!isAdding}
              placeholderTextColor="#666"
            />

            <TouchableOpacity style={[styles.manualButton, styles.addButton]} onPress={handleManualAdd} disabled={isAdding}>
              {isAdding ? <ActivityIndicator color="#fff" /> : <Text style={styles.manualButtonText}>Ajouter</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.manualButton, styles.clearButton]} onPress={() => setManualBarcode('')} disabled={isAdding}>
              <Text style={styles.manualButtonText}>Effacer</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.controlsRow}>
            <Button title="Voir panier" onPress={() => navigation.navigate('Cart')} />
          </View>

          {lastAdded ? (
            <View style={styles.lastAddedRow}>
              <Text style={styles.lastAddedText}>Dernier ajouté: {lastAdded}</Text>
              <TouchableOpacity onPress={() => setLastAdded(null)}>
                <Text style={styles.dismissText}>X</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
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
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  manualButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 30,
    backgroundColor: 'transparent',
  },
  overlayContent: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 12,
    borderRadius: 12,
  },
  addButton: {
    backgroundColor: '#28a745',
    marginRight: 8,
  },
  clearButton: {
    backgroundColor: '#6c757d',
    marginLeft: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  lastAddedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  lastAddedText: {
    color: '#fff',
  },
  dismissText: {
    color: '#fff',
    marginLeft: 10,
    fontWeight: '700',
  },
  topHalf: {
    flex: 1,
    backgroundColor: '#000'
  },
  bottomHalf: {
    height: 260,
    backgroundColor: '#fff'
  },
  bottomContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center'
  },
});
