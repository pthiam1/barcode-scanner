
/**
 * Auteur: Papa Thiam 
 * Fonctionnalité: Gestion du panier avec contexte React, persistance SQLite, historique des achats, et fonctions de débogage.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';

type Item = {
  id: string; // product id
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

  // Ensure database is opened and return it. Useful when methods are called
  // before initial initDatabase() completed or if the db reference was lost.
  const ensureDb = async () => {
    if (db) return db;
    try {
      const database = await SQLite.openDatabaseAsync('AfricaMarket.db');
      setDb(database);
      return database;
    } catch (err) {
      console.error('Erreur ouverture DB dans ensureDb:', err);
      throw err;
    }
  };

  useEffect(() => {
    const initDatabase = async () => {
      try {
        const database = await SQLite.openDatabaseAsync('AfricaMarket.db'); //AfricaMarket.db se trouve dans le dossier racine de l'application
        
        // Créer les tables si elles n'existent pas
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS cart (
            id TEXT PRIMARY KEY, 
            title TEXT, 
            price INTEGER, 
            quantity INTEGER
          );
          -- legacy history table (kept for migration)
          CREATE TABLE IF NOT EXISTS history (
            id TEXT PRIMARY KEY, 
            title TEXT, 
            price INTEGER, 
            quantity INTEGER, 
            paid_at INTEGER
          );
          -- new normalized schema: orders + order_items
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
        // test pour voir les infos de la base
        const dbInfo = await database.getAllAsync("SELECT name FROM sqlite_master WHERE type='table';");
        console.log('Tables dans la DB:', dbInfo);
        //les contenus des tables
        const cartContents = await database.getAllAsync("SELECT * FROM cart;");
        console.log('Contenu de la table cart:', cartContents);
        const historyContents = await database.getAllAsync("SELECT * FROM history;");
        console.log('Contenu de la table history:', historyContents);

        // If there are rows in legacy history but orders table is empty, migrate
        const ordersCount = await database.getFirstAsync('SELECT COUNT(*) as c FROM orders;') as {c: number};
        if ((historyContents as any[]).length > 0 && ordersCount.c === 0) {
          console.log('Migration: migrating legacy history -> orders/order_items');
          try {
            // group by paid_at
            const groups: { [paidAt: number]: any[] } = {};
            (historyContents as any[]).forEach((r: any) => {
              const paidAt = r.paid_at ? Number(r.paid_at) : Date.now();
              if (!groups[paidAt]) groups[paidAt] = [];
              groups[paidAt].push(r);
            });

            for (const paidAtStr of Object.keys(groups)) {
              const paidAt = Number(paidAtStr);
              const rows = groups[paidAt];
              const total = rows.reduce((s: number, rr: any) => s + (rr.price * rr.quantity), 0);

              await database.runAsync('BEGIN TRANSACTION;');
              await database.runAsync('INSERT INTO orders (paid_at, total) VALUES (?, ?);', [paidAt, total]);
              const last = await database.getFirstAsync('SELECT last_insert_rowid() as id;') as {id: number};
              const orderId = last.id;

              for (const rr of rows) {
                // try to recover product_id from legacy id if it contains one
                const pid = (typeof rr.id === 'string' && rr.id.includes('_')) ? rr.id.split('_')[0] : rr.id;
                const itemId = `${pid}_${orderId}_${Math.random().toString(36).slice(2,8)}`;
                await database.runAsync('INSERT INTO order_items (id, order_id, product_id, title, price, quantity) VALUES (?, ?, ?, ?, ?, ?);', [itemId, orderId, pid, rr.title, rr.price, rr.quantity]);
              }

              await database.runAsync('COMMIT;');
            }

            console.log('Migration complete');
          } catch (mErr) {
            console.error('Migration error:', mErr);
            try { await database.runAsync('ROLLBACK;'); } catch (_) {}
          }
        }

        

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
      console.log('Panier actuel:', cartItems);
      
      // Contenu de l'historique
      const historyItems = await db.getAllAsync('SELECT * FROM history;');
      console.log('Legacy history rows:', historyItems);

      // New normalized tables
      try {
        const orders = await db.getAllAsync('SELECT * FROM orders ORDER BY paid_at DESC;');
        console.log('Orders:', orders);
        const orderItems = await db.getAllAsync('SELECT * FROM order_items ORDER BY order_id DESC;');
        console.log('Order items:', orderItems);
      } catch (err) {
        console.log('No orders/order_items tables or error reading them:', err);
      }
      
      // Statistiques
      const cartCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM cart;') as {count: number};
  const historyCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM history;') as {count: number};
  let ordersCount = {count: 0} as {count: number};
  try { ordersCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM orders;') as {count: number}; } catch (_) {}
      
      console.log(`Statistiques: ${cartCount.count} items dans le panier, ${historyCount.count} dans l'historique`);
  console.log(`Statistiques: orders=${ordersCount.count}`);
    } catch (error) {
      console.error('Erreur debug DB:', error);
    }
  };

  const getHistory = async (): Promise<Item[]> => {
    try {
      const database = await ensureDb();

      // Read orders and their items
      const orders = (await database.getAllAsync('SELECT order_id, paid_at, total FROM orders ORDER BY paid_at DESC;')) as any[];
      const historyResult: any[] = [];
      for (const o of orders) {
        const itemsRows = (await database.getAllAsync('SELECT product_id, title, price, quantity FROM order_items WHERE order_id = ?;', [o.order_id])) as any[];
        historyResult.push({
          id: o.order_id,
          paid_at: o.paid_at,
          title: '',
          price: o.total,
          quantity: 1,
          items: itemsRows
        });
      }

      return historyResult as any;
    } catch (error) {
      console.error('Erreur récupération historique:', error);
      return [];
    }
  };

  const moveCartToHistory = async () => {
    if (items.length === 0) return;

    try {
      const database = await ensureDb();
      const timestamp = Date.now();
      const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

      await database.runAsync('BEGIN TRANSACTION;');
      await database.runAsync('INSERT INTO orders (paid_at, total) VALUES (?, ?);', [timestamp, total]);
      const last = await database.getFirstAsync('SELECT last_insert_rowid() as id;') as {id: number};
      const orderId = last.id;

      for (const item of items) {
        const itemRowId = `${item.id}_${orderId}_${Math.random().toString(36).slice(2,8)}`;
        await database.runAsync('INSERT INTO order_items (id, order_id, product_id, title, price, quantity) VALUES (?, ?, ?, ?, ?, ?);', [itemRowId, orderId, item.id, item.title, item.price, item.quantity]);
      }

      await database.runAsync('COMMIT;');

      // Vider le panier
      await clearCart();

      console.log('Achat enregistré dans l\'historique (orders/order_items)');
    } catch (error) {
      console.error('Erreur enregistrement achat:', error);
      try { await (await ensureDb()).runAsync('ROLLBACK;'); } catch (_) {}
      throw error;
    }
  };

  const clearHistory = async () => {
    try {
      const database = await ensureDb();
      // delete normalized tables
      await database.runAsync('BEGIN TRANSACTION;');
      await database.runAsync('DELETE FROM order_items;');
      await database.runAsync('DELETE FROM orders;');
      // optional: clear legacy history too
      try { await database.runAsync('DELETE FROM history;'); } catch (_) {}
      await database.runAsync('COMMIT;');
      console.log('🗑️ Historique vidé (orders + order_items + legacy history)');
    } catch (error) {
      console.error('Erreur vidage historique:', error);
      try { const database = await ensureDb(); await database.runAsync('ROLLBACK;'); } catch (_) {}
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


