/**
 * Auteur: Papa Thiam
 * Fonctionnalité: Écran de paiement avec intégration Stripe, gestion du panier, et navigation post-paiement.
 */
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
import { useTheme } from '../theme/ThemeProvider';
import { createPaymentIntent } from '../services/payments';
import Constants from 'expo-constants';

export default function PayScreen({ navigation }: any) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { items, getTotalPrice, moveCartToHistory, clearCart } = useCart();
  const { theme, colors, sizes } = useTheme();
  const [loading, setLoading] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  const apiUrl = Constants.expoConfig?.extra?.API_URL ?? 'http://172.26.4.134:8000';
  const userId = Constants.expoConfig?.extra?.USER_ID ?? 'cus_TAbp6YpLSrRqOU'; // ID du client (fallback)

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
      const { paymentIntent, ephemeralKey, customer } = await createPaymentIntent(userId, pendingItems);

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
      console.log('Paiement réussi!');
      
      try {
        // Déplacer le panier vers l'historique
        await moveCartToHistory();
        console.log('Panier déplacé vers l\'historique');
        
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
      <SafeAreaView style={[styles.container, { backgroundColor: String(colors.background) }]}>
        <View style={[styles.emptyContainer, { backgroundColor: String(colors.surface) }]}>
          <Text style={[styles.emptyTitle, { color: String(colors.text) }]}>Panier vide</Text>
          <Text style={[styles.emptySubtitle, { color: String(colors.muted) }]}>Ajoutez des produits avant de procéder au paiement</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: String(colors.primary) }]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.backButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: String(colors.background) }]}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: String(colors.surface), borderBottomColor: String(colors.border) }]}>
          <Text style={[styles.title, { color: String(colors.text) }]}>💳 Paiement</Text>
          <Text style={[styles.subtitle, { color: String(colors.muted) }]}>Finalisez votre commande</Text>
        </View>

        {/* Résumé de la commande */}
        <View style={[styles.section, { backgroundColor: String(colors.surface), borderColor: String(colors.border) }]}>
          <Text style={[styles.sectionTitle, { color: String(colors.text) }]}>📋 Résumé de la commande</Text>
          
          {items.map((item, index) => (
            <View key={`${item.id}-${index}`} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: String(colors.text) }]}>{item.title}</Text>
                <Text style={[styles.itemDetails, { color: String(colors.muted) }]}>
                  {item.quantity} × {formatPrice(item.price)}
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: String(colors.success) }]}> {formatPrice(item.price * item.quantity)} </Text>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: String(colors.border) }]} />
          
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: String(colors.text) }]}>Total à payer</Text>
            <Text style={[styles.totalAmount, { color: String(colors.primary) }]}>{formatPrice(totalCents)}</Text>
          </View>
        </View>

        {/* Informations paiement */}
        <View style={[styles.section, { backgroundColor: String(colors.surface), borderColor: String(colors.border) }]}>
          <Text style={[styles.sectionTitle, { color: String(colors.text) }]}>🔒 Paiement sécurisé</Text>
          <View style={[styles.paymentInfo, { backgroundColor: String(colors.background) }]}> 
            <Text style={[styles.paymentText, { color: String(colors.muted) }]}>• Paiement traité par Stripe</Text>
            <Text style={[styles.paymentText, { color: String(colors.muted) }]}>• Données cryptées et sécurisées</Text>
            <Text style={[styles.paymentText, { color: String(colors.muted) }]}>• Cartes Visa, Mastercard acceptées</Text>
          </View>
        </View>

        {/* Status de préparation */}
        {!paymentReady && !loading && (
          <View style={[styles.statusContainer, { backgroundColor: String(colors.muted), opacity: 0.06 }]}>
            <Text style={[styles.statusText, { color: String(colors.muted) }]}>⏳ Préparation du paiement...</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: String(colors.primary) }]}
              onPress={initializePaymentSheet}
            >
              <Text style={[styles.retryButtonText, { color: String(colors.primaryContrast) }]}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Boutons d'action */}
      <View style={[styles.footer, { backgroundColor: String(colors.surface), borderTopColor: String(colors.border) }]}> 
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: String(colors.danger) }]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.payButton,
            (!paymentReady || loading) && styles.payButtonDisabled,
            { backgroundColor: paymentReady ? String(colors.primary) : String(colors.border) }
          ]}
          onPress={handlePayment}
          disabled={!paymentReady || loading}
        >
          {loading ? (
            <ActivityIndicator color={String(colors.primaryContrast)} size="small" />
          ) : (
            <Text style={[styles.payButtonText, { color: String(colors.primaryContrast) }]}>
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
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    margin: 15,
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
  },
  itemDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  divider: {
    height: 1,
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
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  paymentInfo: {
    borderRadius: 8,
    padding: 12,
  },
  paymentText: {
    fontSize: 13,
    marginBottom: 4,
  },
  statusContainer: {
    margin: 15,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 15,
  },
  cancelButton: {
    flex: 1,
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
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
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