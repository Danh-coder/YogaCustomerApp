import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCart } from "../contexts/CartContext";
import { useData } from "../contexts/DataContext";
import { submitBooking } from "../services/firebaseService"; // Import the booking function

const EMAIL_STORAGE_KEY = "@YogaApp:userEmail";

const CheckoutScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingEmail, setIsFetchingEmail] = useState(true); // Loading state for stored email

  const { cartItems, clearCart } = useCart();
  const { classMap, classInstanceMap, loading: dataLoading } = useData(); // Get maps to calculate total again or show summary

  // Load saved email on component mount
  useEffect(() => {
    const loadEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem(EMAIL_STORAGE_KEY);
        if (savedEmail !== null) {
          setEmail(savedEmail);
        }
      } catch (e) {
        console.error("Failed to load email from storage", e);
        // Handle error - maybe show a message
      } finally {
        setIsFetchingEmail(false); // Done fetching
      }
    };
    loadEmail();
  }, []);

  // Calculate summary details (optional but good UX)
  const bookingSummary = React.useMemo(() => {
    if (dataLoading || cartItems.length === 0) return { count: 0, total: 0 };

    let total = 0;
    let count = 0;
    cartItems.forEach((instanceId) => {
      const instance = classInstanceMap.get(instanceId);
      const parentClass = instance ? classMap.get(instance.classId) : null;
      if (parentClass) {
        total += parentClass.price;
        count++;
      }
    });
    return { count, total };
  }, [cartItems, classMap, classInstanceMap, dataLoading]);

  const validateEmail = (text) => {
    // Basic email validation regex
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(text);
  };

  const handleBookingSubmit = async () => {
    if (!validateEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty.");
      navigation.goBack(); // Go back if cart somehow became empty
      return;
    }

    setIsLoading(true);
    try {
      // 1. Save email for future use
      await AsyncStorage.setItem(EMAIL_STORAGE_KEY, email);

      // 2. Submit booking to Firebase
      await submitBooking(email, cartItems); // cartItems contains instance IDs

      // 3. Clear the cart in context
      clearCart();

      // 4. Show success and navigate
      Alert.alert(
        "Booking Confirmed!",
        `Your ${bookingSummary.count} class(es) have been booked. Check 'My Bookings' to see your schedule.`,
        [
          {
            text: "OK",
            onPress: () => navigation.popToTop(), // Go back to the root of the stack (e.g., ClassList)
            // Or navigate to My Bookings: navigation.navigate('BookingsTab');
          },
        ]
      );
    } catch (error) {
      console.error("Booking failed:", error);
      Alert.alert("Booking Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingEmail) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Confirm Booking</Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Booking Summary</Text>
        <Text style={styles.summaryText}>
          Number of Classes: {bookingSummary.count}
        </Text>
        <Text style={styles.summaryText}>
          Total Price: ${bookingSummary.total.toFixed(2)}
        </Text>
      </View>

      <Text style={styles.label}>Enter your Email to book:</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="your.email@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading} // Disable while loading
      />

      <Text style={styles.emailNote}>
        Note: This email will be used for your booking confirmation and to view
        your bookings in the 'My Bookings' tab. Changing this email will prevent
        viewing bookings associated with previous emails within the app.
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <Button
          title="Confirm & Book Classes"
          onPress={handleBookingSubmit}
          disabled={cartItems.length === 0 || !email} // Disable if no items or no email
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    padding: 20,
    alignItems: "stretch", // Make children stretch to container width
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
  },
  summaryBox: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 8,
    marginBottom: 25,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  input: {
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    fontSize: 16,
  },
  loader: {
    marginTop: 20,
  },
});

export default CheckoutScreen;
