import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { City, NIGERIA_LOCATIONS } from '../data/nigeria_locations';
import { calculatePrayerTimes, PrayerTimeResult } from '../utils/prayerTimes';
import { schedulePrayerNotifications, requestNotificationPermissions, initializeNotificationChannel } from '../utils/notifications';

interface Adjustments {
    [key: string]: number;
    fajr: number;
    sunrise: number;
    zuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
}

interface AppContextType {
    location: City | null;
    setLocation: (city: City) => void;
    prayerTimes: PrayerTimeResult | null;
    loading: boolean;
    refreshPrayerTimes: () => void;
    adjustments: Adjustments;
    setAdjustments: (adj: Adjustments) => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    hasCompletedOnboarding: boolean;
    completeOnboarding: () => void;
    selectedAdhan: string;
    setSelectedAdhan: (adhan: string) => void;
    hijriAdjustment: number;
    setHijriAdjustment: (adj: number) => void;
}

const defaultAdjustments: Adjustments = {
    fajr: 0,
    sunrise: 0,
    zuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [location, setLocationState] = useState<City | null>(null);
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimeResult | null>(null);
    const [adjustments, setAdjustmentsState] = useState<Adjustments>(defaultAdjustments);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [loading, setLoading] = useState(true);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
    const [selectedAdhan, setSelectedAdhanState] = useState<string>('adhan1');
    const [hijriAdjustment, setHijriAdjustmentState] = useState<number>(0);

    // Use ref to track last scheduled config to prevent duplicate scheduling
    const lastScheduledConfig = useRef<string>('');

    useEffect(() => {
        loadSettings();
        requestNotificationPermissions();

        return () => {
            // Cleanup if needed
        };
    }, []);

    useEffect(() => {
        // CRITICAL: Only schedule notifications AFTER onboarding is complete
        // This prevents scheduling with default location before user selects their city
        if (location && hasCompletedOnboarding) {
            refreshPrayerTimes();
            saveSettings();

            // Create a unique key based on location and adjustments
            const configKey = JSON.stringify({
                location: location.name,
                adjustments
            });

            // Only schedule if configuration has actually changed
            if (configKey !== lastScheduledConfig.current) {
                lastScheduledConfig.current = configKey;
                const times = calculatePrayerTimes(location.lat, location.lng, new Date(), adjustments);

                // Delay scheduling by 2 seconds to ensure app is fully loaded
                // This prevents notifications from firing immediately when app is minimized
                setTimeout(() => {
                    console.log('📍 Scheduling notifications for:', location.name);
                    schedulePrayerNotifications(times);
                }, 2000);
            }
        }
    }, [location, adjustments, hasCompletedOnboarding, selectedAdhan]); // Added hasCompletedOnboarding and selectedAdhan dependencies

    const loadSettings = async () => {
        try {
            const savedLocation = await AsyncStorage.getItem('userLocation');
            const savedAdjustments = await AsyncStorage.getItem('userAdjustments');
            const savedTheme = await AsyncStorage.getItem('userTheme');
            const savedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
            const savedAdhan = await AsyncStorage.getItem('selectedAdhan');

            if (savedLocation) {
                setLocationState(JSON.parse(savedLocation));
            } else {
                // Set default location (Lagos) for display purposes only
                // Notifications won't schedule until hasCompletedOnboarding is true
                const defaultLocation = NIGERIA_LOCATIONS.find(s => s.name === 'Lagos')?.cities[0];
                if (defaultLocation) setLocationState(defaultLocation);
            }

            if (savedAdjustments) {
                setAdjustmentsState(JSON.parse(savedAdjustments));
            }

            if (savedTheme) {
                setTheme(savedTheme as 'light' | 'dark');
            }

            if (savedOnboarding) {
                setHasCompletedOnboarding(savedOnboarding === 'true');
            }

            if (savedAdhan) {
                setSelectedAdhanState(savedAdhan);
            }

            const savedHijriAdj = await AsyncStorage.getItem('hijriAdjustment');
            if (savedHijriAdj) {
                setHijriAdjustmentState(parseInt(savedHijriAdj, 10) || 0);
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            if (location) {
                await AsyncStorage.setItem('userLocation', JSON.stringify(location));
            }
            await AsyncStorage.setItem('userAdjustments', JSON.stringify(adjustments));
            await AsyncStorage.setItem('userTheme', theme);
            await AsyncStorage.setItem('selectedAdhan', selectedAdhan);
        } catch (e) {
            console.error('Failed to save settings', e);
        }
    };

    const setLocation = (city: City) => {
        setLocationState(city);
    };

    const setAdjustments = (adj: Adjustments) => {
        setAdjustmentsState(adj);
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const setSelectedAdhan = async (adhan: string) => {
        setSelectedAdhanState(adhan);
        // Reinitialize notification channel with new sound (for Android)
        await initializeNotificationChannel();
    };

    const setHijriAdjustment = async (adj: number) => {
        const clamped = Math.max(-3, Math.min(3, adj));
        setHijriAdjustmentState(clamped);
        await AsyncStorage.setItem('hijriAdjustment', clamped.toString());
    };

    const refreshPrayerTimes = () => {
        if (location) {
            const times = calculatePrayerTimes(location.lat, location.lng, new Date(), adjustments);
            setPrayerTimes(times);
        }
    };

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
            setHasCompletedOnboarding(true);
        } catch (e) {
            console.error('Failed to save onboarding status', e);
        }
    };

    return (
        <AppContext.Provider value={{ location, setLocation, prayerTimes, loading, refreshPrayerTimes, adjustments, setAdjustments, theme, toggleTheme, hasCompletedOnboarding, completeOnboarding, selectedAdhan, setSelectedAdhan, hijriAdjustment, setHijriAdjustment }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export const useAppContext = useApp;
