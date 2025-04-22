import React from 'react';
import { View, Text, StyleSheet, ScrollView, Button, ActivityIndicator, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native'; // Hook to get route params
import { useData } from '../contexts/DataContext';
import { useCart } from '../contexts/CartContext';

const ClassDetailsScreen = () => {
  const route = useRoute();
  const { classId } = route.params || {}; // Get classId passed during navigation

  const { processedClasses, loading: dataLoading } = useData();
  const { addToCart, isInCart } = useCart();

  // Find the specific class from the processed data
  // Ensure classId is treated as a number if necessary, depending on how it's stored/passed
  const selectedClass = processedClasses.find(cls => cls.id === Number(classId));

  if (dataLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading Class Details...</Text>
      </View>
    );
  }

  if (!selectedClass) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Class not found.</Text>
        {/* Optionally add a button to go back */}
      </View>
    );
  }

  // Safely access nested properties with optional chaining or defaults
  const {
    description = 'No Name',
    level = 'N/A',
    price = 0,
    duration = 0,
    room = 'N/A',
    time = 'N/A',
    daysOfWeek = [],
    capacity = 0,
    classType = { name: 'Unknown Type', description: '' },
    instances = [], // Array of instances embedded by dataProcessor
  } = selectedClass;

  const handleAddToCart = (instance) => {
      if (isInCart(instance.id)) {
          Alert.alert("Already Added", "This session is already in your cart.");
      } else {
          addToCart(instance.id); // Pass the unique instance ID
          // Alert is handled within addToCart context function
      }
  };


  return (
    <ScrollView style={styles.container}>
      {/* Class General Information */}
      <View style={styles.section}>
        <Text style={styles.title}>{description}</Text>
        <Text style={styles.detail}><Text style={styles.label}>Type:</Text> {classType.name} ({level})</Text>
        {classType.description && <Text style={styles.typeDescription}>{classType.description}</Text>}
        <Text style={styles.detail}><Text style={styles.label}>Price:</Text> ${price}</Text>
        <Text style={styles.detail}><Text style={styles.label}>Duration:</Text> {duration} minutes</Text>
        <Text style={styles.detail}><Text style={styles.label}>Time:</Text> {time}</Text>
        <Text style={styles.detail}><Text style={styles.label}>Days:</Text> {daysOfWeek.join(', ')}</Text>
        <Text style={styles.detail}><Text style={styles.label}>Room:</Text> {room}</Text>
        <Text style={styles.detail}><Text style={styles.label}>Capacity:</Text> {capacity} participants</Text>
      </View>

      {/* Class Instances (Scheduled Sessions) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Sessions</Text>
        {instances.length === 0 ? (
          <Text>No upcoming sessions scheduled for this class.</Text>
        ) : (
          instances.map(instance => (
            <View key={instance.id} style={styles.instanceContainer}>
              <View style={styles.instanceDetails}>
                <Text style={styles.instanceDate}>Date: {instance.date}</Text>
                <Text>Teacher: {instance.teacher?.name || 'Unknown'}</Text>
                {instance.additionalComments ? (
                  <Text style={styles.comments}>Comments: {instance.additionalComments}</Text>
                ) : null}
              </View>
              <Button
                title={isInCart(instance.id) ? "In Cart" : "Add to Cart"}
                onPress={() => handleAddToCart(instance)}
                disabled={isInCart(instance.id)} // Disable if already in cart
              />
            </View>
          ))
        )}
      </View>
       <View style={{ height: 30 }} />{/* Spacer at the bottom */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 25,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  label: {
      fontWeight: 'bold',
      color: '#555',
  },
  detail: {
    fontSize: 16,
    marginBottom: 5,
    lineHeight: 22,
  },
  typeDescription: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 10,
    marginLeft: 10, // Indent type description slightly
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  instanceContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row', // Align details and button horizontally
    justifyContent: 'space-between', // Push details and button apart
    alignItems: 'center', // Vertically center items
    borderWidth: 1,
    borderColor: '#eee',
  },
  instanceDetails: {
      flex: 1, // Allow details to take up available space
      marginRight: 10, // Space before the button
  },
  instanceDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  comments: {
      fontSize: 13,
      color: '#777',
      marginTop: 4,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});

export default ClassDetailsScreen;