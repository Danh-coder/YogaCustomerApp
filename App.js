import React from 'react';
import { StatusBar } from 'expo-status-bar'; // Use Expo status bar
import AppNavigator from './src/navigation/AppNavigator'; // Adjust path if needed
import { DataProvider } from './src/contexts/DataContext'; // Adjust path
import { CartProvider } from './src/contexts/CartContext';   // Adjust path
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';

// Optional: Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Setting a timer for a long period of time', // Common Firebase JS SDK warning
  'AsyncStorage has been extracted from react-native core', // Can sometimes appear
]);


export default function App() { // Default export for Expo
  return (
    <SafeAreaProvider>
      <DataProvider>
        <CartProvider>
          <StatusBar style="auto"/>
          <AppNavigator/>
        </CartProvider>
      </DataProvider>
    </SafeAreaProvider>
  );
}