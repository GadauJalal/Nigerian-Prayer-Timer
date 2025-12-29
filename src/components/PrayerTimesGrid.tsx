import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Sunrise,
  Sun,
  Sunset,
  Moon,
  CloudMoon,
  Cloud,
} from 'lucide-react-native';
import { Prayer } from './HeroCard';

interface PrayerTimesGridProps {
  prayerTimes: Prayer[];
  currentTime: Date;
  nextPrayer: Prayer | null;
  isDarkMode: boolean;
}

const prayerIcons: Record<
  string,
  React.ComponentType<{ size: number; color: string }>
> = {
  Fajr: CloudMoon,
  Sunrise: Sunrise,
  Dhuhr: Sun,
  Zuhr: Sun,
  Asr: Cloud,
  Maghrib: Sunset,
  Isha: Moon,
};

export function PrayerTimesGrid({
  prayerTimes,
  currentTime,
  nextPrayer,
  isDarkMode,
}: PrayerTimesGridProps) {
  return (
    <View style={styles.container}>
      {/* Section Title with Accent Line */}
      <View style={styles.titleContainer}>
        <View style={styles.accentLine} />
        <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
          Today's Prayers
        </Text>
      </View>

      {prayerTimes.map((prayer) => {
        const Icon = prayerIcons[prayer.name];
        const isNext = nextPrayer?.name === prayer.name;
        const isPassed = prayer.time < currentTime;

        const prayerTimeStr = prayer.time.toLocaleTimeString('en-NG', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        return (
          <View
            key={prayer.name}
            style={[
              styles.prayerCard,
              isNext
                ? (isDarkMode ? styles.prayerCardNextDark : styles.prayerCardNextLight)
                : isPassed
                ? (isDarkMode ? styles.prayerCardPassedDark : styles.prayerCardPassedLight)
                : (isDarkMode ? styles.prayerCardDefaultDark : styles.prayerCardDefaultLight),
            ]}
          >
            {/* Left accent line for active prayer */}
            {isNext && (
              <View style={styles.activeIndicator} />
            )}

            {/* Gradient overlay for active prayer */}
            {isNext && (
              <View style={styles.gradientOverlay} />
            )}

            <View style={styles.prayerContent}>
              <View style={styles.leftContent}>
                {/* Icon container */}
                <View
                  style={[
                    styles.iconContainer,
                    isNext
                      ? styles.iconContainerNext
                      : isPassed
                      ? (isDarkMode ? styles.iconContainerPassedDark : styles.iconContainerPassedLight)
                      : (isDarkMode ? styles.iconContainerDefaultDark : styles.iconContainerDefaultLight),
                  ]}
                >
                  {Icon && (
                    <Icon
                      size={20}
                      color={
                        isNext
                          ? '#FFFFFF'
                          : isPassed
                          ? (isDarkMode ? '#64748B' : '#94A3B8')
                          : (isDarkMode ? '#94A3B8' : '#64748B')
                      }
                    />
                  )}
                </View>

                <View style={styles.prayerInfo}>
                  <Text
                    style={[
                      styles.prayerName,
                      isNext
                        ? (isDarkMode ? styles.prayerNameNextDark : styles.prayerNameNextLight)
                        : isPassed
                        ? styles.prayerNamePassed
                        : (isDarkMode ? styles.prayerNameDefaultDark : styles.prayerNameDefaultLight),
                    ]}
                  >
                    {prayer.name}
                  </Text>
                  {isNext && (
                    <Text style={styles.nextBadgeText}>
                      NEXT PRAYER
                    </Text>
                  )}
                </View>
              </View>

              <Text
                style={[
                  styles.prayerTime,
                  isNext
                    ? (isDarkMode ? styles.prayerTimeNextDark : styles.prayerTimeNextLight)
                    : isPassed
                    ? styles.prayerTimePassed
                    : (isDarkMode ? styles.prayerTimeDefaultDark : styles.prayerTimeDefaultLight),
                ]}
              >
                {prayerTimeStr}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  accentLine: {
    width: 3,
    height: 16,
    backgroundColor: '#10B981', // emerald-500
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionTitleDark: {
    color: '#F1F5F9',
  },
  prayerCard: {
    position: 'relative',
    borderRadius: 16,
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
  prayerCardNextLight: {
    backgroundColor: '#A7F3D0', // emerald-200
  },
  prayerCardNextDark: {
    backgroundColor: '#065F46', // emerald-800
  },
  prayerCardPassedLight: {
    backgroundColor: '#F8FAFC',
  },
  prayerCardPassedDark: {
    backgroundColor: '#1E293B',
  },
  prayerCardDefaultLight: {
    backgroundColor: '#FFFFFF',
  },
  prayerCardDefaultDark: {
    backgroundColor: '#1E293B',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#10B981',
    zIndex: 10,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.1,
  },
  prayerContent: {
    position: 'relative',
    zIndex: 5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerNext: {
    backgroundColor: '#10B981', // emerald-500
  },
  iconContainerPassedLight: {
    backgroundColor: '#E2E8F0',
  },
  iconContainerPassedDark: {
    backgroundColor: '#334155',
  },
  iconContainerDefaultLight: {
    backgroundColor: '#F1F5F9',
  },
  iconContainerDefaultDark: {
    backgroundColor: '#334155',
  },
  prayerInfo: {
    gap: 2,
    flex: 1,
  },
  prayerName: {
    fontSize: 14,
    fontWeight: '400',
  },
  prayerNameNextLight: {
    color: '#064E3B', // emerald-900
  },
  prayerNameNextDark: {
    color: '#FFFFFF',
  },
  prayerNamePassed: {
    color: '#94A3B8',
  },
  prayerNameDefaultLight: {
    color: '#0F172A',
  },
  prayerNameDefaultDark: {
    color: '#F1F5F9',
  },
  nextBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#059669', // emerald-600
    textTransform: 'uppercase',
  },
  prayerTime: {
    fontSize: 14,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  prayerTimeNextLight: {
    color: '#064E3B', // emerald-900
  },
  prayerTimeNextDark: {
    color: '#FFFFFF',
  },
  prayerTimePassed: {
    color: '#94A3B8',
  },
  prayerTimeDefaultLight: {
    color: '#64748B',
  },
  prayerTimeDefaultDark: {
    color: '#94A3B8',
  },
});
