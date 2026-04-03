import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/context/AppContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ensureNotificationsScheduled, updateForegroundTime, scheduleReengagementNotification } from './src/utils/notifications';

export default function App() {
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Listen for user tapping on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      // Handle notification tap silently
      // You can navigate to a specific screen here if needed
    });

    // Listen for app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        console.log('📱 App came to foreground - checking notification health...');
        updateForegroundTime(); // Update foreground time for notification handler

        // Fallback check: Ensure we have 2 notifications scheduled
        // Use longer delay to avoid racing with notification-received listener
        setTimeout(() => {
          ensureNotificationsScheduled();
          scheduleReengagementNotification();
        }, 3000);
      }
      appState.current = nextAppState;
    });

    // Schedule re-engagement notification on first load
    // NOTE: Initial prayer scheduling is handled by AppContext when location loads,
    // so we do NOT call ensureNotificationsScheduled here to avoid racing with it.
    setTimeout(() => {
      scheduleReengagementNotification();
    }, 2000);

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <ThemeProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </ThemeProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
