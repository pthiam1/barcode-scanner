/**
 * Auteur : Papa Thiam
 * API client pour interagir avec le backend FastAPI.
 * Note : Je l'ai mis dans un sous-dossier MyTest pour éviter de mélanger avec le code de paiement.
 */
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.API_URL ?? 'http://192.168.0.23:8000'; // adapte si ton serveur tourne en docker

export type Item = {
  id: number;
  name: string;
  price: number;
};
  export default API_URL;

// Ajouter un produit
export async function createItem(name: string, price: number): Promise<Item> {
  const res = await fetch(`${API_URL}/items/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price }),
  });

  if (!res.ok) {
    throw new Error(`Erreur API: ${res.status}`);
  }

  return res.json();
}

// Récupérer tous les produits
export async function getItems(): Promise<Item[]> {
  const res = await fetch(`${API_URL}/items/`);
  if (!res.ok) {
    throw new Error(`Erreur API: ${res.status}`);
  }
  return res.json();
}

// Supprimer un produit
export async function deleteItem(id: number): Promise<Item> {
  const res = await fetch(`${API_URL}/items/?item_id=${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Erreur API: ${res.status}`);
  }

  return res.json();
}
