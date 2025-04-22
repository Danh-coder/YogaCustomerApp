import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, push, query, orderByChild, equalTo, serverTimestamp, set } from 'firebase/database';
import { firebaseConfig } from '../config/firebaseConfig';

// Initialize Firebase
let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp(); // if already initialized, use that instance
}

const database = getDatabase(firebaseApp);

// Fetches all core data needed for the app
export const fetchAllData = async () => {
  try {
    const snapshot = await get(ref(database, '/')); // Get data from root
    const data = snapshot.val();

    // Basic validation and fallback for potentially missing top-level keys
    return {
      classes: data?.Classes || [],
      classInstances: data?.ClassInstances || [],
      classTypes: data?.ClassTypes || [],
      teachers: data?.Teachers || [],
      bookings: data?.Bookings || {}, // Bookings might be an object keyed by push IDs
    };
  } catch (error) {
    console.error("Firebase fetchAllData Error:", error);
    // Return empty structure on error to prevent crashes downstream
    return {
      classes: [],
      classInstances: [],
      classTypes: [],
      teachers: [],
      bookings: {},
    };
  }
};

// Function to submit a booking
export const submitBooking = async (email, instanceIds) => {
  if (!email || !instanceIds || instanceIds.length === 0) {
    throw new Error("Email and class instance IDs are required for booking.");
  }
  try {
    const bookingsRef = ref(database, '/Bookings');
    const newBookingRef = push(bookingsRef); // Generate unique key client-side with push()
    await set(newBookingRef, { // Use set with the generated ref
      userEmail: email,
      bookedInstanceIds: instanceIds, // Store only IDs
      bookingTimestamp: serverTimestamp(), // Use server timestamp
    });
    console.log("Booking successful for:", email);
    return newBookingRef.key; // Return the ID of the new booking
  } catch (error) {
    console.error("Firebase submitBooking Error:", error);
    throw error; // Re-throw to be caught by the caller
  }
};


// Function to fetch bookings for a specific user
export const fetchUserBookings = async (email) => {
    if (!email) {
        return []; // No email, no bookings
    }
    try {
        const bookingsRef = ref(database, '/Bookings');
        // Query requires ordering by the child you want to filter
        const userBookingsQuery = query(bookingsRef, orderByChild('userEmail'), equalTo(email));
        const snapshot = await get(userBookingsQuery);

        const bookingsData = snapshot.val();
        if (!bookingsData) {
            return []; // No bookings found for this email
        }

        // Convert bookings object into an array
        const bookingsArray = Object.keys(bookingsData).map(key => ({
            id: key,
            ...bookingsData[key],
        }));
        return bookingsArray;

    } catch (error) {
        console.error("Firebase fetchUserBookings Error:", error);
        return []; // Return empty on error
    }
};

// Export database instance if needed elsewhere (though service functions are preferred)
// export { database };