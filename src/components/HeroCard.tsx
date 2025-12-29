import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  useColorScheme,
} from 'react-native';
import { Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const mosqueImage = require('../../assets/mosque.png');

export interface Prayer {
  name: string;
  time: Date;
}

interface HeroCardProps {
  nextPrayer: Prayer | null;
  currentTime: Date;
  isDarkMode: boolean;
}

function calculateTimeUntil(
  prayerTime: Date,
  currentTime: Date
): { hours: string; minutes: string; seconds: string } {
  const diff = prayerTime.getTime() - currentTime.getTime();

  if (diff <= 0) return { hours: '00', minutes: '00', seconds: '00' };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

export function HeroCard({ nextPrayer, currentTime, isDarkMode }: HeroCardProps) {
  if (!nextPrayer) {
    return (
      <View
        style={[
          styles.container,
          styles.completedContainer,
          isDarkMode ? styles.containerDark : styles.containerLight,
        ]}
      >
        {/* Mosque image centered with glow */}
        <View style={styles.completedMosqueSection}>
          {/* Glow effect behind mosque */}
          <View style={[styles.completedGlow, isDarkMode && styles.completedGlowDark]} />

          <Image
            source={mosqueImage}
            style={styles.completedMosqueImage}
            resizeMode="contain"
          />
        </View>

        {/* Completed message */}
        <Text
          style={[
            styles.completedText,
            isDarkMode ? styles.completedTextDark : styles.completedTextLight,
          ]}
        >
          All prayers completed for today
        </Text>
      </View>
    );
  }

  const countdown = calculateTimeUntil(nextPrayer.time, currentTime);

  // Format times
  const currentTimeStr = currentTime.toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const prayerTimeStr = nextPrayer.time.toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Calculate progress
  const now = currentTime.getTime();
  const start = new Date(nextPrayer.time);
  start.setHours(start.getHours() - 6);
  const total = nextPrayer.time.getTime() - start.getTime();
  const elapsed = now - start.getTime();
  const progress = Math.min(Math.max((elapsed / total) * 100, 0), 95);

  return (
    <View
      style={[
        styles.container,
        isDarkMode ? styles.containerDark : styles.containerLight,
      ]}
    >
      {/* Top Half: Mosque Illustration */}
      <View style={styles.mosqueSection}>

        {/* Mosque image */}
        <View style={styles.mosqueImageContainer}>
          <Image
            source={mosqueImage}
            style={styles.mosqueImage}
            resizeMode="contain"
          />
        </View>

        {/* Gradient transition */}
        <LinearGradient
          colors={
            isDarkMode
              ? ['transparent', 'rgba(30, 41, 59, 1)']
              : ['transparent', 'rgba(255, 255, 255, 1)']
          }
          style={styles.gradientTransition}
          pointerEvents="none"
        />
      </View>

      {/* Bottom Half: Next Prayer Information */}
      <View style={styles.infoSection}>

        <View style={styles.infoContent}>
          {/* Next Prayer Label */}
          <View style={styles.labelContainer}>
            <View style={styles.dividerLine} />
            <View style={styles.labelRow}>
              <Clock
                size={12}
                color={isDarkMode ? '#94A3B8' : '#64748B'}
              />
              <Text
                style={[
                  styles.nextPrayerLabel,
                  isDarkMode ? styles.nextPrayerLabelDark : styles.nextPrayerLabelLight,
                ]}
              >
                NEXT PRAYER
              </Text>
            </View>
            <View style={styles.dividerLine} />
          </View>

          {/* Current Time & Prayer Time */}
          <View style={styles.timesRow}>
            <View>
              <Text
                style={[
                  styles.timeSubLabel,
                  isDarkMode ? styles.timeSubLabelDark : styles.timeSubLabelLight,
                ]}
              >
                Current Time
              </Text>
              <Text
                style={[
                  styles.timeValue,
                  isDarkMode ? styles.timeValueDark : styles.timeValueLight,
                ]}
              >
                {currentTimeStr}
              </Text>
            </View>
            <View style={styles.timeRight}>
              <Text
                style={[
                  styles.prayerNameLabel,
                  isDarkMode ? styles.prayerNameLabelDark : styles.prayerNameLabelLight,
                ]}
              >
                {nextPrayer.name}
              </Text>
              <Text
                style={[
                  styles.timeValue,
                  isDarkMode ? styles.timeValueDark : styles.timeValueLight,
                ]}
              >
                {prayerTimeStr}
              </Text>
            </View>
          </View>

          {/* Countdown */}
          <View style={styles.countdownSection}>
            <Text
              style={[
                styles.countdownLabel,
                isDarkMode ? styles.countdownLabelDark : styles.countdownLabelLight,
              ]}
            >
              Time Remaining
            </Text>
            <View style={styles.countdownRow}>
              <View style={styles.countdownUnit}>
                <Text
                  style={[
                    styles.countdownNumber,
                    isDarkMode ? styles.countdownNumberDark : styles.countdownNumberLight,
                  ]}
                >
                  {countdown.hours}
                </Text>
                <Text style={styles.countdownUnitLabel}>HOURS</Text>
              </View>
              <Text style={styles.countdownSeparator}>:</Text>
              <View style={styles.countdownUnit}>
                <Text
                  style={[
                    styles.countdownNumber,
                    isDarkMode ? styles.countdownNumberDark : styles.countdownNumberLight,
                  ]}
                >
                  {countdown.minutes}
                </Text>
                <Text style={styles.countdownUnitLabel}>MIN</Text>
              </View>
              <Text style={styles.countdownSeparator}>:</Text>
              <View style={styles.countdownUnit}>
                <Text
                  style={[
                    styles.countdownNumber,
                    isDarkMode ? styles.countdownNumberDark : styles.countdownNumberLight,
                  ]}
                >
                  {countdown.seconds}
                </Text>
                <Text style={styles.countdownUnitLabel}>SEC</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarBackground,
                isDarkMode
                  ? styles.progressBarBackgroundDark
                  : styles.progressBarBackgroundLight,
              ]}
            >
              <View
                style={[styles.progressBarFill, { width: `${progress}%` }]}
              >
                <LinearGradient
                  colors={['#059669', '#10B981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
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
  mosqueSection: {
    position: 'relative',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    width: 280,
    height: 280,
    marginTop: -140,
    backgroundColor: 'rgba(251, 191, 36, 0.06)',
    borderRadius: 140,
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#FBBF24',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 80,
      },
      android: {
        elevation: 0,
      },
    }),
  },

  mosqueImageContainer: {
    position: 'relative',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
  },
  mosqueImage: {
    width: 400,
    height: 280,
  },
  completedContainer: {
    paddingVertical: 64,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 450,
  },
  completedMosqueSection: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  completedGlow: {
    position: 'absolute',
    alignSelf: 'center',
    width: 320,
    height: 320,
    backgroundColor: 'rgba(251, 191, 36, 0.04)',
    borderRadius: 160,
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#FBBF24',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 60,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  completedGlowDark: {
    backgroundColor: 'rgba(251, 191, 36, 0.06)',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.6,
        shadowRadius: 80,
      },
    }),
  },
  completedMosqueImage: {
    width: 340,
    height: 280,
    zIndex: 10,
  },
  gradientTransition: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
  },
  infoSection: {
    position: 'relative',
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 12,
  },
  emeraldGlow: {
    position: 'absolute',
    bottom: -64,
    right: -64,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 64,
  },
  emeraldGlowDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  infoContent: {
    position: 'relative',
    zIndex: 10,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  dividerLine: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(5, 150, 105, 0.3)',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextPrayerLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  nextPrayerLabelLight: {
    color: '#64748B',
  },
  nextPrayerLabelDark: {
    color: '#94A3B8',
  },
  timesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  timeRight: {
    alignItems: 'flex-end',
  },
  timeSubLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  timeSubLabelLight: {
    color: '#64748B',
  },
  timeSubLabelDark: {
    color: '#94A3B8',
  },
  prayerNameLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  prayerNameLabelLight: {
    color: '#047857',
  },
  prayerNameLabelDark: {
    color: '#34D399',
  },
  timeValue: {
    fontSize: 20,
    fontWeight: '300',
  },
  timeValueLight: {
    color: '#0F172A',
  },
  timeValueDark: {
    color: '#F9FAFB',
  },
  countdownSection: {
    marginBottom: 16,
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: 10,
    marginBottom: 10,
  },
  countdownLabelLight: {
    color: '#64748B',
  },
  countdownLabelDark: {
    color: '#94A3B8',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },
  countdownUnit: {
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 36,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  countdownNumberLight: {
    color: '#0F172A',
  },
  countdownNumberDark: {
    color: '#F9FAFB',
  },
  countdownUnitLabel: {
    fontSize: 9,
    letterSpacing: 1,
    color: '#64748B',
    marginTop: 2,
  },
  countdownSeparator: {
    fontSize: 24,
    fontWeight: '200',
    color: '#94A3B8',
    marginHorizontal: 4,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarBackgroundLight: {
    backgroundColor: '#E2E8F0',
  },
  progressBarBackgroundDark: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  completedText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  completedTextLight: {
    color: '#64748B',
  },
  completedTextDark: {
    color: '#94A3B8',
  },
});
