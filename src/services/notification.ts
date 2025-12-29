import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Prayer names
export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

// Notification channel ID for Android
const PRAYER_CHANNEL_ID = 'prayer-notifications';

/**
 * Initialize notification permissions and channels
 */
export async function initializeNotifications(): Promise<boolean> {
  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    // Create notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(PRAYER_CHANNEL_ID, {
        name: 'Prayer Time Notifications',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'adhan.mp3', // Custom sound file
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        enableVibrate: true,
        showBadge: true,
        description: 'Notifications for prayer times with Adhan sound',
      });
    }

    console.log('Notifications initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
    return false;
  }
}

/**
 * Schedule prayer time notification
 */
export async function schedulePrayerNotification(
  prayerName: PrayerName,
  prayerTime: Date
): Promise<string | null> {
  try {
    const now = new Date();

    // If prayer time has passed today, schedule for tomorrow
    let triggerTime = new Date(prayerTime);
    if (triggerTime <= now) {
      triggerTime.setDate(triggerTime.getDate() + 1);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${prayerName} Prayer Time`,
        body: `It's time for ${prayerName} prayer`,
        sound: 'adhan.mp3',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250],
        data: {
          prayerName,
          type: 'prayer-time',
        },
        badge: 1,
      },
      trigger: {
        date: triggerTime,
        channelId: PRAYER_CHANNEL_ID,
      },
    });

    console.log(`Scheduled ${prayerName} notification for ${triggerTime.toLocaleString()}`);
    return notificationId;
  } catch (error) {
    console.error(`Failed to schedule ${prayerName} notification:`, error);
    return null;
  }
}

/**
 * Schedule all prayer notifications for the day
 */
export async function scheduleAllPrayerNotifications(
  prayerTimes: Record<PrayerName, Date>
): Promise<void> {
  try {
    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule each prayer
    const prayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    for (const prayer of prayers) {
      const prayerTime = prayerTimes[prayer];
      if (prayerTime) {
        await schedulePrayerNotification(prayer, prayerTime);
      }
    }

    console.log('All prayer notifications scheduled');
  } catch (error) {
    console.error('Failed to schedule all prayer notifications:', error);
  }
}

/**
 * Cancel all scheduled prayer notifications
 */
export async function cancelAllPrayerNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All prayer notifications cancelled');
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('Failed to get scheduled notifications:', error);
    return [];
  }
}

/**
 * Play Adhan sound
 */
export async function playAdhanSound(): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/adhan.mp3'),
      { shouldPlay: true }
    );

    await sound.playAsync();

    // Unload sound after it finishes
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.error('Failed to play Adhan sound:', error);
  }
}

/**
 * Handle notification tap/press
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Handle notification received while app is foregrounded
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}
