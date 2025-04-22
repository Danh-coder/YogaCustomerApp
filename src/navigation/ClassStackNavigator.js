import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ClassListScreen from '../screens/ClassListScreen';
import ClassDetailsScreen from '../screens/ClassDetailsScreen';
import CheckoutScreen from '../screens/CheckoutScreen'; // Import CheckoutScreen

const Stack = createNativeStackNavigator();

const ClassStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ClassList"
        component={ClassListScreen}
        options={{ title: 'Available Classes' }}
      />
      <Stack.Screen
        name="ClassDetails"
        component={ClassDetailsScreen}
        options={({ route }) => ({ title: route.params?.className || 'Class Details' })}
      />
      {/* Add CheckoutScreen to this stack */}
      {/* <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Confirm Booking' }}
      /> */}
    </Stack.Navigator>
  );
};

export default ClassStackNavigator;