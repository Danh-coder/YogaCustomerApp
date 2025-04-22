import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Button,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // To refresh when tab is focused
import { fetchUserBookings } from '../services/firebaseService';
import { useData } from '../contexts/DataContext'; // Need maps to get details

const EMAIL_STORAGE_KEY = '@YogaApp:userEmail'; // Same key used in Checkout

const MyBookingsScreen = ({ navigation }) => {
    const [userEmail, setUserEmail] = useState(null);
    const [bookings, setBookings] = useState([]); // Stores detailed booking info
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const { classMap, classInstanceMap, teacherMap, loading: dataLoading } = useData();

    // Function to load bookings
    const loadBookings = useCallback(async (emailToFetch) => {
        if (!emailToFetch || dataLoading) {
            // Don't fetch if no email or if core data isn't loaded yet
            if (!emailToFetch) setError("No email found. Please book a class first or set your email.");
             // If dataLoading is true, core data isn't ready, wait for it.
             // We rely on useFocusEffect to re-trigger when data is ready.
            setIsLoading(false); // Stop loading indicator for now
            return;
        }

        setError(null); // Clear previous errors
        try {
            const userBookingData = await fetchUserBookings(emailToFetch); // Fetches {id, userEmail, bookedInstanceIds, timestamp}

            // Now, enrich the booking data with details using the maps
            const detailedBookings = userBookingData.map(booking => {
                const instanceDetails = (booking.bookedInstanceIds || []).map(instanceId => {
                    const instance = classInstanceMap.get(instanceId);
                    if (!instance) return null;
                    const parentClass = classMap.get(instance.classId);
                    if (!parentClass) return null;
                    const teacher = teacherMap.get(instance.teacherId);

                    return {
                        instanceId: instance.id,
                        className: parentClass.description,
                        date: instance.date,
                        time: parentClass.time,
                        teacherName: teacher?.name || 'Unknown',
                        price: parentClass.price, // Optional: show price if needed
                    };
                }).filter(Boolean); // Filter out nulls

                return {
                    bookingId: booking.id,
                    bookingTimestamp: booking.bookingTimestamp,
                    instances: instanceDetails, // Array of detailed instances for this booking transaction
                };
            }).filter(booking => booking.instances.length > 0); // Only keep bookings with valid instances found

            // Optional: Sort bookings by timestamp (newest first)
            detailedBookings.sort((a, b) => (b.bookingTimestamp || 0) - (a.bookingTimestamp || 0));

            setBookings(detailedBookings);

        } catch (err) {
            console.error("Error fetching user bookings:", err);
            setError("Failed to load your bookings. Please try again.");
            setBookings([]); // Clear bookings on error
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [dataLoading, classInstanceMap, classMap, teacherMap]); // Dependencies for the fetching logic


    // Use useFocusEffect to load/refresh data when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            let isActive = true; // Prevent state updates if component unmounts quickly

            const checkEmailAndLoad = async () => {
                setIsLoading(true); // Show loading indicator on focus
                try {
                    const savedEmail = await AsyncStorage.getItem(EMAIL_STORAGE_KEY);
                    if (isActive) {
                        setUserEmail(savedEmail); // Store the email
                        if (savedEmail) {
                            await loadBookings(savedEmail); // Fetch bookings for this email
                        } else {
                            setError("No email set. Please book a class to save your email.");
                            setBookings([]);
                            setIsLoading(false);
                        }
                    }
                } catch (e) {
                    console.error('Failed to load email from storage', e);
                    if (isActive) {
                        setError("Could not retrieve your email.");
                        setBookings([]);
                        setIsLoading(false);
                    }
                }
            };

            checkEmailAndLoad();

            return () => {
                isActive = false; // Cleanup function for when focus is lost or component unmounts
            };
        }, [loadBookings]) // Re-run effect if loadBookings function identity changes (due to its dependencies)
    );


    // Handle pull-to-refresh
    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        // Re-fetch email just in case, although unlikely to change often
        const savedEmail = await AsyncStorage.getItem(EMAIL_STORAGE_KEY);
        setUserEmail(savedEmail);
        await loadBookings(savedEmail); // Pass the potentially updated email
        // setIsLoading(false) and setIsRefreshing(false) are handled within loadBookings
    }, [loadBookings]); // Dependency

    // --- Render Functions ---

    const renderInstanceItem = (instance) => (
        <View key={instance.instanceId} style={styles.instanceItem}>
            <Text style={styles.instanceTitle}>{instance.className}</Text>
            <Text>Date: {instance.date} at {instance.time}</Text>
            <Text>Teacher: {instance.teacherName}</Text>
        </View>
    );

    const renderBookingItem = ({ item: booking }) => (
        <View style={styles.bookingContainer}>
            <Text style={styles.bookingDate}>
                Booked on: {booking.bookingTimestamp ? new Date(booking.bookingTimestamp).toLocaleString() : 'Date unknown'}
            </Text>
            {/* Map through the instances within this specific booking */}
            {booking.instances.map(renderInstanceItem)}
        </View>
    );

    // --- Conditional Rendering ---

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <Text>Loading Your Bookings...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <Button title="Retry" onPress={() => loadBookings(userEmail)} />
                {/* Optionally, add a button to go to settings or re-enter email */}
            </View>
        );
    }

    if (!userEmail) {
         return (
            <View style={styles.centered}>
                <Text>Please book a class first.</Text>
                <Text>(Your email is used to track your bookings)</Text>
                <Button title="Browse Classes" onPress={() => navigation.navigate('ClassesTab')} />
            </View>
        );
    }

    return (
        <FlatList
            data={bookings}
            renderItem={renderBookingItem}
            keyExtractor={item => item.bookingId}
            style={styles.container}
            contentContainerStyle={bookings.length === 0 ? styles.centered : { paddingBottom: 20 }}
            ListEmptyComponent={
                <View style={styles.centered}>
                    <Text>You haven't booked any classes yet.</Text>
                </View>
            }
            refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        textAlign: 'center'
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        marginBottom: 15,
        textAlign: 'center'
    },
    bookingContainer: {
        backgroundColor: '#fff',
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    bookingDate: {
        fontSize: 12,
        color: '#777',
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    instanceItem: {
        paddingVertical: 8,
        borderBottomWidth: 1, // Separator between instances in the same booking
        borderBottomColor: '#f0f0f0',
    },
    instanceTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    // Make last instance item in a booking not have a bottom border
    bookingContainer: {
        // ... other styles
        '& > :last-child': { // This might not work in React Native StyleSheet, adjust logic if needed
             borderBottomWidth: 0,
        }
    },
     instanceItem: { // Adjusted approach
        paddingVertical: 8,
        // borderBottomWidth: 1, // Remove from here
        // borderBottomColor: '#f0f0f0',
    },
     bookingContainer: { // Add border between instances within the container logic instead
        backgroundColor: '#fff',
        paddingHorizontal: 15, // Apply horizontal padding here
        paddingTop: 15, // Apply top padding here
        paddingBottom: 5, // Reduce bottom padding
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    bookingDate: {
         fontSize: 12,
         color: '#777',
         marginBottom: 10,
         paddingBottom: 5,
         borderBottomWidth: 1,
         borderBottomColor: '#eee',
     },
      instanceSeparator: { // Add an explicit separator view
         height: 1,
         backgroundColor: '#f0f0f0',
         marginVertical: 8, // Space around the separator
     },


});

export default MyBookingsScreen;