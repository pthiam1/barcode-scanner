
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';

type Item = {
  id: string; // barcode or product id
  title: string;
  price: number; // cents
  quantity: number;
};

type CartContextType = {
  items: Item[];
  addItem: (item: Omit<Item,'quantity'>, qty?: number) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  saveCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  debugDatabase: () => Promise<void>;
  getHistory: () => Promise<Item[]>;
  moveCartToHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        const database = await SQLite.openDatabaseAsync('AfricaMarket.db'); 
        
        // Créer les tables si elles n'existent pas
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS cart (
            id TEXT PRIMARY KEY, 
            title TEXT, 
            price INTEGER, 
            quantity INTEGER
          );
          CREATE TABLE IF NOT EXISTS history (
            id TEXT PRIMARY KEY, 
            title TEXT, 
            price INTEGER, 
            quantity INTEGER, 
            paid_at INTEGER
          );
        `);
        
        setDb(database);
        await loadCartFromDb(database);
      } catch (error) {
        console.error('Erreur initialisation DB:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initDatabase();
  }, []);

  const loadCartFromDb = async (database: SQLite.SQLiteDatabase) => {
    try {
      const result = await database.getAllAsync('SELECT * FROM cart;');
      setItems(result as Item[]);
    } catch (error) {
      console.error('Erreur chargement panier:', error);
    }
  };

  const loadCart = async () => {
    if (!db) return;
    await loadCartFromDb(db);
  };

  const saveCart = async () => {
    if (!db) return;
    
    try {
      await db.runAsync('DELETE FROM cart;');
      for (const item of items) {
        await db.runAsync(
          'INSERT OR REPLACE INTO cart (id, title, price, quantity) VALUES (?, ?, ?, ?);',
          [item.id, item.title, item.price, item.quantity]
        );
      }
    } catch (error) {
      console.error('Erreur sauvegarde panier:', error);
    }
  };

  const addItem = async (item: Omit<Item,'quantity'>, qty = 1) => {
    if (!db) return;

    try {
      const existingItem = await db.getFirstAsync(
        'SELECT * FROM cart WHERE id = ?;',
        [item.id]
      ) as Item | null;

      let newQuantity = qty;
      if (existingItem) {
        newQuantity = existingItem.quantity + qty;
      }

      await db.runAsync(
        'INSERT OR REPLACE INTO cart (id, title, price, quantity) VALUES (?, ?, ?, ?);',
        [item.id, item.title, item.price, newQuantity]
      );

      setItems(prev => {
        const found = prev.find(p => p.id === item.id);
        if (found) {
          return prev.map(p => p.id === item.id ? { ...p, quantity: newQuantity } : p);
        } else {
          return [...prev, { ...item, quantity: newQuantity }];
        }
      });
    } catch (error) {
      console.error('Erreur ajout item:', error);
    }
  };

  const removeItem = async (id: string) => {
    if (!db) return;

    try {
      await db.runAsync('DELETE FROM cart WHERE id = ?;', [id]);
      setItems(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Erreur suppression item:', error);
    }
  };

  const setQuantity = async (id: string, qty: number) => {
    if (!db) return;

    try {
      if (qty <= 0) {
        await removeItem(id);
        return;
      }

      await db.runAsync('UPDATE cart SET quantity = ? WHERE id = ?;', [qty, id]);
      setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
    } catch (error) {
      console.error('Erreur mise à jour quantité:', error);
    }
  };

  const clearCart = async () => {
    if (!db) return;

    try {
      await db.runAsync('DELETE FROM cart;');
      setItems([]);
    } catch (error) {
      console.error('Erreur vidage panier:', error);
    }
  };

  const getTotalPrice = (): number => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const debugDatabase = async () => {
    if (!db) return;

    try {
      console.log('=== DEBUG AfricaMarket.db ===');
      
      // Contenu du panier
      const cartItems = await db.getAllAsync('SELECT * FROM cart;');
      console.log('🛒 Panier actuel:', cartItems);
      
      // Contenu de l'historique
      const historyItems = await db.getAllAsync('SELECT * FROM history;');
      console.log('📚 Historique:', historyItems);
      
      // Statistiques
      const cartCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM cart;') as {count: number};
      const historyCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM history;') as {count: number};
      
      console.log(`📊 Statistiques: ${cartCount.count} items dans le panier, ${historyCount.count} dans l'historique`);
    } catch (error) {
      console.error('Erreur debug DB:', error);
    }
  };

  const getHistory = async (): Promise<Item[]> => {
    if (!db) return [];

    try {
      const result = await db.getAllAsync('SELECT id, title, price, quantity FROM history ORDER BY paid_at DESC;');
      return result as Item[];
    } catch (error) {
      console.error('Erreur récupération historique:', error);
      return [];
    }
  };

  const moveCartToHistory = async () => {
    if (!db || items.length === 0) return;

    try {
      const timestamp = Date.now();
      
      // Copier les items du panier vers l'historique
      for (const item of items) {
        await db.runAsync(
          'INSERT INTO history (id, title, price, quantity, paid_at) VALUES (?, ?, ?, ?, ?);',
          [item.id, item.title, item.price, item.quantity, timestamp]
        );
      }
      
      // Vider le panier
      await clearCart();
      
      console.log('✅ Achat enregistré dans l\'historique');
    } catch (error) {
      console.error('Erreur enregistrement achat:', error);
      throw error;
    }
  };

  const clearHistory = async () => {
    if (!db) return;

    try {
      await db.runAsync('DELETE FROM history;');
      console.log('🗑️ Historique vidé');
    } catch (error) {
      console.error('Erreur vidage historique:', error);
      throw error;
    }
  };

  return <CartContext.Provider value={{ items, addItem, removeItem, setQuantity, clearCart, getTotalPrice, saveCart, loadCart, debugDatabase, getHistory, moveCartToHistory, clearHistory }}>
    {children}
  </CartContext.Provider>;
};

export const useCart = () => {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
};


