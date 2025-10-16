/**
 * Auteur: Papa Thiam
 * Fonctionnalité: Gestion du panier avec contexte React, persistance SQLite,
 * historique des achats (orders + order_items), et fonctions de débogage.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';

type Item = {
  id: string; // product id
  title: string;
  price: number; // en centimes
  quantity: number;
};

type CartContextType = {
  items: Item[];
  addItem: (item: Omit<Item, 'quantity'>, qty?: number) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  saveCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  debugDatabase: () => Promise<void>;
  getHistory: () => Promise<any[]>;
  moveCartToHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Ouvre la base de données si nécessaire */
  const ensureDb = async () => {
    if (db) return db;
    const database = await SQLite.openDatabaseAsync('AfricaMarket.db');
    setDb(database);
    return database;
  };

  /** Initialisation de la base de données */
  useEffect(() => {
    const initDatabase = async () => {
      try {
        const database = await SQLite.openDatabaseAsync('AfricaMarket.db');

        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS cart (
            id TEXT PRIMARY KEY,
            title TEXT,
            price INTEGER,
            quantity INTEGER
          );
          CREATE TABLE IF NOT EXISTS orders (
            order_id INTEGER PRIMARY KEY AUTOINCREMENT,
            paid_at INTEGER,
            total INTEGER
          );
          CREATE TABLE IF NOT EXISTS order_items (
            id TEXT PRIMARY KEY,
            order_id INTEGER,
            product_id TEXT,
            title TEXT,
            price INTEGER,
            quantity INTEGER,
            FOREIGN KEY(order_id) REFERENCES orders(order_id)
          );
        `);

        setDb(database);
        await loadCartFromDb(database);

        // Debug: liste des tables existantes
        const dbInfo = await database.getAllAsync("SELECT name FROM sqlite_master WHERE type='table';");
        console.log('Tables dans la DB:', dbInfo);

        const cartContents = await database.getAllAsync('SELECT * FROM cart;');
        console.log('Contenu de la table cart:', cartContents);
      } catch (error) {
        console.error('Erreur initialisation DB:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initDatabase();
  }, []);

  /** Charge les items depuis la base */
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

  /** Sauvegarde du panier */
  const saveCart = async () => {
    try {
      const database = await ensureDb();
      await database.runAsync('DELETE FROM cart;');
      for (const item of items) {
        await database.runAsync(
          'INSERT OR REPLACE INTO cart (id, title, price, quantity) VALUES (?, ?, ?, ?);',
          [item.id, item.title, item.price, item.quantity]
        );
      }
    } catch (error) {
      console.error('Erreur sauvegarde panier:', error);
    }
  };

  /** Ajout d’un article */
  const addItem = async (item: Omit<Item, 'quantity'>, qty = 1) => {
    if (!db) return;

    try {
      const existingItem = (await db.getFirstAsync('SELECT * FROM cart WHERE id = ?;', [item.id])) as Item | null;
      const newQuantity = existingItem ? existingItem.quantity + qty : qty;

      await db.runAsync(
        'INSERT OR REPLACE INTO cart (id, title, price, quantity) VALUES (?, ?, ?, ?);',
        [item.id, item.title, item.price, newQuantity]
      );

      setItems((prev) =>
        prev.find((p) => p.id === item.id)
          ? prev.map((p) => (p.id === item.id ? { ...p, quantity: newQuantity } : p))
          : [...prev, { ...item, quantity: newQuantity }]
      );
    } catch (error) {
      console.error('Erreur ajout item:', error);
    }
  };

  /** Supprime un article du panier */
  const removeItem = async (id: string) => {
    if (!db) return;
    try {
      await db.runAsync('DELETE FROM cart WHERE id = ?;', [id]);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Erreur suppression item:', error);
    }
  };

  /** Met à jour la quantité d’un article */
  const setQuantity = async (id: string, qty: number) => {
    if (!db) return;

    try {
      if (qty <= 0) {
        await removeItem(id);
        return;
      }
      await db.runAsync('UPDATE cart SET quantity = ? WHERE id = ?;', [qty, id]);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
    } catch (error) {
      console.error('Erreur mise à jour quantité:', error);
    }
  };

  /** Vide complètement le panier */
  const clearCart = async () => {
    if (!db) return;
    try {
      await db.runAsync('DELETE FROM cart;');
      setItems([]);
    } catch (error) {
      console.error('Erreur vidage panier:', error);
    }
  };

  /** Calcule le total du panier */
  const getTotalPrice = (): number => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  /** Débogage complet de la base de données */
  const debugDatabase = async () => {
    if (!db) return;
    try {
      console.log('=== DEBUG AfricaMarket.db ===');
      const cartItems = await db.getAllAsync('SELECT * FROM cart;');
      console.log('Panier actuel:', cartItems);

      const orders = await db.getAllAsync('SELECT * FROM orders ORDER BY paid_at DESC;');
      console.log('Orders:', orders);

      const orderItems = await db.getAllAsync('SELECT * FROM order_items ORDER BY order_id DESC;');
      console.log('Order items:', orderItems);

      const cartCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM cart;') as { count: number };
      const ordersCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM orders;') as { count: number };

      console.log(`Statistiques: ${cartCount.count} items dans le panier`);
      console.log(`Statistiques: ${ordersCount.count} commandes dans l’historique`);
    } catch (error) {
      console.error('Erreur debug DB:', error);
    }
  };

  /** Récupère l’historique complet (orders + items) */
  const getHistory = async (): Promise<any[]> => {
    try {
      const database = await ensureDb();
      const orders = (await database.getAllAsync('SELECT order_id, paid_at, total FROM orders ORDER BY paid_at DESC;')) as any[];

      const historyResult: any[] = [];
      for (const o of orders) {
        const itemsRows = await database.getAllAsync(
          'SELECT product_id, title, price, quantity FROM order_items WHERE order_id = ?;',
          [o.order_id]
        );
        historyResult.push({
          id: o.order_id,
          paid_at: o.paid_at,
          total: o.total,
          items: itemsRows,
        });
      }

      return historyResult;
    } catch (error) {
      console.error('Erreur récupération historique:', error);
      return [];
    }
  };

  /** Déplace le panier actuel vers l’historique (orders/order_items) */
  const moveCartToHistory = async () => {
    if (items.length === 0) return;

    try {
      const database = await ensureDb();
      const timestamp = Date.now();
      const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

      await database.runAsync('BEGIN TRANSACTION;');
      await database.runAsync('INSERT INTO orders (paid_at, total) VALUES (?, ?);', [timestamp, total]);
      const last = (await database.getFirstAsync('SELECT last_insert_rowid() as id;')) as { id: number };
      const orderId = last.id;

      for (const item of items) {
        const itemRowId = `${item.id}_${orderId}_${Math.random().toString(36).slice(2, 8)}`;
        await database.runAsync(
          'INSERT INTO order_items (id, order_id, product_id, title, price, quantity) VALUES (?, ?, ?, ?, ?, ?);',
          [itemRowId, orderId, item.id, item.title, item.price, item.quantity]
        );
      }

      await database.runAsync('COMMIT;');
      await clearCart();

      console.log('Achat enregistré dans l’historique (orders/order_items)');
    } catch (error) {
      console.error('Erreur enregistrement achat:', error);
      try {
        await (await ensureDb()).runAsync('ROLLBACK;');
      } catch (_) {}
      throw error;
    }
  };

  /** Vide complètement l’historique */
  const clearHistory = async () => {
    try {
      const database = await ensureDb();
      await database.runAsync('BEGIN TRANSACTION;');
      await database.runAsync('DELETE FROM order_items;');
      await database.runAsync('DELETE FROM orders;');
      await database.runAsync('COMMIT;');
      console.log('🗑️ Historique vidé (orders + order_items)');
    } catch (error) {
      console.error('Erreur vidage historique:', error);
      try {
        const database = await ensureDb();
        await database.runAsync('ROLLBACK;');
      } catch (_) {}
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        setQuantity,
        clearCart,
        getTotalPrice,
        saveCart,
        loadCart,
        debugDatabase,
        getHistory,
        moveCartToHistory,
        clearHistory,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const c = useContext(CartContext);
  if (!c) throw new Error('useCart must be used within CartProvider');
  return c;
};
