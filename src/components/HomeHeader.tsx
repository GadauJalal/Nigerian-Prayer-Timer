import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MapPin, Sun, Moon, Settings } from 'lucide-react-native';

interface HomeHeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
  location?: string;
}

export function HomeHeader({
  isDarkMode,
  onToggleDarkMode,
  onOpenSettings,
  location = 'Abuja, Nigeria',
}: HomeHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Location pill on the left */}
      <View
        style={[
          styles.locationPill,
          isDarkMode ? styles.locationPillDark : styles.locationPillLight,
        ]}
      >
        <View style={styles.locationIconContainer}>
          <MapPin size={12} color="#FFFFFF" />
        </View>
        <Text
          style={[
            styles.locationText,
            isDarkMode ? styles.locationTextDark : styles.locationTextLight,
          ]}
        >
          {location}
        </Text>
      </View>

      {/* Icons grouped on the right */}
      <View style={styles.iconGroup}>
        <TouchableOpacity
          onPress={onToggleDarkMode}
          style={[
            styles.iconButton,
            isDarkMode ? styles.iconButtonDark : styles.iconButtonLight,
          ]}
          activeOpacity={0.7}
        >
          {isDarkMode ? (
            <Sun size={18} color="#F59E0B" />
          ) : (
            <Moon size={18} color="#475569" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onOpenSettings}
          style={[
            styles.iconButton,
            isDarkMode ? styles.iconButtonDark : styles.iconButtonLight,
          ]}
          activeOpacity={0.7}
        >
          <Settings
            size={18}
            color={isDarkMode ? '#CBD5E1' : '#475569'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  locationPillLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  locationPillDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  locationIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  locationText: {
    fontSize: 14,
  },
  locationTextLight: {
    color: '#334155',
  },
  locationTextDark: {
    color: '#E2E8F0',
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  iconButtonLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  iconButtonDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
});
