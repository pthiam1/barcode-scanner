/**
 * Auteur : Papa Thiam
 * Écran pour gérer les produits (CRUD).
 * Note : Je l'ai mis dans un sous-dossier MyTest pour éviter de mélanger avec le code de paiement.
 */
import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList, TextInput } from "react-native";
import { createItem, getItems, deleteItem, Item } from "./api";

export default function ItemsScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  async function loadItems() {
    try {
      const data = await getItems();
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function addNewItem() {
    try {
      await createItem(name, parseInt(price));
      setName("");
      setPrice("");
      loadItems();
    } catch (err) {
      console.error(err);
    }
  }

  async function removeItem(id: number) {
    try {
      await deleteItem(id);
      loadItems();
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Produits</Text>

      <TextInput
        placeholder="Nom du produit"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <TextInput
        placeholder="Prix"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <Button title="Ajouter" onPress={addNewItem} />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginVertical: 5,
            }}
          >
            <Text>
              {item.name} - {item.price} fcfa
            </Text>
            <Button title="Supprimer" onPress={() => removeItem(item.id)} />
          </View>
        )}
      />
    </View>
  );
}
