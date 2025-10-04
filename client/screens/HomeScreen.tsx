/**
 * Auteur: Papa Thiam
 * Fonctionnalité: Écran d'accueil avec navigation vers différentes fonctionnalités de l'application.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../screens/CartContext';

export default function HomeScreen({ navigation }: any) {
  const { debugDatabase } = useCart();

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {/* logo : place un fichier logo.png dans /assets et adapte require */}
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>AfricaMarket</Text>
          <Text style={styles.subtitle}>Scan · Panier · Payer</Text>
        </View>



        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ManualAdd')}>
            <Text style={styles.actionTitle}>Ajouter un produit manuellement</Text>
            <Text style={styles.actionSubtitle}>Saisir code-barres, nom et prix</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Scan')}>
            <Text style={styles.actionTitle}>Scanner un produit</Text>
            <Text style={styles.actionSubtitle}>Utilise la caméra pour ajouter au panier</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.actionTitle}>Voir le panier</Text>
            <Text style={styles.actionSubtitle}>Consulter / modifier / payer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#e8f5e8' }]} onPress={() => navigation.navigate('PayScreen')}>
            <Text style={[styles.actionTitle, { color: '#2e7d2e' }]}>💳 Paiement rapide</Text>
            <Text style={[styles.actionSubtitle, { color: '#2e7d2e' }]}>Payer directement sans passer par le panier</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('History')}>
            <Text style={styles.actionTitle}>Historique</Text>
            <Text style={styles.actionSubtitle}>Voir les achats précédents</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#eee' }]} onPress={async () => {
            await debugDatabase();
            Alert.alert('Debug', 'Vérifie la console Metro pour les logs DB.');
          }}>
            <Text style={styles.actionTitle}>Log DB (debug)</Text>
            <Text style={styles.actionSubtitle}>Affiche le contenu DB dans la console</Text>
          </TouchableOpacity>
        </View>

        {/* cree par Papa Thiam */}
        <SafeAreaView style={{ alignItems: 'center', padding: 12 }}>
          <Text style={{ fontSize: 12, color: '#aaa' }}>Auteur : Papa Thiam</Text>
        </SafeAreaView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e3f2fd' }, // bleu clair
  header: { alignItems: 'center', padding: 16 },
  logo: { width: 90, height: 90, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '900', color: '#1976d2', letterSpacing: 1 }, // bleu foncé
  subtitle: { fontSize: 13, color: '#388e3c', marginTop: 2, fontStyle: 'italic' }, // vert foncé

  actions: { padding: 12, flex: 1, justifyContent: 'center' },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#90caf9', // bleu clair
    shadowColor: '#1976d2', // bleu foncé
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    
  },
  actionTitle: { fontSize: 15, fontWeight: '800', color: '#1976d2' }, // bleu foncé
  actionSubtitle: { fontSize: 11, color: '#388e3c', marginTop: 2 }, // vert foncé
});
