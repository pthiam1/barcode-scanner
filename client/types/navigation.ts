import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Home: undefined;
  Scan: undefined;
  ManualAdd: undefined;
  Cart: undefined;
  History: undefined;
  PayScreen: undefined;
  Checkout: undefined;
};

export type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
export type ScanScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Scan'>;
export type ManualAddScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ManualAdd'>;
export type CartScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Cart'>;
export type HistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'History'>;
export type PayScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PayScreen'>;
export type CheckoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Checkout'>;

export type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;
export type ScanScreenRouteProp = RouteProp<RootStackParamList, 'Scan'>;
export type ManualAddScreenRouteProp = RouteProp<RootStackParamList, 'ManualAdd'>;
export type CartScreenRouteProp = RouteProp<RootStackParamList, 'Cart'>;
export type HistoryScreenRouteProp = RouteProp<RootStackParamList, 'History'>;
export type PayScreenRouteProp = RouteProp<RootStackParamList, 'PayScreen'>;
export type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>;

export interface ScreenProps<T extends keyof RootStackParamList> {
  navigation: StackNavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
}