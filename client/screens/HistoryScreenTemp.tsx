/**
 * Auteur: Papa Thiam
 * Fonctionnalité: Affichage de l'historique des achats, avec possibilité de rafraîchir et de vider l'historique.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from './CartContext';

interface HistoryItem {
  id: number; // order_id
  paid_at: number;
  // total stored in cents
  price: number;
  items: Array<{
    product_id?: string;
    title: string;
    price: number;
    quantity: number;
  }>;
}

export default function HistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const { getHistory, clearHistory } = useCart();

  const loadHistory = async () => {
    try {
      // Récupérer l'historique via le CartContext
      const orders = await getHistory();
      if (orders && orders.length > 0) {
        const historyData: HistoryItem[] = (orders as any[])
          .map(o => ({
            id: Number(o.id),
            paid_at: Number(o.paid_at),
            price: o.price ?? o.total,
            items: (o.items || []).map((it: any) => ({ product_id: it.product_id, title: it.title || it.name, price: it.price, quantity: it.quantity }))
          }))
          .sort((a, b) => Number(b.paid_at) - Number(a.paid_at));

        setHistory(historyData);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory();
      await loadHistory(); // Actualiser l'affichage
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'historique:', error);
    }
  };
  // Rendu d'un item de l'historique
  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <TouchableOpacity onPress={() => setExpandedOrder(expandedOrder === item.id ? null : item.id)} style={{flex:1}}>
          <Text style={styles.historyDate}>{new Date(item.paid_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
        </TouchableOpacity>
        <Text style={styles.historyTotal}>{(item.price / 100).toFixed(2)} FCFA</Text>
      </View>
      {expandedOrder === item.id ? (
        <View style={styles.itemsList}>
          {item.items.map((product, index) => (
            <View key={index} style={styles.productItem}>
              <Text style={styles.productName}>{product.title}</Text>
              <Text style={styles.productDetails}>
                {product.quantity}x {(product.price / 100).toFixed(2)} FCFA
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );

  // Affichage quand l'historique est vide
  const renderEmptyHistory = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Aucun achat dans l'historique</Text>
      <Text style={styles.subText}>Vos achats apparaîtront ici après paiement</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique des achats</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Vider</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          contentContainerStyle={history.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={renderEmptyHistory}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  list: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  historyItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  historyTotal: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  itemsList: {
    gap: 6,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  productName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  productDetails: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});