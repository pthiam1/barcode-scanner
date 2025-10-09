import { useStripe } from "@stripe/stripe-react-native";
import Constants from "expo-constants";
import React, { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "./screens/CartContext";
import { useTheme } from './theme/ThemeProvider';


export default function CheckoutScreen() {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);
    const [paymentIntentId, setPaymentIntentId] = useState<string>("");
    const { items, moveCartToHistory } = useCart();
    const { colors } = useTheme();

    const apiUrl = "http://192.168.0.23:8000"; 
    const userId = "cus_T8z0MLLNC5khnY";
    
    // Convertir les items du panier pour l'API
    const pendingItems = items.map(item => ({
        id: parseInt(item.id) || 1, // Fallback si l'ID n'est pas un nombre
        amount: item.quantity
    }));

    const fetchPaymentSheetParams = async () => {
        const response = await fetch(`${apiUrl}/payments/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "pending_items": pendingItems,
                "customer_id": userId
            })
        });

        const { paymentIntent, ephemeralKey, customer } = await response.json();

        return {
            paymentIntent,
            ephemeralKey,
            customer,
        };
    };
    //initialisation du payment sheet
    const initializePaymentSheet = async () => {
        const {
            paymentIntent,
            ephemeralKey,
            customer,
        } = await fetchPaymentSheetParams();

        const { error } = await initPaymentSheet({
            merchantDisplayName: "Example, Inc.",
            customerId: customer,
            customerEphemeralKeySecret: ephemeralKey,
            paymentIntentClientSecret: paymentIntent,
            allowsDelayedPaymentMethods: false,
        });

        if (!error) {
            setPaymentIntentId(paymentIntent);
            setLoading(true);
        }
    };
    //ouverture du payment sheet et confirmation du paiement
    const openPaymentSheet = async () => {
        const { error } = await presentPaymentSheet();

        if (error) {
            Alert.alert(`Error code: ${error.code}`, error.message);
        } else {
            const paymentIntent = `pi_${paymentIntentId.split("_")[1]}`;
            const response = await fetch(`${apiUrl}/payments/check/${paymentIntent}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "customer_id": userId
                })
            });

            if (response.status == 200) {
                try {
                    // Enregistrer l'achat dans l'historique
                    await moveCartToHistory();
                    Alert.alert('Success', 'Your order is confirmed and saved to history!');
                } catch (error) {
                    console.error('Erreur sauvegarde historique:', error);
                    Alert.alert('Success', 'Your order is confirmed!');
                }
            }
        }
    };

    useEffect(() => {
        initializePaymentSheet();
    }, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
            <Text style={{ color: colors.text, fontSize: 18, marginBottom: 12 }}>Payment</Text>
            <TouchableOpacity
                disabled={!loading}
                style={[styles.btn, { backgroundColor: loading ? String(colors.primary) : '#999' }]}
                onPress={openPaymentSheet}
            >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Checkout</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  btn: { padding: 16, borderRadius: 10, alignItems: 'center' }
});
