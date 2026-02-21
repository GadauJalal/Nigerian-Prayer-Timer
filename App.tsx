import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/context/AppContext';
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
        setTimeout(() => {
          ensureNotificationsScheduled();
          scheduleReengagementNotification(); // Reset 2-week reminder
        }, 1000); // Small delay to let app fully initialize
      }
      appState.current = nextAppState;
    });

    // Initial check when app first loads
    setTimeout(() => {
      ensureNotificationsScheduled();
      scheduleReengagementNotification(); // Reset 2-week reminder
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
        <StatusBar style="auto" />
        <AppNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}
