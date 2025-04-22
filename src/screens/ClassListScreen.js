// src/screens/ClassListScreen.js

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView, // Keep ScrollView, but make it horizontal for chips
    Button,
    Platform // Import Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook
import { useData } from '../contexts/DataContext';
// CheckBox is no longer needed for the main filter UI
// import CheckBox from '@react-native-community/checkbox';
import DateTimePicker from '@react-native-community/datetimepicker'; // Import DateTimePicker

// Define available options
const LEVELS = ["Beginner", "Intermediate", "Advanced"]; // Assuming 'Advanced' is possible based on requirements
// Use abbreviations for display, but keep full names for filtering logic if data uses them
const DAYS_OF_WEEK_DISPLAY = {
    "Monday": "Mon",
    "Tuesday": "Tue",
    "Wednesday": "Wed",
    "Thursday": "Thu",
    "Friday": "Fri",
    "Saturday": "Sat",
    "Sunday": "Sun"
};
const DAYS_OF_WEEK_VALUES = Object.keys(DAYS_OF_WEEK_DISPLAY); // Keep full names for logic

const SORT_OPTIONS = {
  NONE: 'Default',
  PRICE_ASC: 'Price Ascending',
  PRICE_DESC: 'Price Descending',
};

// Helper function to format Date object to "HH:MM"
const formatTime = (date) => {
    if (!date) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Helper to get display text for sort chip
const getSortDisplayText = (sortOrder) => {
    switch(sortOrder) {
        case SORT_OPTIONS.PRICE_ASC: return 'Sort: Price ↑';
        case SORT_OPTIONS.PRICE_DESC: return 'Sort: Price ↓';
        default: return 'Sort: Default';
    }
};

const ClassListScreen = () => { // Removed navigation prop as we use the hook now
  const navigation = useNavigation(); // Get navigation object via hook
  const { processedClasses, loading } = useData();

  // --- State Variables ---
  const [searchText, setSearchText] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null); // Holds Date object or null
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [sortOrder, setSortOrder] = useState(SORT_OPTIONS.NONE);
  // No need for showFilters state anymore

  // --- Filtering & Sorting Logic (useMemo) ---
  const filteredAndSortedClasses = useMemo(() => {
    let filtered = processedClasses;
    const timeFilterString = selectedTime ? formatTime(selectedTime) : ''; // Format selected time for comparison

    // 1. Filter by Search Text (Description/Class Name)
    if (searchText.trim()) {
      const lowerSearchText = searchText.toLowerCase();
      filtered = filtered.filter(cls =>
        cls.description.toLowerCase().includes(lowerSearchText)
      );
    }

    // 2. Filter by Level
    if (selectedLevels.length > 0) {
        filtered = filtered.filter(cls => selectedLevels.includes(cls.level));
    }

    // 3. Filter by Days of Week (Class must run on AT LEAST ONE of the selected days)
    if (selectedDays.length > 0) {
      filtered = filtered.filter(cls =>
        cls.daysOfWeek.some(day => selectedDays.includes(day))
      );
    }

    // 4. Filter by Time (Exact match using formatted string)
     if (timeFilterString) {
        filtered = filtered.filter(cls => cls.time === timeFilterString);
     }

    // --- Sorting Logic ---
    // Create a new array before sorting
    let sorted = [...filtered];
    if (sortOrder === SORT_OPTIONS.PRICE_ASC) {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortOrder === SORT_OPTIONS.PRICE_DESC) {
      sorted.sort((a, b) => b.price - a.price);
    }
    // No explicit 'else' needed for NONE, keeps original filtered order

    return sorted; // Return the sorted (or just filtered) array
  }, [processedClasses, searchText, selectedDays, selectedLevels, selectedTime, sortOrder]); // Dependencies

  // --- Filter Handlers ---
  const handleDayToggle = (day) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

   const handleLevelToggle = (level) => {
    setSelectedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  // Time Picker Handler
   const onTimeChange = (event, newSelectedTime) => {
        setShowTimePicker(false); // Close picker on any action (Android) or dismissal (iOS)

        if (event.type === 'set' && newSelectedTime) {
            setSelectedTime(newSelectedTime); // User selected a time
        }
        // else: User cancelled, do nothing, keep previous selectedTime
    };

   const openTimePicker = () => {
        setShowTimePicker(true);
    };

  // Handler for the Sort chip - cycles through options
  const handleSortPress = () => {
    setSortOrder(current => {
        if (current === SORT_OPTIONS.NONE) return SORT_OPTIONS.PRICE_ASC;
        if (current === SORT_OPTIONS.PRICE_ASC) return SORT_OPTIONS.PRICE_DESC;
        return SORT_OPTIONS.NONE; // Cycle back to default from DESC
    });
  };

  // Clear all filters
  const clearFilters = () => {
      setSearchText('');
      setSelectedDays([]);
      setSelectedLevels([]);
      setSelectedTime(null); // Reset time to null
      setSortOrder(SORT_OPTIONS.NONE);
  }

  // --- Render Class Item for FlatList ---
  const renderClassItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      // Use navigation hook object to navigate
      onPress={() => navigation.navigate('ClassesTab', { // Navigate to the Tab first
          screen: 'ClassDetails', // Specify the screen within the tab's stack
          params: { // Pass params within the screen object's params
              classId: item.id,
              className: item.description // Pass name for header
          }
        })}
    >
      <Text style={styles.itemTitle}>{item.description}</Text>
      <Text style={styles.itemSubtitle}>{item.classType?.name} - {item.level}</Text>
      <Text>Time: {item.time}</Text>
      <Text>Days: {item.daysOfWeek.join(', ')}</Text>
      <Text style={styles.itemPrice}>Price: ${item.price}</Text>
    </TouchableOpacity>
  );


  // --- Render Filters UI (Chip Implementation) ---
  const renderFilterChips = () => (
    <View style={styles.filterArea}>
      <ScrollView
          horizontal={true} // Make the ScrollView horizontal
          showsHorizontalScrollIndicator={false} // Hide scroll bar
          contentContainerStyle={styles.chipScrollViewContent} // Style container inside ScrollView
      >
          {/* Time Chip */}
          <TouchableOpacity
              style={[styles.chip, selectedTime ? styles.chipActive : null]}
              onPress={openTimePicker}
          >
              {/* Maybe add a small clock icon here later */}
              <Text style={[styles.chipText, selectedTime ? styles.chipTextActive : null]}>
                  {selectedTime ? `Time: ${formatTime(selectedTime)}` : 'Time: Any'}
              </Text>
          </TouchableOpacity>

          {/* Sort Chip */}
          <TouchableOpacity
              style={[styles.chip, sortOrder !== SORT_OPTIONS.NONE ? styles.chipActive : null]}
              onPress={handleSortPress}
          >
              {/* Maybe add up/down arrow icon here later */}
              <Text style={[styles.chipText, sortOrder !== SORT_OPTIONS.NONE ? styles.chipTextActive : null]}>
                  {getSortDisplayText(sortOrder)}
              </Text>
          </TouchableOpacity>

          {/* Level Chips */}
          {LEVELS.map(level => {
              const isActive = selectedLevels.includes(level);
              return (
                  <TouchableOpacity
                      key={level}
                      style={[styles.chip, isActive ? styles.chipActive : null]}
                      onPress={() => handleLevelToggle(level)}
                  >
                     {/* Maybe add checkmark icon when active */}
                      <Text style={[styles.chipText, isActive ? styles.chipTextActive : null]}>
                          {level}
                      </Text>
                  </TouchableOpacity>
              );
          })}

          {/* Day Chips */}
          {DAYS_OF_WEEK_VALUES.map(dayValue => {
              const isActive = selectedDays.includes(dayValue);
              const display = DAYS_OF_WEEK_DISPLAY[dayValue]; // Get "Mon", "Tue", etc.
              return (
                  <TouchableOpacity
                      key={dayValue}
                      style={[styles.chip, isActive ? styles.chipActive : null]}
                      onPress={() => handleDayToggle(dayValue)}
                  >
                      {/* Maybe add checkmark icon when active */}
                      <Text style={[styles.chipText, isActive ? styles.chipTextActive : null]}>
                          {display}
                      </Text>
                  </TouchableOpacity>
              );
          })}

      </ScrollView>
       {/* Keep DateTimePicker logic, rendered outside ScrollView when active */}
       {showTimePicker && (
              <DateTimePicker
                  testID="dateTimePicker"
                  value={selectedTime || new Date()}
                  mode={'time'}
                  is24Hour={true} // Or false
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
              />
        )}
        {/* Show Clear button only if any filter/sort is active */}
        {(selectedDays.length > 0 || selectedLevels.length > 0 || selectedTime || sortOrder !== SORT_OPTIONS.NONE || searchText.trim()) && (
             <View style={styles.clearButtonContainer}>
                <Button title="Clear Active Filters" onPress={clearFilters} color="grey" />
             </View>
        )}
    </View>
  );

  // --- Main Component Return ---

  // Handle initial data loading state
  if (loading) {
    return <View style={styles.centered}><Text>Loading classes...</Text></View>;
  }

  return (
    <View style={styles.container}>
        {/* Search Bar at the top */}
        <View style={styles.searchContainer}>
            <TextInput
                style={styles.mainSearchInput}
                placeholder="Search Classes..."
                value={searchText}
                onChangeText={setSearchText}
                clearButtonMode="while-editing" // iOS
                // Add inlineImageLeft for search icon if desired
            />
        </View>


        {/* Render the filter chip UI */}
        {renderFilterChips()}

        {/* List of Classes */}
        <FlatList
            data={filteredAndSortedClasses}
            renderItem={renderClassItem}
            keyExtractor={item => item.id.toString()}
            ListEmptyComponent={<Text style={styles.emptyText}>No classes found matching your criteria.</Text>}
            style={styles.listStyle} // Ensures list takes up remaining space
            contentContainerStyle={styles.listContentContainer} // Padding at the bottom
            // Add RefreshControl if needed for manual data refresh later
            // refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        />
    </View>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Main background color
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
      backgroundColor: '#fff', // Match container background
      paddingBottom: 5, // Slightly separate from filters
      paddingHorizontal: 16,
      paddingTop: 10,
  },
  mainSearchInput: {
    height: 45,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 25, // Rounded corners
    paddingHorizontal: 15,
    backgroundColor: '#f5f5f5', // Light grey background
  },
  filterArea: {
      paddingBottom: 5, // Space below the scrollview/clear button
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      backgroundColor: '#fff', // Background for the filter chip area
  },
  chipScrollViewContent: {
    paddingHorizontal: 16, // Start padding for the first chip
    paddingVertical: 8,   // Vertical padding for the scroll area
    alignItems: 'center', // Vertically center chips
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc', // Default border color
    backgroundColor: '#f0f0f0', // Default background slightly grey
    marginRight: 8, // Space between chips
    height: 32, // Fixed height for consistency
  },
  chipActive: {
    borderColor: '#007AFF', // Active border color (iOS blue)
    backgroundColor: '#e0efff', // Light blue background for active state
  },
  chipText: {
    fontSize: 14,
    color: '#333', // Default text color
  },
  chipTextActive: {
    color: '#005bb5', // Darker blue text color for active state
    fontWeight: '500',
  },
  clearButtonContainer: {
      paddingHorizontal: 16,
      paddingBottom: 10, // Space below clear button
      paddingTop: 5,    // Space above clear button
      alignItems: 'flex-start', // Align button left, or 'center'
  },
  listStyle: {
      flex: 1, // Ensure list takes remaining space below filters
      backgroundColor: '#f5f5f5', // List background can be different
  },
  listContentContainer: {
      paddingBottom: 20, // Add padding at the bottom of the list scroll
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 6, // Reduced vertical margin
    marginHorizontal: 16,
    borderRadius: 8,
    // Using simpler elevation/shadow for broader compatibility
    elevation: 1, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
  },
  itemTitle: {
    fontSize: 17, // Slightly smaller title
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemSubtitle: {
      fontSize: 14,
      color: '#555',
      marginBottom: 5,
  },
  itemPrice: {
      fontSize: 15, // Slightly smaller price
      fontWeight: 'bold',
      marginTop: 5,
      color: '#333'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});

export default ClassListScreen;