import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import Stack Navigators and Screens
import ClassStackNavigator from './ClassStackNavigator';
import CartStackNavigator from './CartStackNavigator';
import MyBookingsScreen from '../screens/MyBookingsScreen';

// Import the icon library
import { Ionicons } from '@expo/vector-icons'; // Using Ionicons as an example

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { // Optional: Style the tab bar itself
             // backgroundColor: '#f8f8f8',
             // borderTopWidth: 0, // Remove top border
          },
        })}
      >
        <Tab.Screen
          name="ClassesTab"
          component={ClassStackNavigator}
          options={{
            title: 'Classes',
            tabBarIcon: ({ focused, color, size }) => {
              const iconName = focused ? 'list-circle' : 'list-circle-outline';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          }}
        />

        <Tab.Screen
          name="CartTab"
          component={CartStackNavigator}
          options={{
            title: 'Cart',
            tabBarIcon: ({ focused, color, size }) => {
              const iconName = focused ? 'cart' : 'cart-outline';
              return <Ionicons name={iconName} size={size} color={color} />;
            }
          }}
        />

        <Tab.Screen
          name="BookingsTab"
          component={MyBookingsScreen}
          options={{
            title: 'My Bookings',
            headerShown: true,
            tabBarIcon: ({ focused, color, size }) => {
              const iconName = focused ? 'calendar' : 'calendar-outline';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;