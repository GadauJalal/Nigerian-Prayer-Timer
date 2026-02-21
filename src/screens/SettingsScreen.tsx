import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  MapPin,
  Bell,
  Palette,
  Info,
  ChevronRight,
  Sun,
  Moon,
  Smartphone,
  Locate,
  RotateCcw,
  Mail,
  Shield,
  Volume2,
} from 'lucide-react-native';
import { useThemeContext } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { Audio } from 'expo-av';
import { NIGERIA_LOCATIONS, City } from '../data/nigeria_locations';
import { getCurrentLocation, findNearestCity } from '../utils/location';
import { updateNotificationChannelSound } from '../utils/notifications';

type ExpandedSection = 'location' | 'notifications' | 'theme' | 'about' | null;

// Adhan sound options
const ADHAN_SOUNDS = [
  { id: 'adhan1', name: 'Adhan 1 (Default)', file: require('../../assets/adhan1.mp3') },
  { id: 'adhan2', name: 'Adhan 2', file: require('../../assets/adhan2.mp3') },
  { id: 'adhan3', name: 'Adhan 3', file: require('../../assets/adhan3.mp3') },
];

export default function SettingsScreen({ navigation }: any) {
  const { isDarkMode, themeMode, setThemeMode } = useThemeContext();
  const { location, setLocation, selectedAdhan, setSelectedAdhan } = useApp();
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Location settings
  const [expandedState, setExpandedState] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Get current state and city from AppContext location
  const getStateAndCity = () => {
    if (!location) return { stateName: '', cityName: '' };

    for (const state of NIGERIA_LOCATIONS) {
      const city = state.cities.find(c => c.name === location.name);
      if (city) {
        return { stateName: state.name, cityName: city.name };
      }
    }
    return { stateName: '', cityName: location.name };
  };

  const { stateName: selectedState, cityName: selectedCity } = getStateAndCity();

  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [fajrNotif, setFajrNotif] = useState(true);
  const [dhuhrNotif, setDhuhrNotif] = useState(true);
  const [asrNotif, setAsrNotif] = useState(true);
  const [maghribNotif, setMaghribNotif] = useState(true);
  const [ishaNotif, setIshaNotif] = useState(true);

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const playAdhanPreview = async (adhanId: string) => {
    try {
      // Stop and unload any currently playing sound
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      const adhanFile = ADHAN_SOUNDS.find(a => a.id === adhanId);
      if (adhanFile) {
        const { sound: newSound } = await Audio.Sound.createAsync(adhanFile.file);
        setSound(newSound);
        await newSound.playAsync();
      }
    } catch (error) {
      console.error('Error playing adhan preview:', error);
      Alert.alert('Error', 'Failed to play adhan preview');
    }
  };

  // Cleanup sound on unmount
  React.useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handleResetSettings = () => {
    Alert.alert(
      'Reset All Settings',
      'Are you sure you want to reset all settings to default? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setNotificationsEnabled(true);
            setFajrNotif(true);
            setDhuhrNotif(true);
            setAsrNotif(true);
            setMaghribNotif(true);
            setIshaNotif(true);
            setSelectedAdhan('adhan1');
            setThemeMode('system');
            Alert.alert('Success', 'All settings have been reset to default values.');
          },
        },
      ]
    );
  };

  const handleRedetectLocation = async () => {
    setIsDetectingLocation(true);
    Alert.alert('GPS Location', 'Detecting your location using GPS...');

    try {
      const location = await getCurrentLocation();
      if (location && location.coords) {
        const nearestCity = findNearestCity(location.coords.latitude, location.coords.longitude);
        if (nearestCity) {
          setLocation(nearestCity);
          Alert.alert('Location Updated', `Location set to ${nearestCity.name}`);
        } else {
          Alert.alert('Error', 'Could not find nearest city. Please select manually.');
        }
      } else {
        Alert.alert('Error', 'Could not get GPS location. Please check your location permissions.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to detect location. Please try again or select manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const toggleState = (state: string) => {
    setExpandedState(expandedState === state ? null : state);
  };

  const handleSelectCity = (city: City) => {
    setLocation(city);
    Alert.alert('Location Updated', `Location set to ${city.name}`);
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
            Settings
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.closeButton, isDarkMode ? styles.closeButtonDark : styles.closeButtonLight]}
            activeOpacity={0.7}
          >
            <X size={20} color={isDarkMode ? '#CBD5E1' : '#475569'} />
          </TouchableOpacity>
        </View>

        {/* Settings Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Location & City Settings */}
          <SettingCard
            icon={MapPin}
            title="Location & City"
            subtitle={selectedCity && selectedState ? `${selectedCity}, ${selectedState}` : 'Select location'}
            isExpanded={expandedSection === 'location'}
            onToggle={() => toggleSection('location')}
            isDarkMode={isDarkMode}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.sectionLabel, isDarkMode && styles.sectionLabelDark]}>
                Select Your State
              </Text>
              <ScrollView style={styles.stateList} nestedScrollEnabled>
                {NIGERIA_LOCATIONS.map((state) => (
                  <View key={state.name}>
                    <TouchableOpacity
                      onPress={() => toggleState(state.name)}
                      style={[
                        styles.stateItem,
                        isDarkMode ? styles.stateItemDark : styles.stateItemLight,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stateText,
                          isDarkMode && styles.stateTextDark,
                          state.name === selectedState && styles.stateTextSelected,
                        ]}
                      >
                        {state.name}
                      </Text>
                      <ChevronRight
                        size={16}
                        color="#94A3B8"
                        style={expandedState === state.name ? styles.chevronRotated : undefined}
                      />
                    </TouchableOpacity>
                    {expandedState === state.name && (
                      <View style={styles.lgaList}>
                        {state.cities.map((city) => (
                          <TouchableOpacity
                            key={city.name}
                            onPress={() => handleSelectCity(city)}
                            style={[
                              styles.lgaItem,
                              isDarkMode ? styles.lgaItemDark : styles.lgaItemLight,
                              city.name === selectedCity && state.name === selectedState && styles.lgaItemSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.lgaText,
                                isDarkMode && styles.lgaTextDark,
                                city.name === selectedCity && state.name === selectedState && styles.lgaTextSelected,
                              ]}
                            >
                              {city.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity
                onPress={handleRedetectLocation}
                disabled={isDetectingLocation}
                style={[
                  styles.actionButton,
                  isDarkMode ? styles.actionButtonDark : styles.actionButtonLight,
                ]}
              >
                <Locate size={16} color={isDarkMode ? '#CBD5E1' : '#475569'} />
                <Text style={[styles.actionButtonText, isDarkMode && styles.actionButtonTextDark]}>
                  {isDetectingLocation ? 'Detecting...' : 'Use GPS Location'}
                </Text>
              </TouchableOpacity>
            </View>
          </SettingCard>

          {/* Notifications & Adhan Settings */}
          <SettingCard
            icon={Bell}
            title="Notifications & Adhan"
            subtitle={notificationsEnabled ? 'Enabled' : 'Disabled'}
            isExpanded={expandedSection === 'notifications'}
            onToggle={() => toggleSection('notifications')}
            isDarkMode={isDarkMode}
          >
            <View style={styles.settingContent}>
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, isDarkMode && styles.toggleLabelDark]}>
                  Enable Notifications
                </Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#CBD5E1', true: '#059669' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {notificationsEnabled && (
                <>
                  <Text style={[styles.sectionLabel, styles.sectionLabelSpaced, isDarkMode && styles.sectionLabelDark]}>
                    Prayer Notifications
                  </Text>
                  {[
                    { name: 'Fajr', state: fajrNotif, setState: setFajrNotif },
                    { name: 'Dhuhr', state: dhuhrNotif, setState: setDhuhrNotif },
                    { name: 'Asr', state: asrNotif, setState: setAsrNotif },
                    { name: 'Maghrib', state: maghribNotif, setState: setMaghribNotif },
                    { name: 'Isha', state: ishaNotif, setState: setIshaNotif },
                  ].map((prayer) => (
                    <View key={prayer.name} style={styles.toggleRow}>
                      <Text style={[styles.toggleLabel, isDarkMode && styles.toggleLabelDark]}>
                        {prayer.name}
                      </Text>
                      <Switch
                        value={prayer.state}
                        onValueChange={prayer.setState}
                        trackColor={{ false: '#CBD5E1', true: '#059669' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  ))}

                  <Text style={[styles.sectionLabel, styles.sectionLabelSpaced, isDarkMode && styles.sectionLabelDark]}>
                    Adhan Sound
                  </Text>
                  {ADHAN_SOUNDS.map((adhan) => (
                    <TouchableOpacity
                      key={adhan.id}
                      onPress={async () => {
                        // Update context (for UI)
                        setSelectedAdhan(adhan.id);

                        // Play preview
                        playAdhanPreview(adhan.id);

                        // Update notification channel and reschedule notifications
                        try {
                          const success = await updateNotificationChannelSound(adhan.id);
                          if (success) {
                            console.log(`✅ Successfully updated to ${adhan.name}`);
                          } else {
                            console.log(`⚠️ Failed to update notification sound`);
                          }
                        } catch (error) {
                          console.error('Error updating notification sound:', error);
                        }
                      }}
                      style={[
                        styles.reciterItem,
                        isDarkMode ? styles.reciterItemDark : styles.reciterItemLight,
                        selectedAdhan === adhan.id && styles.reciterItemSelected,
                      ]}
                    >
                      <Volume2 size={16} color={selectedAdhan === adhan.id ? '#059669' : '#94A3B8'} />
                      <Text
                        style={[
                          styles.reciterText,
                          isDarkMode && styles.reciterTextDark,
                          selectedAdhan === adhan.id && styles.reciterTextSelected,
                        ]}
                      >
                        {adhan.name}
                      </Text>
                    </TouchableOpacity>
                  ))}

                </>
              )}
            </View>
          </SettingCard>

          {/* Theme & Appearance */}
          <SettingCard
            icon={Palette}
            title="Theme & Appearance"
            subtitle={themeMode === 'system' ? 'System' : themeMode === 'dark' ? 'Dark' : 'Light'}
            isExpanded={expandedSection === 'theme'}
            onToggle={() => toggleSection('theme')}
            isDarkMode={isDarkMode}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.sectionLabel, isDarkMode && styles.sectionLabelDark]}>
                Choose Theme
              </Text>
              {[
                { mode: 'light' as const, label: 'Light Mode', icon: Sun },
                { mode: 'dark' as const, label: 'Dark Mode', icon: Moon },
                { mode: 'system' as const, label: 'System Default', icon: Smartphone },
              ].map(({ mode, label, icon: Icon }) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setThemeMode(mode)}
                  style={[
                    styles.themeOption,
                    isDarkMode ? styles.themeOptionDark : styles.themeOptionLight,
                    themeMode === mode && styles.themeOptionSelected,
                  ]}
                >
                  <Icon size={18} color={themeMode === mode ? '#059669' : '#94A3B8'} />
                  <Text
                    style={[
                      styles.themeOptionText,
                      isDarkMode && styles.themeOptionTextDark,
                      themeMode === mode && styles.themeOptionTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SettingCard>

          {/* About & Info */}
          <SettingCard
            icon={Info}
            title="About & Info"
            subtitle="App information & privacy"
            isExpanded={expandedSection === 'about'}
            onToggle={() => toggleSection('about')}
            isDarkMode={isDarkMode}
          >
            <View style={styles.settingContent}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>
                  App Version
                </Text>
                <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>
                  1.0.0
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.actionButtonSpaced,
                  isDarkMode ? styles.actionButtonDark : styles.actionButtonLight,
                ]}
              >
                <Shield size={16} color={isDarkMode ? '#CBD5E1' : '#475569'} />
                <Text style={[styles.actionButtonText, isDarkMode && styles.actionButtonTextDark]}>
                  Privacy Policy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isDarkMode ? styles.actionButtonDark : styles.actionButtonLight,
                ]}
              >
                <Mail size={16} color={isDarkMode ? '#CBD5E1' : '#475569'} />
                <Text style={[styles.actionButtonText, isDarkMode && styles.actionButtonTextDark]}>
                  Contact Support
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleResetSettings}
                style={[styles.actionButton, styles.actionButtonDanger]}
              >
                <RotateCcw size={16} color="#DC2626" />
                <Text style={styles.actionButtonTextDanger}>
                  Reset All Settings
                </Text>
              </TouchableOpacity>
            </View>
          </SettingCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Helper Components
interface SettingCardProps {
  icon: any;
  title: string;
  subtitle: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isDarkMode: boolean;
}

function SettingCard({ icon: Icon, title, subtitle, isExpanded, onToggle, children, isDarkMode }: SettingCardProps) {
  return (
    <View style={[styles.card, isDarkMode ? styles.cardDark : styles.cardLight]}>
      <TouchableOpacity
        onPress={onToggle}
        style={styles.cardHeader}
        activeOpacity={0.7}
      >
        <View style={[styles.cardIcon, isDarkMode ? styles.cardIconDark : styles.cardIconLight]}>
          <Icon size={20} color={isDarkMode ? '#CBD5E1' : '#475569'} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>
            {title}
          </Text>
          <Text style={[styles.cardSubtitle, isDarkMode && styles.cardSubtitleDark]}>
            {subtitle}
          </Text>
        </View>
        <ChevronRight
          size={20}
          color="#94A3B8"
          style={isExpanded ? styles.chevronRotated : undefined}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={[styles.cardBody, isDarkMode && styles.cardBodyDark]}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  containerDark: {
    backgroundColor: '#0B1120',
  },
  ambientGlow: {
    position: 'absolute',
    top: 300,
    left: -100,
    width: 600,
    height: 600,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 300,
  },
  ambientGlowDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
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
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
  },
  headerDark: {
    borderBottomColor: 'rgba(51, 65, 85, 0.8)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '400',
    color: '#0F172A',
  },
  headerTitleDark: {
    color: '#F9FAFB',
  },
  closeButton: {
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
  closeButtonLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  closeButtonDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
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
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  cardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardIconLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  cardIconDark: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderColor: '#475569',
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0F172A',
  },
  cardTitleDark: {
    color: '#F9FAFB',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  cardSubtitleDark: {
    color: '#94A3B8',
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    padding: 20,
  },
  cardBodyDark: {
    borderTopColor: 'rgba(51, 65, 85, 0.6)',
  },
  settingContent: {
    // No gap property - using margins instead
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  sectionLabelDark: {
    color: '#94A3B8',
  },
  sectionLabelSpaced: {
    marginTop: 16,
  },
  stateList: {
    maxHeight: 300,
  },
  stateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  stateItemLight: {
    backgroundColor: '#F8FAFC',
  },
  stateItemDark: {
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
  },
  stateText: {
    fontSize: 14,
    color: '#334155',
  },
  stateTextDark: {
    color: '#CBD5E1',
  },
  stateTextSelected: {
    color: '#059669',
    fontWeight: '500',
  },
  lgaList: {
    paddingLeft: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  lgaItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  lgaItemLight: {
    backgroundColor: '#F1F5F9',
  },
  lgaItemDark: {
    backgroundColor: 'rgba(51, 65, 85, 0.2)',
  },
  lgaItemSelected: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  lgaText: {
    fontSize: 13,
    color: '#475569',
  },
  lgaTextDark: {
    color: '#94A3B8',
  },
  lgaTextSelected: {
    color: '#059669',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  actionButtonLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  actionButtonDark: {
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    borderColor: '#475569',
  },
  actionButtonDanger: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  actionButtonSpaced: {
    marginTop: 12,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#334155',
    marginLeft: 10,
  },
  actionButtonTextDark: {
    color: '#CBD5E1',
  },
  actionButtonTextDanger: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    marginLeft: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#334155',
  },
  toggleLabelDark: {
    color: '#CBD5E1',
  },
  toggleHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  toggleHintDark: {
    color: '#94A3B8',
  },
  toggleLabelContainer: {
    flex: 1,
  },
  reciterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  reciterItemLight: {
    backgroundColor: '#F8FAFC',
  },
  reciterItemDark: {
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
  },
  reciterItemSelected: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  reciterText: {
    fontSize: 14,
    color: '#334155',
    marginLeft: 12,
  },
  reciterTextDark: {
    color: '#CBD5E1',
  },
  reciterTextSelected: {
    color: '#059669',
    fontWeight: '500',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  themeOptionLight: {
    backgroundColor: '#F8FAFC',
  },
  themeOptionDark: {
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
  },
  themeOptionSelected: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  themeOptionText: {
    fontSize: 14,
    color: '#334155',
    marginLeft: 12,
  },
  themeOptionTextDark: {
    color: '#CBD5E1',
  },
  themeOptionTextSelected: {
    color: '#059669',
    fontWeight: '500',
  },
  formatRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  formatButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  formatButtonLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  formatButtonDark: {
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    borderColor: '#475569',
  },
  formatButtonSelected: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: '#059669',
  },
  formatButtonText: {
    fontSize: 14,
    color: '#334155',
  },
  formatButtonTextDark: {
    color: '#CBD5E1',
  },
  formatButtonTextSelected: {
    color: '#059669',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  infoLabelDark: {
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  infoValueDark: {
    color: '#CBD5E1',
  },
  chevronRotated: {
    transform: [{ rotate: '90deg' }],
  },
});
