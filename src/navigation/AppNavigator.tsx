import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import TimetableScreen from '../screens/TimetableScreen';
import QiblaScreen from '../screens/QiblaScreen';
import LocationScreen from '../screens/LocationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { BottomNavigation } from '../components/BottomNavigation';
import { COLORS } from '../constants/theme';
import { ThemeProvider, useThemeContext } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomTabBar({ state, navigation }: any) {
    const { isDarkMode } = useThemeContext();

    const handleNavigate = (screenName: string) => {
        navigation.navigate(screenName);
    };

    const currentScreen = state.routes[state.index].name as 'Home' | 'Qibla' | 'Timetable';

    return (
        <BottomNavigation
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            isDarkMode={isDarkMode}
        />
    );
}

function TabNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Qibla" component={QiblaScreen} />
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Timetable" component={TimetableScreen} />
        </Tab.Navigator>
    );
}

function RootNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen
                name="Location"
                component={LocationScreen}
                options={{
                    headerShown: true,
                    title: 'Select Location',
                    headerTintColor: COLORS.primary,
                }}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                }}
            />
        </Stack.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <NavigationContainer>
                    <RootNavigator />
                </NavigationContainer>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
