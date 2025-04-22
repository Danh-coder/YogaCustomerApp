# Yoga Booking App (Customer)

## Project Overview

This is a customer-facing mobile application built using React Native and Expo, designed to allow users to browse, search, filter, and book yoga classes from a Firebase Realtime Database. It serves as a companion to a potential admin application that manages the database content. The application focuses on providing a simple and intuitive booking experience for yoga studio clients.

## Features

*   **Browse Classes:** View a list of available yoga classes with essential details.
*   **Search & Filter:**
    *   Search classes by description (treated as class name).
    *   Filter classes by time using a time picker.
    *   Filter classes by selecting specific days of the week.
    *   Filter classes by skill level (Beginner, Intermediate, Advanced).
    *   Sort the filtered class list by price (ascending or descending).
*   **View Details & Instances:** Tap on a class to see its full description and a list of upcoming scheduled class instances (sessions). Only instances from today onwards are displayed.
*   **Shopping Cart:** Add desired class instances to a shopping cart.
*   **Manage Cart:** View items in the cart and remove them.
*   **Booking Checkout:** Proceed from the cart to confirm the booking by providing an email address.
*   **View My Bookings:** See a list of classes previously booked using the stored email address.

## Technologies Used

*   **Framework:** React Native
*   **Development Platform:** Expo
*   **Database:** Firebase Realtime Database
*   **Firebase SDK:** Firebase JS SDK (`firebase`)
*   **Navigation:** React Navigation (`@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`)
*   **State Management:** React Context API (`DataContext`, `CartContext`)
*   **Local Storage:** `@react-native-async-storage/async-storage` (for storing user email)
*   **UI Components:**
    *   Core React Native Components (`View`, `Text`, `ScrollView`, `FlatList`, `TextInput`, `Button`, `TouchableOpacity`)
    *   `@react-native-community/checkbox`
    *   `@react-native-community/datetimepicker` (for time picker)
    *   `@expo/vector-icons` (for tab icons)

## Setup Guide

To set up and run this project locally, you will need Node.js, Expo CLI, and access to a Firebase project with the provided data structure.

### 1. Prerequisites

*   Node.js (LTS recommended) installed.
*   npm or Yarn installed.
*   Expo CLI installed globally (`npm install -g expo-cli`).
*   Expo Go app installed on your physical device or access to an Android/iOS simulator.
*   Android Studio (for Android emulator) or Xcode (for iOS simulator) installed.

### 2. Clone the Repository

```bash
git clone <your_github_repo_url>
cd YogaAppExpo # Or your project directory name
```

### 3. Install Dependencies

```bash
npm install
# OR
yarn install
```

### 4. Firebase Setup

*   **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
*   **Enable Realtime Database:** In your Firebase project, navigate to "Build" -> "Realtime Database". Create a database instance. Note your database URL (e.g., `https://your-project-id-default-rtdb.firebaseio.com`).
*   **Import Data:** In the Realtime Database console, click the three dots menu -> "Import JSON". Select the `yogamanagement-7f6b7-default-rtdb-export.json` file provided.
*   **Update Firebase Rules (Crucial for Bookings Query):** Go to the "Rules" tab in the Realtime Database console and add an index for the `userEmail` field under the `Bookings` path to allow querying. **Note: For live deployment, significantly more secure rules are required (see Security Notes below).**
    ```json
    {
      "rules": {
        // ... existing rules (e.g., ".read": true, ".write": true for development) ...
        "Bookings": {
          ".indexOn": ["userEmail"]
        }
      }
    }
    ```
*   **Get Firebase Config:** In your Firebase Project Settings (gear icon) -> General, scroll down to "Your apps". Add a "Web app" (`</>`). Copy the `firebaseConfig` object provided.

### 5. Configure Firebase in the Application (Securely)

*   **Create `.env` file:** In the root directory of your project, create a file named `.env`.
*   **Add your Firebase Config to `.env`:** Paste your Firebase config keys as environment variables, prefixed with `EXPO_PUBLIC_` for Expo:
    ```dotenv
    # .env
    EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
    EXPO_PUBLIC_FIREBASE_DATABASE_URL=YOUR_DATABASE_URL
    EXPO_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
    EXPO_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
    ```
    (Replace `YOUR_...` with your actual config values).
*   **Add `.env` to `.gitignore`:** Open or create the `.gitignore` file in your project root and add the following line to prevent committing your secrets to Git:
    ```gitignore
    # ... other ignore rules ...
    .env
    .env.local # Also common convention
    ```
*   **Update `src/config/firebaseConfig.js`:** Ensure the file reads from `process.env`:
    ```javascript
    // src/config/firebaseConfig.js
    export const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };
    ```

### 6. Configure EAS Build (If using Native Modules/Building APK/IPA)

*   Some community modules (`@react-native-community/checkbox`, `@react-native-community/datetimepicker`) might require an EAS Dev Client build or a full native build for full compatibility, especially on certain OS versions or devices compared to the standard Expo Go app.
*   Configure your project for EAS Build:
    ```bash
    eas build:configure
    ```
    Follow the prompts (select iOS and Android). This creates `eas.json`.
*   Log in to EAS:
    ```bash
    eas login
    ```

## Running the App

### Development Mode (Using Expo Go or Dev Client)

*   Start the Expo development server:
    ```bash
    npx expo start
    ```
*   Scan the QR code in the terminal using the Expo Go app on your device, or press `a` (Android) or `i` (iOS) to open in a simulator/emulator.
*   If you configured EAS Build and need a dev client:
    ```bash
    npx expo run:android
    # OR
    npx expo run:ios
    ```
    This will build and launch a custom development client app on your device/simulator. Subsequent starts can use `npx expo start --dev-client`.

## Security Notes

**IMPORTANT:** The current security implementation is suitable *only* for development/demonstration. **For live use, critical security measures MUST be implemented:**

*   **Firebase Authentication:** Implement proper user accounts and login/registration.
*   **Secure Firebase Rules:** Rewrite database rules to restrict read/write access based on user authentication and roles.
*   **EAS Secrets:** Securely manage Firebase config (and any other secrets) using EAS Secrets for production builds, NOT solely relying on `.env` files.

## Deployment

Deploying to the Apple App Store or Google Play Store requires using **EAS Build** and setting up developer accounts (Apple Developer Program, Google Play Console). This process involves creating production builds, configuring app metadata, screenshots, and submitting through App Store Connect and Google Play Console respectively.
