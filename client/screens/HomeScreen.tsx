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
import { useTheme } from '../theme/ThemeProvider';
import ThemeToggle from '../theme/ThemeToggle';

export default function HomeScreen({ navigation }: any) {
  const { debugDatabase } = useCart();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.header}>
          {/* logo : place un fichier logo.png dans /assets et adapte require */}
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.title, { color: colors.primary }]}>AfricaMarket</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Scan · Panier · Payer</Text>
          <View style={{ position: 'absolute', right: 12, top: 12 }}>
            <ThemeToggle />
          </View>
        </View>



        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: String(colors.card), borderColor: String(colors.border) }]} onPress={() => navigation.navigate('ManualAdd')}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Ajouter un produit manuellement</Text>
            <Text style={[styles.actionSubtitle, { color: colors.muted }]}>Saisir code-barres, nom et prix</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: String(colors.card), borderColor: String(colors.border) }]} onPress={() => navigation.navigate('Scan')}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Scanner un produit</Text>
            <Text style={[styles.actionSubtitle, { color: colors.muted }]}>Utilise la caméra pour ajouter au panier</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: String(colors.card), borderColor: String(colors.border) }]} onPress={() => navigation.navigate('Cart')}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Voir le panier</Text>
            <Text style={[styles.actionSubtitle, { color: colors.muted }]}>Consulter / modifier / payer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: String(colors.card), borderColor: String(colors.border) }]} onPress={() => navigation.navigate('PayScreen')}>
            <Text style={[styles.actionTitle, { color: colors.primary }]}>💳 Paiement rapide</Text>
            <Text style={[styles.actionSubtitle, { color: colors.muted }]}>Payer directement sans passer par le panier</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: String(colors.card), borderColor: String(colors.border) }]} onPress={() => navigation.navigate('History')}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Historique</Text>
            <Text style={[styles.actionSubtitle, { color: colors.muted }]}>Voir les achats précédents</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: String(colors.card), borderColor: String(colors.border) }]} onPress={async () => {
            await debugDatabase();
            Alert.alert('Debug', 'Vérifie la console Metro pour les logs DB.');
          }}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Log DB (debug)</Text>
            <Text style={[styles.actionSubtitle, { color: colors.muted }]}>Affiche le contenu DB dans la console</Text>
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
