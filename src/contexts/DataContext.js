import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { fetchAllData } from '../services/firebaseService';
import { processFirebaseData } from '../utils/dataProcessor';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

const DataContext = createContext({
  processedClasses: [],
  classMap: new Map(),
  classInstanceMap: new Map(),
  teacherMap: new Map(),
  classTypeMap: new Map(),
  loading: true,
  error: null,
  refreshData: async () => {}, // Add refresh function
});

export const DataProvider = ({ children }) => {
  const [processedData, setProcessedData] = useState({
    processedClasses: [],
    classMap: new Map(),
    classInstanceMap: new Map(),
    teacherMap: new Map(),
    classTypeMap: new Map(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const rawData = await fetchAllData();
      // console.log("Raw Firebase Data:", JSON.stringify(rawData, null, 2)); // Debugging
      const processed = processFirebaseData(rawData);
      // console.log("Processed Data:", JSON.stringify(processed.processedClasses, null, 2)); // Debugging
      setProcessedData(processed);
    } catch (err) {
      console.error("Error loading or processing data:", err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // Load data on initial mount

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    ...processedData,
    loading,
    error,
    refreshData: loadData, // Provide refresh function
  }), [processedData, loading, error]); // Dependencies

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading Yoga Data...</Text>
      </View>
    );
  }

   if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading data: {error}</Text>
      </View>
    );
  }

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
      color: 'red',
      margin: 20,
      textAlign: 'center'
  }
});