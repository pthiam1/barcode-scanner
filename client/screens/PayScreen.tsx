import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStripe } from '@stripe/stripe-react-native';
import { useCart } from './CartContext';

export default function PayScreen({ navigation }: any) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { items, getTotalPrice, moveCartToHistory, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  const apiUrl = 'http://192.168.0.23:8000';
  const userId = 'cus_TAbp6YpLSrRqOU'; // ID du client créé

  // Calculer le total
  const totalCents = getTotalPrice();
  const totalFCFA = totalCents / 100;

  // Préparer les items pour l'API
  const pendingItems = items.map(item => {
    // Convertir l'ID en nombre, avec fallback sur 1 si ce n'est pas un nombre
    const numericId = parseInt(item.id);
    return {
      id: isNaN(numericId) ? 1 : numericId,
      amount: item.quantity
    };
  });

  const initializePaymentSheet = async () => {
    try {
      setLoading(true);

      // Appel API pour créer le Payment Intent
      const response = await fetch(`${apiUrl}/payments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: userId,
          pending_items: pendingItems,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API paiement:', errorText);
        throw new Error(`Erreur API: ${response.status} - ${errorText}`);
      }

      const { paymentIntent, ephemeralKey, customer } = await response.json();

      // Initialiser le Payment Sheet
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'AfricaMarket',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: 'Client AfricaMarket',
        },
        returnURL: 'africanmarket://payment-success',
      });

      if (error) {
        console.error('Erreur initialisation Payment Sheet:', error);
        Alert.alert('Erreur', 'Impossible d\'initialiser le paiement');
        return;
      }

      setPaymentReady(true);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      Alert.alert('Erreur réseau', 'Vérifiez votre connexion et réessayez');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentReady) {
      Alert.alert('Erreur', 'Le paiement n\'est pas encore prêt');
      return;
    }

    try {
      setLoading(true);

      // Présenter le Payment Sheet
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code !== 'Canceled') {
          console.error('Erreur paiement:', error);
          Alert.alert('Erreur de paiement', error.message);
        }
        return;
      }

      // Paiement réussi
      console.log('✅ Paiement réussi!');
      
      try {
        // Déplacer le panier vers l'historique
        await moveCartToHistory();
        console.log('✅ Panier déplacé vers l\'historique');
        
        Alert.alert(
          'Paiement réussi ! 🎉',
          `Votre commande de ${totalFCFA.toFixed(0)} FCFA a été traitée avec succès.`,
          [
            {
              text: 'Voir l\'historique',
              onPress: () => {
                navigation.reset({
                  index: 1,
                  routes: [
                    { name: 'Home' },
                    { name: 'History' }
                  ],
                });
              }
            },
            {
              text: 'Retour accueil',
              onPress: () => navigation.navigate('Home'),
              style: 'cancel'
            }
          ]
        );
      } catch (historyError) {
        console.error('Erreur sauvegarde historique:', historyError);
        Alert.alert(
          'Paiement réussi ! 🎉',
          `Votre commande de ${totalFCFA.toFixed(0)} FCFA a été traitée avec succès.\n\nNote: Erreur lors de la sauvegarde de l'historique.`,
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
        );
      }

    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInCents: number) => {
    return `${(priceInCents / 100).toFixed(0)} FCFA`;
  };

  // Initialiser le paiement au chargement
  useEffect(() => {
    if (items.length > 0) {
      initializePaymentSheet();
    }
  }, []);

  // Si le panier est vide
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Panier vide</Text>
          <Text style={styles.emptySubtitle}>
            Ajoutez des produits avant de procéder au paiement
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.backButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>💳 Paiement</Text>
          <Text style={styles.subtitle}>Finalisez votre commande</Text>
        </View>

        {/* Résumé de la commande */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Résumé de la commande</Text>
          
          {items.map((item, index) => (
            <View key={`${item.id}-${index}`} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.title}</Text>
                <Text style={styles.itemDetails}>
                  {item.quantity} × {formatPrice(item.price)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total à payer</Text>
            <Text style={styles.totalAmount}>{formatPrice(totalCents)}</Text>
          </View>
        </View>

        {/* Informations paiement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Paiement sécurisé</Text>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentText}>
              • Paiement traité par Stripe
            </Text>
            <Text style={styles.paymentText}>
              • Données cryptées et sécurisées
            </Text>
            <Text style={styles.paymentText}>
              • Cartes Visa, Mastercard acceptées
            </Text>
          </View>
        </View>

        {/* Status de préparation */}
        {!paymentReady && !loading && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>⏳ Préparation du paiement...</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={initializePaymentSheet}
            >
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Boutons d'action */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.payButton,
            (!paymentReady || loading) && styles.payButtonDisabled
          ]}
          onPress={handlePayment}
          disabled={!paymentReady || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.payButtonText}>
              Payer {formatPrice(totalCents)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    margin: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  paymentInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  paymentText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  statusContainer: {
    margin: 15,
    padding: 20,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#212529',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  payButton: {
    flex: 2,
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});