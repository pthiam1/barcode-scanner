# 📱 AfricaMarket - Scanner Code-Barres

Ce projet de TP académique en M2 vise à développer une application mobile de  électronique avec scanner de code-barres ou ajout manuel de produits, gestion de panier, et paiements via Stripe. L'application est construite avec React Native pour le frontend et FastAPI pour le backend.

## Fonctionnalités

###  Fonctionnalités Implémentées
- **Scanner de code-barres** avec caméra intégrée
- **Ajout manuel** de produits si la caméra n'est pas disponible
- **Panier intelligent** avec gestion des quantités
- **Paiements sécurisés** via Stripe
- **Historique des achats** avec interface moderne
- **Persistance des données** avec SQLite
- **API Backend** complète avec FastAPI
- **Navigation fluide** entre tous les écrans

###  Écrans Disponibles
- **Accueil** : Navigation principale
- **Scanner** : Scan de codes-barres avec caméra
- **Ajout Manuel** : Saisie manuelle de produits
- **Panier** : Gestion des articles et quantités
- **Paiement** : Intégration Stripe complète
- **Historique** : Consultation des achats passés


<img src="./client/assets/Screenshot_20251004_143018.png" alt="Accueil" width="200"/> <img src="./client/assets/Screenshot_20251004_144056.png" alt="Scanner" width="200"/> <img src="./client/assets/Screenshot_20251004_143052.png" alt="Ajout Manuel" width="200"/> <img src="./client/assets/Screenshot_20251004_150631.png" alt="Stripe Paiement" width="200"/>


<img src="./client/assets/Screenshot_20251004_144305.png" alt="Panier" width="200"/> <img src="./client/assets/Screenshot_20251004_144420.png" alt="Paiement" width="200"/> <img src="./client/assets/Screenshot_20251004_144647.png" alt="Historique" width="200"/>
<img src="./client/assets/Screenshot_20251004_144633.png" alt="Paiement Réussi" width="200"/>
## Technologies Utilisées

### Frontend (Client)
- **React Native** avec Expo SDK 54
- **TypeScript** pour le typage
- **React Navigation 6** pour la navigation
- **Expo Camera** pour le scanner
- **Expo SQLite** pour la persistance
- **Stripe React Native** pour les paiements

### Backend (Serveur)
- **FastAPI** (Python)
- **SQLite** base de données
- **Stripe API** pour les paiements
- **Docker** pour le déploiement

##  Structure du Projet

```
barcode-scanner/
├── client/                 # Application React Native
│   ├── screens/           # Écrans de l'application
│   ├── assets/           # Images et ressources
│   └── android/          # Configuration Android
├── server/               # API Backend FastAPI
│   ├── src/             # Code source Python
│   └── docker-compose.yml
├── Code-barre/          # Outils de génération de codes-barres
└── venv/                # Environnement Python virtuel
```

##  Installation et Lancement

### Prérequis
- Node.js LTS
- Android Studio ou émulateur
- Python 3.8+
- Compte Stripe (pour les paiements)

### 1. Backend (Serveur)
```bash
cd server
# Avec Docker (recommandé)
sudo docker compose up --build
sudo docker compose logs -f 


```

### 2. Frontend (Client)
```bash
cd client
npm install
npm run android  # ou npm run ios
```

### 3. Génération de Codes-Barres (Optionnel)
```bash
# Créer l'environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install python-barcode pillow requests

# Générer des codes-barres de test
python Code-barre/generate_product_barcodes.py
```
# Aperçu de l'Application

## Configuration

### Variables d'Environnement (Server)
Créer un fichier `.env` dans le dossier `server/` :
```env
STRIPE_SK=sk_test_votre_cle_secrete_stripe
STRIPE_PK=pk_test_votre_cle_publique_stripe
```

### Configuration Stripe (Client)
Dans `client/App.tsx`, mettre à jour la clé publique Stripe :
```typescript
const stripePK = "pk_test_votre_cle_publique_stripe";
```

## API Endpoints

- `GET /items/` - Liste des produits
- `POST /items/` - Créer un produit
- `GET /items/barcode/{code}` - Rechercher par code-barres
- `POST /payments/` - Créer un paiement Stripe
- `GET /docs` - Documentation Swagger

## Utilisation

1. **Lancer le serveur** : `cd server && docker-compose up`
2. **Lancer l'app mobile** : `cd client && npm run android`
3. **Scanner un produit** ou l'ajouter manuellement
4. **Gérer le panier** (quantités, suppression)
5. **Effectuer un paiement** via Stripe
6. **Consulter l'historique** des achats

##  Problèmes Résolus

-  Migration des APIs Expo dépréciées
-  Configuration Java 17 pour Android
-  Correction des clés Stripe
-  Intégration SQLite moderne
-  Structure de données paiements Stripe

##  Notes Techniques

### Base de Données SQLite
- Table `cart` : Articles du panier actuel
- Table `history` : Historique des achats

### Gestion des États
- Context API pour le panier partagé
- Persistance automatique en base
- Synchronisation entre écrans

### Paiements Stripe
- Customer ID : `cus_TAbp6YpLSrRqOU`
- Format des données : `{pending_items: [{id, amount}]}`
- Gestion complète des erreurs

## Auteur
**Papa Thiam**
> Projet M2 - Programmation Mobile

**Status** : En cours de finalisation