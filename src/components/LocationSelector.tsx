import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { NIGERIA_LOCATIONS, City, State } from '../data/nigeria_locations';
import { getCurrentLocation, findNearestCity } from '../utils/location';
import { useThemeContext } from '../context/ThemeContext';
import { COLORS, SPACING } from '../constants/theme';

interface LocationSelectorProps {
  onLocationSelect: (city: City) => void;
  selectedCity?: City | null;
}

export default function LocationSelector({ onLocationSelect, selectedCity }: LocationSelectorProps) {
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedCityLocal, setSelectedCityLocal] = useState<City | null>(selectedCity || null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const { isDarkMode } = useThemeContext();

  // Set default to Lagos on mount if no selection
  useEffect(() => {
    if (!selectedCity && !selectedState) {
      const lagosState = NIGERIA_LOCATIONS.find(s => s.name === 'Lagos');
      if (lagosState) {
        setSelectedState(lagosState);
        if (lagosState.cities.length > 0) {
          const defaultCity = lagosState.cities[0];
          setSelectedCityLocal(defaultCity);
          onLocationSelect(defaultCity);
        }
      }
    }
  }, []);

  const handleStateSelect = (state: State) => {
    setSelectedState(state);
    setShowStateModal(false);
    // Open city modal immediately after state selection
    setTimeout(() => setShowCityModal(true), 300);
  };

  const handleCitySelect = (city: City) => {
    setSelectedCityLocal(city);
    onLocationSelect(city);
    setShowCityModal(false);
  };

  const handleGetCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const location = await getCurrentLocation();
      const nearestCity = findNearestCity(location.coords.latitude, location.coords.longitude);

      if (nearestCity) {
        // Find the state that contains this city
        const state = NIGERIA_LOCATIONS.find(s =>
          s.cities.some(c => c.name === nearestCity.name)
        );

        if (state) {
          setSelectedState(state);
          setSelectedCityLocal(nearestCity);
          onLocationSelect(nearestCity);
        }
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      alert('Could not get your location. Please select manually.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const displayText = selectedCityLocal
    ? `${selectedCityLocal.name}, ${selectedState?.name}`
    : 'Select your location';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.inputField, {
          backgroundColor: isDarkMode ? COLORS.dark.surface : COLORS.white,
          borderColor: isDarkMode ? COLORS.dark.textLight : COLORS.textLight,
        }]}
        onPress={() => setShowStateModal(true)}
      >
        <Text style={[styles.inputText, {
          color: selectedCityLocal
            ? (isDarkMode ? COLORS.dark.text : COLORS.text)
            : (isDarkMode ? COLORS.dark.textLight : COLORS.textLight)
        }]}>
          {displayText}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.locationButton, { opacity: loadingLocation ? 0.5 : 1 }]}
        onPress={handleGetCurrentLocation}
        disabled={loadingLocation}
      >
        {loadingLocation ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.locationButtonText}>Get My Location</Text>
        )}
      </TouchableOpacity>

      {/* State Selection Modal */}
      <Modal
        visible={showStateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? COLORS.dark.surface : COLORS.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? COLORS.dark.text : COLORS.text }]}>
                Select State
              </Text>
              <TouchableOpacity onPress={() => setShowStateModal(false)}>
                <Text style={[styles.closeButton, { color: COLORS.primary }]}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {NIGERIA_LOCATIONS.map(state => (
                <TouchableOpacity
                  key={state.name}
                  style={[styles.modalItem, {
                    backgroundColor: selectedState?.name === state.name
                      ? (isDarkMode ? COLORS.dark.background : COLORS.background)
                      : 'transparent'
                  }]}
                  onPress={() => handleStateSelect(state)}
                >
                  <Text style={[styles.modalItemText, {
                    color: isDarkMode ? COLORS.dark.text : COLORS.text,
                    fontWeight: selectedState?.name === state.name ? '600' : '400'
                  }]}>
                    {state.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* City Selection Modal */}
      <Modal
        visible={showCityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? COLORS.dark.surface : COLORS.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? COLORS.dark.text : COLORS.text }]}>
                Select City in {selectedState?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Text style={[styles.closeButton, { color: COLORS.primary }]}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {selectedState?.cities.map(city => (
                <TouchableOpacity
                  key={city.name}
                  style={[styles.modalItem, {
                    backgroundColor: selectedCityLocal?.name === city.name
                      ? (isDarkMode ? COLORS.dark.background : COLORS.background)
                      : 'transparent'
                  }]}
                  onPress={() => handleCitySelect(city)}
                >
                  <Text style={[styles.modalItemText, {
                    color: isDarkMode ? COLORS.dark.text : COLORS.text,
                    fontWeight: selectedCityLocal?.name === city.name ? '600' : '400'
                  }]}>
                    {city.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: SPACING.l,
  },
  inputField: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.m,
  },
  inputText: {
    fontSize: 16,
    fontWeight: '500',
  },
  locationButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 80,
    paddingVertical: 16,
    borderRadius: 30,
    alignSelf: 'center',
    alignItems: 'center',
  },
  locationButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textLight + '30',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalScroll: {
    paddingHorizontal: SPACING.l,
  },
  modalItem: {
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    borderRadius: 8,
    marginTop: SPACING.s,
  },
  modalItemText: {
    fontSize: 16,
  },
});
