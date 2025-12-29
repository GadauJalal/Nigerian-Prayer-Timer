import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useThemeContext } from '../context/ThemeContext';
import { getNextPrayer } from '../utils/prayerTimes';
import { SPACING } from '../constants/theme';
import { HeroCard, Prayer } from '../components/HeroCard';
import { DateDisplay } from '../components/DateDisplay';
import { PrayerTimesGrid } from '../components/PrayerTimesGrid';
import { HomeHeader } from '../components/HomeHeader';
import { sendTestNotification, debugScheduledNotifications } from '../utils/notifications';

const HomeScreen = ({ navigation }: any) => {
  const { location, prayerTimes } = useApp();
  const { isDarkMode, toggleDarkMode } = useThemeContext();
  const [nextPrayer, setNextPrayer] = useState<Prayer | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const handleToggleDarkMode = () => {
    toggleDarkMode();
  };

  const handleOpenSettings = () => {
    navigation.getParent()?.navigate('Settings');
  };

  const handleTestNotification = async () => {
    const result = await sendTestNotification(5);
    if (result) {
      Alert.alert(
        '🧪 Test Notification Scheduled',
        'Prayer notification with Adhan sound will appear in 5 seconds!\n\nClose the app to test if Adhan plays when app is closed.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDebugNotifications = async () => {
    const scheduled = await debugScheduledNotifications();
    Alert.alert(
      '📋 Scheduled Notifications',
      `You have ${scheduled.length} notifications scheduled. Check console for details.`,
      [{ text: 'OK' }]
    );
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (prayerTimes) {
      const next = getNextPrayer(prayerTimes);
      // If remaining is negative, all prayers for today are completed
      if (next && next.remaining < 0) {
        setNextPrayer(null);
      } else if (next) {
        setNextPrayer({ name: next.name, time: next.time });
      } else {
        setNextPrayer(null);
      }
    }
  }, [prayerTimes, currentTime]);

  if (!location || !prayerTimes) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          { backgroundColor: isDarkMode ? '#111827' : '#F9FAFB' },
        ]}
      >
        <View style={styles.loadingContent}>
          {/* You can add a loading spinner here */}
        </View>
      </SafeAreaView>
    );
  }

  const prayers: Prayer[] = [
    { name: 'Fajr', time: prayerTimes.fajr },
    { name: 'Sunrise', time: prayerTimes.sunrise },
    { name: 'Zuhr', time: prayerTimes.zuhr },
    { name: 'Asr', time: prayerTimes.asr },
    { name: 'Maghrib', time: prayerTimes.maghrib },
    { name: 'Isha', time: prayerTimes.isha },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#0B1120' : '#F8FAFC' },
      ]}
    >
      {/* Subtle ambient orb */}
      <View
        style={[
          styles.ambientOrb,
          isDarkMode && styles.ambientOrbDark,
        ]}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header with location and icons */}
        <HomeHeader
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onOpenSettings={handleOpenSettings}
          location={location?.name || 'Abuja, Nigeria'}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Card - Next Prayer */}
          <HeroCard
            nextPrayer={nextPrayer}
            currentTime={currentTime}
            isDarkMode={isDarkMode}
          />

          {/* Date Display */}
          <DateDisplay isDarkMode={isDarkMode} />

          {/* Prayer Times Grid */}
          <PrayerTimesGrid
            prayerTimes={prayers}
            currentTime={currentTime}
            nextPrayer={nextPrayer}
            isDarkMode={isDarkMode}
          />

          {/* Test Notification Buttons - DEV ONLY */}
          <View style={styles.testButtonsContainer}>
            <TouchableOpacity
              onPress={handleTestNotification}
              style={[styles.testButton, styles.testButtonPrimary]}
            >
              <Text style={styles.testButtonText}>🧪 Test Notifications (5s)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDebugNotifications}
              style={[styles.testButton, styles.testButtonSecondary]}
            >
              <Text style={[styles.testButtonText, styles.testButtonTextSecondary]}>
                📋 Show Scheduled
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  ambientOrb: {
    position: 'absolute',
    top: 160,
    right: 0,
    width: 400,
    height: 400,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 200,
  },
  ambientOrbDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  safeArea: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SPACING.m,
    paddingBottom: 100, // Extra padding for bottom navigation
  },
  testButtonsContainer: {
    marginTop: 20,
    gap: 10,
  },
  testButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonPrimary: {
    backgroundColor: '#10B981',
  },
  testButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  testButtonTextSecondary: {
    color: '#10B981',
  },
});

export default HomeScreen;
