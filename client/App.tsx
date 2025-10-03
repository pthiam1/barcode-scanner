import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StripeProvider } from '@stripe/stripe-react-native';
import { CartProvider } from './screens/CartContext';

// Screens
import HomeScreen from './screens/HomeScreen';
import BarcodeScreen from './screens/BarcodeScreen';
import ManualAddScreen from './screens/ManualAddScreen';
import CartScreen from './screens/CartScreen';
import HistoryScreen from './screens/HistoryScreenTemp';
import PayScreen from './screens/PayScreen';
import CheckoutScreen from './CheckoutScreen';

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Scan: undefined;
  ManualAdd: undefined;
  Cart: undefined;
  History: undefined;
  PayScreen: undefined;
  Checkout: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const stripePK = "pk_test_51SCghjFkVodeSW3Lkof2XBmSwuLp9gefjjO7VWbAg1qXI9HzhQLNL1cIy9iNofUZm1KD9bsbmiYEiDyJKm4G757S00FU0JtX5Y";
  
  return (
    <CartProvider>
      <StripeProvider
        publishableKey={stripePK}
        merchantIdentifier="merchant.com.example"
      >
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#4CAF50',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ 
                title: 'AfricaMarket',
                headerShown: false 
              }}
            />
            <Stack.Screen 
              name="Scan" 
              component={BarcodeScreen}
              options={{ 
                title: 'Scanner un produit',
                headerBackTitle: 'Retour'
              }}
            />
            <Stack.Screen 
              name="ManualAdd" 
              component={ManualAddScreen}
              options={{ 
                title: 'Ajouter manuellement',
                headerBackTitle: 'Retour'
              }}
            />
            <Stack.Screen 
              name="Cart" 
              component={CartScreen}
              options={{ 
                title: 'Mon Panier',
                headerShown: false
              }}
            />
            <Stack.Screen 
              name="History" 
              component={HistoryScreen}
              options={{ 
                title: 'Historique des achats',
                headerShown: false
              }}
            />
            <Stack.Screen 
              name="PayScreen" 
              component={PayScreen}
              options={{ 
                title: 'Paiement',
                headerShown: false
              }}
            />
            <Stack.Screen 
              name="Checkout" 
              component={CheckoutScreen}
              options={{ 
                title: 'Paiement',
                headerBackTitle: 'Panier'
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </StripeProvider>
    </CartProvider>
  );
}
