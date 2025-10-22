import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StripeProvider } from '@stripe/stripe-react-native';
import { CartProvider } from './screens/CartContext';
import ThemeProvider, { useTheme } from './theme/ThemeProvider';
import ThemeToggle from './theme/ThemeToggle';

// Screens
import HomeScreen from './screens/HomeScreen';
import BarcodeScreen from './screens/BarcodeScreen';
import ManualAddScreen from './screens/ManualAddScreen';
import CartScreen from './screens/CartScreen';
import HistoryScreen from './screens/HistoryScreenTemp';
import PayScreen from './screens/PayScreen';


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
  const stripePK = process.env.STRIPE_PK;

  return (
    <ThemeProvider>
      <CartProvider>
        <StripeProvider publishableKey={stripePK} merchantIdentifier="merchant.com.example">
          <AppNavigator />
        </StripeProvider>
      </CartProvider>
    </ThemeProvider>
  );
}

const AppNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator id={undefined}
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: String(colors.card) },
          headerTintColor: String(colors.text),
          headerTitleStyle: { fontWeight: 'bold' },
          headerRight: () => <ThemeToggle />,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'AfricaMarket', headerShown: false }} />
        <Stack.Screen name="Scan" component={BarcodeScreen} options={{ title: 'Scanner un produit', headerBackTitle: 'Retour' }} />
        <Stack.Screen name="ManualAdd" component={ManualAddScreen} options={{ title: 'Ajouter manuellement', headerBackTitle: 'Retour' }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Mon Panier', headerShown: false }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Historique des achats', headerShown: false }} />
        <Stack.Screen name="PayScreen" component={PayScreen} options={{ title: 'Paiement', headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

