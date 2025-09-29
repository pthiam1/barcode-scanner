import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import CheckoutScreen from './CheckoutScreen';

export default function App() {
  const stripePK = "pk_test_51SCghjFkVodeSW3Lkof2XBmSwuLp9gefjjO7VWbAg1qXI9HzhQLNL1cIy9iNofUZm1KD9bsbmiYEiDyJKm4G757S00FU0JtX5Y";

  return (
    <StripeProvider
      publishableKey={stripePK}
      merchantIdentifier="merchant.com.example"
    >
      <CheckoutScreen />
    </StripeProvider>
  );
}
