import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { City, NIGERIA_LOCATIONS } from '../data/nigeria_locations';
import { calculatePrayerTimes, PrayerTimeResult } from '../utils/prayerTimes';
import { schedulePrayerNotifications, requestNotificationPermissions } from '../utils/notifications';

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

    // Use ref to track last scheduled config to prevent duplicate scheduling
    const lastScheduledConfig = useRef<string>('');

    useEffect(() => {
        loadSettings();
        requestNotificationPermissions();
    }, []);

    useEffect(() => {
        if (location) {
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
                // Schedule in background - the 1-minute delay in scheduleMultipleDays prevents immediate notifications
                schedulePrayerNotifications(times);
            }
        }
    }, [location, adjustments]); // Removed 'theme' to prevent rescheduling on theme changes

    const loadSettings = async () => {
        try {
            const savedLocation = await AsyncStorage.getItem('userLocation');
            const savedAdjustments = await AsyncStorage.getItem('userAdjustments');
            const savedTheme = await AsyncStorage.getItem('userTheme');

            if (savedLocation) {
                setLocationState(JSON.parse(savedLocation));
            } else {
                const defaultLocation = NIGERIA_LOCATIONS.find(s => s.name === 'Lagos')?.cities[0];
                if (defaultLocation) setLocationState(defaultLocation);
            }

            if (savedAdjustments) {
                setAdjustmentsState(JSON.parse(savedAdjustments));
            }

            if (savedTheme) {
                setTheme(savedTheme as 'light' | 'dark');
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

    const refreshPrayerTimes = () => {
        if (location) {
            const times = calculatePrayerTimes(location.lat, location.lng, new Date(), adjustments);
            setPrayerTimes(times);
        }
    };

    return (
        <AppContext.Provider value={{ location, setLocation, prayerTimes, loading, refreshPrayerTimes, adjustments, setAdjustments, theme, toggleTheme }}>
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
