import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Button, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native"; // Import useNavigation
import { useCart } from "../contexts/CartContext";
import { useData } from "../contexts/DataContext";

const CartScreen = () => {
  const navigation = useNavigation(); // Get navigation object via hook
  const { cartItems, removeFromCart, clearCart } = useCart();
  const {
    classMap,
    classInstanceMap,
    teacherMap,
    loading: dataLoading,
  } = useData();

  // Process cart items to get full details for display
  const detailedCartItems = useMemo(() => {
    if (dataLoading) return []; // Wait for data to be loaded

    return cartItems
      .map((instanceId) => {
        const instance = classInstanceMap.get(instanceId);
        if (!instance) return null; // Instance not found (shouldn't happen ideally)

        const parentClass = classMap.get(instance.classId);
        if (!parentClass) return null; // Class not found

        const teacher = teacherMap.get(instance.teacherId);

        return {
          instanceId: instance.id,
          classId: parentClass.id,
          className: parentClass.description,
          date: instance.date,
          time: parentClass.time, // Time comes from the parent Class
          price: parentClass.price,
          teacherName: teacher?.name || "Unknown Teacher",
          // Add any other details needed for display
        };
      })
      .filter(Boolean); // Filter out any nulls if data was inconsistent
  }, [cartItems, classInstanceMap, classMap, teacherMap, dataLoading]); // Dependencies

  // Calculate total price
  const totalPrice = useMemo(() => {
    return detailedCartItems.reduce((sum, item) => sum + item.price, 0);
  }, [detailedCartItems]);

  const handleRemoveItem = (instanceId) => {
    // Alert confirmation can be added here if desired
    removeFromCart(instanceId); // Alert is handled within context function
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return; // Don't prompt if cart is empty

    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all items from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, Clear", onPress: clearCart, style: "destructive" },
      ]
    );
  };

  // src/screens/CartScreen.js -> handleProceedToBook
  const handleProceedToBook = () => {
    if (detailedCartItems.length > 0) {
      // Now navigate directly within the CartStackNavigator
      navigation.navigate("Checkout");
    } else {
      Alert.alert(
        "Empty Cart",
        "Please add items to your cart before proceeding."
      );
    }
  };

  // Render Item for FlatList
  const renderCartItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle}>{item.className}</Text>
        <Text>
          Date: {item.date} at {item.time}
        </Text>
        <Text>Teacher: {item.teacherName}</Text>
        <Text style={styles.itemPrice}>Price: ${item.price}</Text>
      </View>
      <Button
        title="Remove"
        onPress={() => handleRemoveItem(item.instanceId)}
        color="red"
      />
    </View>
  );

  if (dataLoading) {
    // You might want a more subtle loading state integrated into the screen
    // but for now, DataProvider handles the initial blocking load.
    // This check is more for preventing errors if maps aren't ready yet.
    return (
      <View style={styles.centered}>
        <Text>Loading Cart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {detailedCartItems.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Your cart is currently empty.</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={detailedCartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.instanceId.toString()}
            style={styles.list}
          />
          <View style={styles.footer}>
            <Text style={styles.totalText}>
              Total Price: ${totalPrice.toFixed(2)}
            </Text>
            <View style={styles.buttonGroup}>
              <Button
                title="Clear Cart"
                onPress={handleClearCart}
                color="#aaa"
                disabled={detailedCartItems.length === 0}
              />
              <Button
                title="Proceed to Book"
                onPress={handleProceedToBook}
                disabled={detailedCartItems.length === 0}
              />
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  list: {
    flex: 1, // Ensure list takes up available space before footer
  },
  itemContainer: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  itemDetails: {
    flex: 1, // Allow details to take up space
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 3,
  },
  itemPrice: {
    fontWeight: "bold",
    marginTop: 3,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    padding: 15,
    backgroundColor: "#fff",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 10,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
  },
});

export default CartScreen;
