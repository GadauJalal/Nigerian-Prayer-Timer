import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useThemeContext } from '../context/ThemeContext';
import { getNextPrayer } from '../utils/prayerTimes';
import { SPACING } from '../constants/theme';
import { HeroCard, Prayer } from '../components/HeroCard';
import { DateDisplay } from '../components/DateDisplay';
import { PrayerTimesGrid } from '../components/PrayerTimesGrid';
import { HomeHeader } from '../components/HomeHeader';

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!prayerTimes) return;

    const updateNextPrayer = () => {
      const next = getNextPrayer(prayerTimes);
      if (next && next.remaining < 0) {
        setNextPrayer(prev => (prev === null ? prev : null));
      } else if (next) {
        setNextPrayer(prev => {
          if (prev && prev.name === next.name && prev.time.getTime() === next.time.getTime()) {
            return prev;
          }
          return { name: next.name, time: next.time };
        });
      } else {
        setNextPrayer(prev => (prev === null ? prev : null));
      }
    };

    updateNextPrayer();
    const timer = setInterval(updateNextPrayer, 30000);
    return () => clearInterval(timer);
  }, [prayerTimes]);

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
});

export default HomeScreen;
