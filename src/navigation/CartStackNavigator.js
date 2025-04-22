// src/navigation/CartStackNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';

const Stack = createNativeStackNavigator();

const CartStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Cart" // Keep CartScreen as the initial route
        component={CartScreen}
        options={{ title: 'Shopping Cart' }}
      />
      <Stack.Screen
        name="Checkout" // Checkout is now sibling to Cart
        component={CheckoutScreen}
        options={{ title: 'Confirm Booking' }}
      />
    </Stack.Navigator>
  );
};

export default CartStackNavigator;