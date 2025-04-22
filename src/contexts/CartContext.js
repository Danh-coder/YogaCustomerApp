import React, { createContext, useState, useContext, useMemo } from 'react';
import { Alert } from 'react-native';

// Store instance IDs in the cart
const CartContext = createContext({
  cartItems: [], // Array of classInstance IDs
  addToCart: (instanceId) => {},
  removeFromCart: (instanceId) => {},
  clearCart: () => {},
  isInCart: (instanceId) => false,
});

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]); // Store instance IDs

  const addToCart = (instanceId) => {
    setCartItems(prevItems => {
      if (prevItems.includes(instanceId)) {
         Alert.alert("Already in Cart", "This class session is already in your cart.");
         return prevItems; // Don't add duplicates
      }
      Alert.alert("Added to Cart", "Class session added successfully.");
      return [...prevItems, instanceId];
    });
  };

  const removeFromCart = (instanceId) => {
    setCartItems(prevItems => prevItems.filter(id => id !== instanceId));
     Alert.alert("Removed", "Class session removed from your cart.");
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const isInCart = (instanceId) => {
      return cartItems.includes(instanceId);
  }

  const contextValue = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
  }), [cartItems]); // Dependency

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);