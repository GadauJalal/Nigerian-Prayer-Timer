import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/context/AppContext';
import { ensureNotificationsScheduled } from './src/utils/notifications';

export default function App() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
      const { prayerName, type } = notification.request.content.data || {};

      if (type === 'prayer-time') {
        console.log(`${prayerName} prayer time notification received`);
      } else if (type === 'midnight-reschedule') {
        console.log('Midnight reschedule trigger received - notifications will be refreshed');
        // Trigger reschedule to ensure tomorrow's prayers are scheduled
        ensureNotificationsScheduled();
      }
    });

    // Listen for user tapping on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      const { prayerName, type } = response.notification.request.content.data || {};

      if (type === 'prayer-time') {
        console.log(`User tapped on ${prayerName} prayer notification`);
        // You can navigate to a specific screen here if needed
        // For example: navigation.navigate('Timetable');
      } else if (type === 'midnight-reschedule') {
        console.log('Midnight reschedule trigger tapped - notifications refreshed');
      }
    });

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
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
