/**
 * Auteur: Papa Thiam
 * Fonctionnalité: Écran de scan de codes-barres avec caméra, ajout manuel, et gestion des articles scannés.
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  Keyboard,
  EmitterSubscription,
  FlatList,
} from 'react-native';
import AddProductCard from '../components/AddProductCard';
import { CameraView, Camera } from 'expo-camera';
import { useCart } from './CartContext';
import Constants from 'expo-constants';

export default function BarcodeScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [scannedItems, setScannedItems] = useState<Array<{ id: string; title: string; price: number; qty?: number }>>([]);
  const { addItem, setQuantity } = useCart();
  const apiUrl = Constants.expoConfig?.extra?.API_URL ?? 'http://172.26.4.134:8000';
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  const shift = useRef(new Animated.Value(0)).current;

  // --- Gestion du clavier (pour champ manuel)
  useEffect(() => {
    let showSub: EmitterSubscription | null = null;
    let hideSub: EmitterSubscription | null = null;

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
      showSub?.remove();
      hideSub?.remove();
    };
  }, [shift]);

  // --- Permission caméra
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // --- Scan automatique
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);

    try {
      const res = await fetch(`${apiUrl}/items/barcode/${encodeURIComponent(data)}`);
      if (res.status === 200) {
        const product = await res.json();

        await addItem({
          id: product.id.toString(),
          title: product.name,
          price: product.price,
        }, 1);

        setScannedItems(prev => {
          const existing = prev.find(p => p.id === String(product.id));
          if (existing) {
            return prev.map(p => p.id === String(product.id)
              ? { ...p, qty: (p.qty ?? 1) + 1 }
              : p);
          }
          return [{ id: product.id.toString(), title: product.name, price: product.price, qty: 1 }, ...prev];
        });

        setLastAdded(product.name);
        Alert.alert('✅ Ajouté', `${product.name} ajouté au panier`);
      } else if (res.status === 404) {
        Alert.alert('Produit inconnu', 'Ce code-barres n’existe pas dans la base.');
      } else {
        Alert.alert('Erreur', 'Impossible de récupérer le produit.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur réseau', 'Impossible de vérifier le produit.');
    }

    setTimeout(() => setScanned(false), 1500);
  };

  // --- Ajout manuel
  const handleManualAdd = async () => {
    if (!manualBarcode.trim()) {
      Alert.alert('Champ vide', 'Veuillez entrer un code-barres.');
      return;
    }
    setIsAdding(true);

    try {
      const res = await fetch(`${apiUrl}/items/barcode/${encodeURIComponent(manualBarcode)}`);
      if (res.status === 200) {
        const product = await res.json();
        await addItem({ id: product.id.toString(), title: product.name, price: product.price }, 1);

        setScannedItems(prev => {
          const existing = prev.find(p => p.id === String(product.id));
          if (existing) {
            return prev.map(p => p.id === String(product.id)
              ? { ...p, qty: (p.qty ?? 1) + 1 }
              : p);
          }
          return [{ id: product.id.toString(), title: product.name, price: product.price, qty: 1 }, ...prev];
        });

        setLastAdded(product.name);
        setManualBarcode('');
        Alert.alert('✅ Ajouté', `${product.name} ajouté au panier`);
      } else {
        Alert.alert('Produit non trouvé', 'Ce code-barres n’existe pas dans la base.');
      }
    } catch (error) {
      Alert.alert('Erreur réseau', 'Impossible d’ajouter le produit.');
    } finally {
      setIsAdding(false);
    }
  };

  // --- Gestion quantité (session)
  const incrementSessionItem = (id: string) => {
    setScannedItems(prev => prev.map(p => p.id === id ? { ...p, qty: (p.qty ?? 1) + 1 } : p));
  };
  const decrementSessionItem = (id: string) => {
    setScannedItems(prev => prev
      .map(p => (p.id === id ? { ...p, qty: Math.max(0, (p.qty ?? 1) - 1) } : p))
      .filter(p => (p.qty ?? 1) > 0));
  };

  // --- Si pas de permission
  if (hasPermission === null) return <Text>Demande d’accès caméra...</Text>;
  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text>Caméra non accessible.</Text>
        <Button title="Ajouter manuellement" onPress={() => navigation.navigate('ManualAdd')} />
      </View>
    );
  }

  // --- Rendu principal
  return (
    <View style={styles.container}>
      {/* ZONE CAMÉRA */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'code128', 'code39'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      </View>

      {/* ZONE INFOS SCAN */}
      <Animated.View style={[styles.infoContainer, { transform: [{ translateY: shift }] }]}>
        <AddProductCard
          barcode={manualBarcode}
          onBarcodeChange={setManualBarcode}
          onAdd={handleManualAdd}
          isAdding={isAdding}
          showNameAndPrice={false}
        />

        {lastAdded && (
          <Text style={styles.lastAddedText}>🛒 Dernier ajouté : <Text style={{ fontWeight: '700' }}>{lastAdded}</Text></Text>
        )}

        <Text style={styles.sectionTitle}>📋 Articles scannés</Text>
        {scannedItems.length === 0 ? (
          <Text style={styles.emptyList}>Aucun article pour le moment.</Text>
        ) : (
          <FlatList
            data={scannedItems}
            keyExtractor={(item) => item.id}
            style={styles.flatList}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.title}</Text>
                  <Text style={styles.itemPrice}>{(item.price / 100).toFixed(2)} FCFA</Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => decrementSessionItem(item.id)}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.itemQty}>{item.qty ?? 1}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => incrementSessionItem(item.id)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        <TouchableOpacity
          style={styles.viewCartBtn}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.viewCartText}>🧺 Voir le panier</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  infoContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 15,
    minHeight: 340,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 6,
    elevation: 8,
  },
  sectionTitle: { fontWeight: '700', fontSize: 16, marginVertical: 10 },
  flatList: { maxHeight: 200 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  itemName: { fontWeight: '600', fontSize: 14 },
  itemPrice: { color: '#777', fontSize: 12 },
  qtyControls: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: {
    backgroundColor: '#e0e0e0',
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontWeight: '700', fontSize: 16 },
  itemQty: { marginHorizontal: 8, fontWeight: '700' },
  emptyList: { color: '#888', fontStyle: 'italic' },
  lastAddedText: { color: '#2e7d32', fontSize: 13, marginBottom: 6 },
  viewCartBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  viewCartText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
