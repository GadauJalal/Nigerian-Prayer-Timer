import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useThemeContext } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { QiblaCompass } from '../components/QiblaCompass';
import { Smartphone, AlertTriangle } from 'lucide-react-native';
import { useQiblaCompass } from '../hooks/useQiblaCompass';

export default function QiblaScreen() {
  const { isDarkMode } = useThemeContext();
  const { location } = useApp();
  const isFocused = useIsFocused();

  const fallbackLocation = location
    ? { lat: location.lat, lng: location.lng, name: location.name }
    : null;

  const {
    headingDegrees,
    qiblaBearing,
    dialRotationAnimated,
    needleRotationAnimated,
    isPhoneFlat,
    isSensorAvailable,
    isCalibrationPoor,
    isUsingGPS,
    locationName,
  } = useQiblaCompass(fallbackLocation, isFocused);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#0B1120' : '#F8FAFC' },
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.headerTitle,
              isDarkMode ? styles.headerTitleDark : styles.headerTitleLight,
            ]}
          >
            Qibla
          </Text>
        </View>

        {/* Main content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Direction info card */}
          <View style={styles.directionCard}>
            <View
              style={[
                styles.directionCardInner,
                isDarkMode
                  ? styles.directionCardDark
                  : styles.directionCardLight,
              ]}
            >
              <Text
                style={[
                  styles.directionLabel,
                  isDarkMode
                    ? styles.directionLabelDark
                    : styles.directionLabelLight,
                ]}
              >
                Qibla Direction
              </Text>
              <Text
                style={[
                  styles.directionDegree,
                  isDarkMode
                    ? styles.directionDegreeDark
                    : styles.directionDegreeLight,
                ]}
              >
                {qiblaBearing}°
              </Text>
              <Text
                style={[
                  styles.directionHint,
                  isDarkMode
                    ? styles.directionHintDark
                    : styles.directionHintLight,
                ]}
              >
                Point your phone towards the Kaaba
              </Text>
            </View>
          </View>

          {/* Sensor unavailable message */}
          {isSensorAvailable === false && (
            <View
              style={[
                styles.sensorErrorCard,
                isDarkMode ? styles.sensorErrorCardDark : styles.sensorErrorCardLight,
              ]}
            >
              <Smartphone
                size={48}
                color={isDarkMode ? '#94A3B8' : '#64748B'}
                strokeWidth={1.5}
              />
              <Text
                style={[
                  styles.sensorErrorTitle,
                  isDarkMode ? styles.sensorErrorTitleDark : styles.sensorErrorTitleLight,
                ]}
              >
                Compass Not Available
              </Text>
              <Text
                style={[
                  styles.sensorErrorMessage,
                  isDarkMode ? styles.sensorErrorMessageDark : styles.sensorErrorMessageLight,
                ]}
              >
                Your device does not have a compass sensor, or location permission was denied. Please enable location access in Settings.
              </Text>
            </View>
          )}

          {/* Calibration warning */}
          {isSensorAvailable && isCalibrationPoor && (
            <View
              style={[
                styles.warningBanner,
                isDarkMode ? styles.warningBannerDark : styles.warningBannerLight,
              ]}
            >
              <AlertTriangle
                size={18}
                color={isDarkMode ? '#FBBF24' : '#D97706'}
              />
              <Text
                style={[
                  styles.warningText,
                  isDarkMode ? styles.warningTextDark : styles.warningTextLight,
                ]}
              >
                Compass accuracy is low. Move your phone in a figure-8 pattern to calibrate.
              </Text>
            </View>
          )}

          {/* Device orientation warning */}
          {isSensorAvailable && !isPhoneFlat && (
            <View
              style={[
                styles.warningBanner,
                isDarkMode ? styles.warningBannerDark : styles.warningBannerLight,
              ]}
            >
              <Smartphone
                size={18}
                color={isDarkMode ? '#FBBF24' : '#D97706'}
              />
              <Text
                style={[
                  styles.warningText,
                  isDarkMode ? styles.warningTextDark : styles.warningTextLight,
                ]}
              >
                Hold your phone flat for accurate compass reading
              </Text>
            </View>
          )}

          {/* Compass */}
          {isSensorAvailable && (
            <>
              <View style={styles.compassWrapper}>
                <QiblaCompass
                  dialRotationAnimated={dialRotationAnimated}
                  needleRotationAnimated={needleRotationAnimated}
                  heading={headingDegrees}
                  qiblaDirection={qiblaBearing}
                  isDarkMode={isDarkMode}
                />
              </View>

              {/* Location info */}
              <View style={styles.locationWrapper}>
                <View
                  style={[
                    styles.locationPill,
                    isDarkMode
                      ? styles.locationPillDark
                      : styles.locationPillLight,
                  ]}
                >
                  <View
                    style={[
                      styles.locationDot,
                      { backgroundColor: isUsingGPS ? '#059669' : '#F59E0B' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.locationText,
                      isDarkMode
                        ? styles.locationTextDark
                        : styles.locationTextLight,
                    ]}
                  >
                    {locationName}
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconButtonLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  iconButtonDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '400',
  },
  headerTitleLight: {
    color: '#0F172A',
  },
  headerTitleDark: {
    color: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  directionCard: {
    width: '100%',
    maxWidth: 400,
  },
  directionCardInner: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  directionCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  directionCardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  directionLabel: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  directionLabelLight: {
    color: '#64748B',
  },
  directionLabelDark: {
    color: '#94A3B8',
  },
  directionDegree: {
    fontSize: 40,
    fontWeight: '200',
    textAlign: 'center',
    marginBottom: 4,
  },
  directionDegreeLight: {
    color: '#0F172A',
  },
  directionDegreeDark: {
    color: '#F9FAFB',
  },
  directionHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  directionHintLight: {
    color: '#64748B',
  },
  directionHintDark: {
    color: '#94A3B8',
  },
  sensorErrorCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sensorErrorCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  sensorErrorCardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  sensorErrorTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  sensorErrorTitleLight: {
    color: '#0F172A',
  },
  sensorErrorTitleDark: {
    color: '#F9FAFB',
  },
  sensorErrorMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  sensorErrorMessageLight: {
    color: '#64748B',
  },
  sensorErrorMessageDark: {
    color: '#94A3B8',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 400,
    width: '100%',
  },
  warningBannerLight: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  warningBannerDark: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  warningText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  warningTextLight: {
    color: '#92400E',
  },
  warningTextDark: {
    color: '#FDE68A',
  },
  compassWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locationPillLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  locationPillDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  locationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  locationText: {
    fontSize: 14,
  },
  locationTextLight: {
    color: '#334155',
  },
  locationTextDark: {
    color: '#CBD5E1',
  },
});
