import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { getHijriDate } from '../utils/date';

interface DateDisplayProps {
  isDarkMode: boolean;
}

export function DateDisplay({ isDarkMode }: DateDisplayProps) {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-NG', { weekday: 'long' });
  const dateNum = today.getDate();
  const monthYear = today.toLocaleDateString('en-NG', {
    month: 'long',
    year: 'numeric',
  });

  // Calculate actual Hijri date for today with calibration offset
  const { location, hijriAdjustment } = useApp();
  const hijriDate = getHijriDate(today, location?.lat, location?.lng, hijriAdjustment);

  return (
    <View
      style={[
        styles.container,
        isDarkMode ? styles.containerDark : styles.containerLight,
      ]}
    >
      {/* Subtle emerald glow on hover (simulated) */}
      <View style={[styles.glowEffect, isDarkMode && styles.glowEffectDark]} />

      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View
            style={[
              styles.iconContainer,
              isDarkMode
                ? styles.iconContainerDark
                : styles.iconContainerLight,
            ]}
          >
            <Calendar
              size={22}
              color={isDarkMode ? '#34D399' : '#047857'}
            />
          </View>
          <View style={styles.dateInfo}>
            <Text
              style={[
                styles.dayName,
                isDarkMode ? styles.dayNameDark : styles.dayNameLight,
              ]}
            >
              {dayName}
            </Text>
            <Text
              style={[
                styles.dateText,
                isDarkMode ? styles.dateTextDark : styles.dateTextLight,
              ]}
            >
              {dateNum} {monthYear}
            </Text>
          </View>
        </View>
        <View style={styles.rightSection}>
          <Text
            style={[
              styles.hijriDate,
              isDarkMode ? styles.hijriDateDark : styles.hijriDateLight,
            ]}
          >
            {hijriDate}
          </Text>
          <Text style={styles.hijriLabel}>HIJRI</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  containerDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  glowEffect: {
    position: 'absolute',
    top: -64,
    right: -64,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 64,
    opacity: 0,
  },
  glowEffectDark: {
    opacity: 0,
  },
  content: {
    position: 'relative',
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
  iconContainerLight: {
    backgroundColor: 'rgba(236, 253, 245, 1)',
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  iconContainerDark: {
    backgroundColor: 'rgba(2, 44, 34, 0.3)',
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  dateInfo: {
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '300',
  },
  dayNameLight: {
    color: '#0F172A',
  },
  dayNameDark: {
    color: '#F9FAFB',
  },
  dateText: {
    fontSize: 13,
  },
  dateTextLight: {
    color: '#475569',
  },
  dateTextDark: {
    color: '#94A3B8',
  },
  rightSection: {
    alignItems: 'flex-end',
    flexShrink: 0,
    maxWidth: '35%',
  },
  hijriDate: {
    fontWeight: '500',
    fontSize: 13,
    textAlign: 'right',
  },
  hijriDateLight: {
    color: '#047857',
  },
  hijriDateDark: {
    color: '#34D399',
  },
  hijriLabel: {
    fontSize: 10,
    letterSpacing: 1,
    color: '#64748B',
    marginTop: 2,
  },
});
