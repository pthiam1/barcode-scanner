# 📱 AfricaMarket - Scanner Code-Barres

Ce projet de TP académique en M2 vise à développer une application mobile de  électronique avec scanner de code-barres ou ajout manuel de produits, gestion de panier, et paiements via Stripe. L'application est construite avec React Native pour le frontend et FastAPI pour le backend.

## Principales fonctionnalités
 ---------------------------
 - Scanner de code‑barres avec la caméra (ou saisie manuelle)
 - Ajout automatique d'un produit au panier après lecture
 - Gestion du panier (quantités, suppression, vider)
 - Paiements via Stripe (PaymentSheet)
 - Historique des commandes (persisté en SQLite)
 - Mode Jour / Nuit global (toggle) — thème persistant
 - Persistance locale via SQLite (cart, orders, order_items)

## Structure du projet
 -------------------
 barcode-scanner/
 - client/       -> Application React Native (Expo)
	 - screens/    -> Écrans de l'application
	 - theme/      -> ThemeProvider + toggle (jour/nuit)
	 - assets/     -> Images et ressources (icônes, screenshots)
 - server/       -> API FastAPI (endpoints produits / paiements)
 - Code-barre/   -> Outils / scripts utilitaires pour générer des codes

 Prérequis
 ---------
 - Node.js LTS
 - Yarn ou npm
 - Expo CLI (optionnel mais recommandé)
 - Android Studio / Xcode ou un appareil réel
 - Python 3.8+ (pour le backend)
 - Compte Stripe pour tests (clé publique + clé secrète)

 Installation et exécution
 -------------------------
 1) Backend

 Ouvrir un terminal et lancer le backend (depuis `server/`). Exemples :

 - Avec Docker (recommandé si disponible) :

 ```bash
 cd server
 sudo docker compose up --build
 ```

 - Sans Docker (local) :

 ```bash
 cd server
 python -m venv .venv
 source .venv/bin/activate
 pip install -r requirements.txt
 uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
 ```

 2) Frontend (client)

 ```bash
 cd client
 npm install
 # Lancer sur Android (ou utiliser Expo dev tools)
 npm run android
 ```

 Remarques réseau :
 - Si le serveur est lancé en local sur une machine différente (même réseau), mettez à jour l'URL `apiUrl` dans les écrans (par ex. `client/screens/BarcodeScreen.tsx` et `client/CheckoutScreen.tsx`) pour pointer vers l'adresse IP du serveur.

 Configuration Stripe
 --------------------
 - Définissez les clés Stripe dans le backend (fichier `.env` à la racine de `server/`) :

 ```
 STRIPE_SK=sk_test_xxx
 STRIPE_PK=pk_test_xxx
 ```

 - Dans `client/App.tsx` la clé publique est utilisée pour initialiser Stripe : remplacez la clé de test par la vôtre lorsque nécessaire.

 Base de données locale (SQLite)
 -------------------------------
 Le frontend utilise SQLite pour persister :
 - `cart` : articles actuellement dans le panier
 - `orders` : chaque commande payée (order_id, paid_at, total)
 - `order_items` : lignes de chaque commande (product_id, title, price, quantity)

 Lors du paiement validé, le panier est converti en `orders` + `order_items` (transactionnel) puis vidé.

 API exposées côté backend (exemples)
 -------------------------------------
 - GET /items/                 — liste produits
 - POST /items/                — créer produit
 - GET /items/barcode/{code}   — récupérer produit par code‑barres
 - POST /payments/             — créer session / payment intent pour Stripe
 - POST /payments/check/{id}   — vérifier statut paiement (optionnel)

 Design & theming
 -----------------
 - Un `ThemeProvider` expose `useTheme()` qui fournit :
	 - `theme` : 'light' | 'dark'
	 - `colors` : palette (background, card, text, primary, border, muted)
	 - `toggleTheme()` : bascule et persistance via AsyncStorage
 - Le toggle est accessible depuis le header et depuis l'écran d'accueil.

 Conseils de développement
 -------------------------
 - Lancer `npx tsc --noEmit` dans le dossier `client` permet de vérifier les erreurs TypeScript sans lancer l'application.
 - Utiliser les logs (Metro / console du backend) pour diagnostiquer les appels API et erreurs SQLite.

 Dépannage courant
 -----------------
 - Erreur caméra : vérifier les permissions et l'état de `Camera.requestCameraPermissionsAsync()`.
 - Erreur de connexion au backend : vérifier l'URL `apiUrl` et le pare‑feu/local network.
 - Erreur Stripe : vérifier vos clés et les logs du backend.

 Notes techniques
 ----------------
 - Le panier utilise un contexte React (`CartContext`) pour exposer : `items`, `addItem`, `removeItem`, `setQuantity`, `clearCart`, `saveCart`, `loadCart`, `getHistory`, `moveCartToHistory`, `clearHistory`.
 - Le schéma SQLite est normalisé pour stocker correctement les commandes et leurs lignes.

 Auteurs & Licence
 ------------------
 Auteur : Papa Thiam
 Projet : M2 — Programmation Mobile

 Statut : en cours de finalisation