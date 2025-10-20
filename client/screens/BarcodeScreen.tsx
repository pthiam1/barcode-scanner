/**
 * Auteur: Papa Thiam
 * Fonctionnalité: Scanner de code-barres avec caméra, ajout automatique au panier via API backend, gestion des erreurs et navigation.
 */
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, Alert, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Animated, Keyboard, EmitterSubscription } from 'react-native';
import AddProductCard from '../components/AddProductCard';
import { CameraView, Camera } from 'expo-camera';
import { useCart } from './CartContext';

export default function BarcodeScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [scannedItems, setScannedItems] = useState<Array<{ id: string; title: string; price: number; qty?: number }>>([]);
  const { addItem } = useCart();
  const { setQuantity, removeItem } = useCart();
  const apiUrl = 'http://192.168.0.23:8000'; // Remplace par l'IP de ton backend
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  const shift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let showSub: EmitterSubscription | null = null;
    let hideSub: EmitterSubscription | null  = null;

    const onKeyboardShow = (e: any) => {
      const height = e.endCoordinates ? e.endCoordinates.height : 250;
      Animated.timing(shift, {
        toValue: -height / 1.5,
        duration: 250,
        useNativeDriver: true,
      }).start();
    };

    const onKeyboardHide = () => {
      Animated.timing(shift, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };

    if (Platform.OS === 'ios') {
      showSub = Keyboard.addListener('keyboardWillShow', onKeyboardShow);
      hideSub = Keyboard.addListener('keyboardWillHide', onKeyboardHide);
    } else {
      showSub = Keyboard.addListener('keyboardDidShow', onKeyboardShow);
      hideSub = Keyboard.addListener('keyboardDidHide', onKeyboardHide);
    }

    return () => {
      showSub && showSub.remove();
      hideSub && hideSub.remove();
    };
  }, [shift]);

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

          // ajouter à la liste de session (group by id)
          setScannedItems(prev => {
            const existing = prev.find(p => p.id === String(product.id));
            if (existing) {
              return prev.map(p => p.id === String(product.id) ? { ...p, qty: (p.qty ?? 1) + 1 } : p);
            }
            return [{ id: product.id.toString(), title: product.name, price: product.price, qty: 1 }, ...prev];
          });

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
        // ajouter à la liste de session (group by id)
        setScannedItems(prev => {
          const existing = prev.find(p => p.id === String(product.id));
          if (existing) {
            return prev.map(p => p.id === String(product.id) ? { ...p, qty: (p.qty ?? 1) + 1 } : p);
          }
          return [{ id: product.id.toString(), title: product.name, price: product.price, qty: 1 }, ...prev];
        });

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

  const incrementSessionItem = async (id: string) => {
    // increment both in session list and in persistent cart
    setScannedItems(prev => prev.map(p => p.id === id ? { ...p, qty: (p.qty ?? 1) + 1 } : p));
    // also update persistent cart
    try { await addItem({ id, title: '', price: 0 }, 1); } catch (_) {}
  };

  const decrementSessionItem = async (id: string) => {
    setScannedItems(prev => {
      const found = prev.find(p => p.id === id);
      if (!found) return prev;
      const newQty = (found.qty ?? 1) - 1;
      if (newQty <= 0) {
        // remove from session
        return prev.filter(p => p.id !== id);
      }
      return prev.map(p => p.id === id ? { ...p, qty: newQty } : p);
    });
    // update persistent cart quantity
    try {
      // read current from CartContext.items via setQuantity; if quantity becomes 0 remove
      await setQuantity(id, Math.max(0, (1)));
    } catch (_) {}
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

      <Animated.View style={[styles.bottomHalf, { transform: [{ translateY: shift }] }] }>
        <View style={styles.bottomContent}>
          <View>
            <AddProductCard
              barcode={manualBarcode}
              onBarcodeChange={setManualBarcode}
              onAdd={handleManualAdd}
              isAdding={isAdding}
              showNameAndPrice={false}
            />
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

          {/* Liste des articles scannés pendant la session */}
          <View style={styles.scannedListContainer}>
            <Text style={styles.scannedTitle}>Articles scannés (cette session)</Text>
            {scannedItems.length === 0 ? (
              <Text style={styles.scannedEmpty}>Aucun article scanné</Text>
            ) : (
              <Animated.FlatList
                data={scannedItems}
                keyExtractor={(it) => `${it.id}-${it.qty}`}
                style={{ maxHeight: 140 }}
                renderItem={({ item }) => (
                  <View style={styles.scannedRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scannedName}>{item.title}</Text>
                      <Text style={styles.scannedPrice}>{(item.price / 100).toFixed(2)} FCFA</Text>
                    </View>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => decrementSessionItem(item.id)}>
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.scannedQty}>{item.qty ?? 1}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => incrementSessionItem(item.id)}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Animated.View>
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
  scannedListContainer: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e6e6e6' },
  scannedTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  scannedEmpty: { color: '#666', fontStyle: 'italic' },
  scannedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  scannedName: { fontWeight: '600' },
  scannedPrice: { fontSize: 12, color: '#666', marginTop: 4 },
  scannedQty: { marginLeft: 12, fontWeight: '700' },
  qtyControls: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  qtyBtnText: { fontSize: 18, fontWeight: '700' },
});
