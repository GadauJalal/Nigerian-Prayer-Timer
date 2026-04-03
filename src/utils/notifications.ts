import * as Notifications from 'expo-notifications';
import { PrayerTimeResult, calculatePrayerTimes } from './prayerTimes';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Track when app was last brought to foreground (for foreground behavior)
let lastForegroundTime = Date.now();

// Update foreground time when app state changes
export const updateForegroundTime = () => {
    lastForegroundTime = Date.now();
};

// Scheduling lock to prevent concurrent/duplicate scheduling
let isScheduling = false;
let pendingSchedule = false;

// Guard to ensure notification listener is only registered once
let listenerInitialized = false;

// Configure notification behavior - CRITICAL for showing notifications
// This handler controls how notifications are DISPLAYED when they fire
Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        const notificationType = notification.request.content.data?.type;
        const isPrayerNotification = notificationType === 'prayer-time';

        // FOREGROUND BEHAVIOR ONLY: Check if app was just opened
        // This is just for UX - don't interrupt user immediately on app open
        const timeSinceAppOpened = Date.now() - lastForegroundTime;
        const isAppJustOpened = timeSinceAppOpened < 10 * 1000; // 10 seconds

        if (isAppJustOpened && isPrayerNotification) {
            // App was just opened, show silently
            console.log(`⏱️ Silent notification - app just opened (${Math.floor(timeSinceAppOpened / 1000)}s ago)`);
            return {
                shouldShowAlert: false,
                shouldPlaySound: false,
                shouldSetBadge: true,
                shouldShowBanner: false,
                shouldShowList: true,
            };
        }

        // For all other cases - show normally with full alerts
        console.log(`✅ Showing notification: ${notification.request.content.title}`);
        return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
            ...(Platform.OS === 'android' && {
                priority: Notifications.AndroidNotificationPriority.MAX,
            }),
        };
    },
});

// Notification channel ID for Android
const PRAYER_CHANNEL_ID = 'prayer-notifications';

// Storage keys
const ERROR_LOG_KEY = 'notificationErrors';

// Minimum delay before scheduling a notification (prevents immediate firing)
const MINIMUM_SCHEDULE_DELAY_MS = 5 * 60 * 1000; // 5 minutes

// Adhan sound mapping
const ADHAN_SOUND_MAP: Record<string, string> = {
    'adhan': 'adhan.mp3',
    'adhan1': 'adhan1.mp3',
    'adhan2': 'adhan2.mp3',
    'adhan3': 'adhan3.mp3',
};

/**
 * Log errors to AsyncStorage for debugging
 */
const logError = async (context: string, error: any) => {
    try {
        const errorLog = {
            timestamp: new Date().toISOString(),
            context,
            error: error?.message || String(error),
            stack: error?.stack || 'No stack trace',
        };

        console.error(`❌ [${context}]`, error);

        // Store last 10 errors
        const existingLogsStr = await AsyncStorage.getItem(ERROR_LOG_KEY);
        const existingLogs = existingLogsStr ? JSON.parse(existingLogsStr) : [];
        existingLogs.unshift(errorLog);

        if (existingLogs.length > 10) {
            existingLogs.splice(10);
        }

        await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(existingLogs));
    } catch (logError) {
        console.error('Failed to log error:', logError);
    }
};

/**
 * Get error logs for debugging
 */
export const getErrorLogs = async () => {
    try {
        const logsStr = await AsyncStorage.getItem(ERROR_LOG_KEY);
        return logsStr ? JSON.parse(logsStr) : [];
    } catch (error) {
        console.error('Failed to get error logs:', error);
        return [];
    }
};

/**
 * Clear error logs
 */
export const clearErrorLogs = async () => {
    try {
        await AsyncStorage.removeItem(ERROR_LOG_KEY);
        console.log('✅ Error logs cleared');
    } catch (error) {
        console.error('Failed to clear error logs:', error);
    }
};

/**
 * Get platform-specific notification priority configuration
 */
const getPriorityConfig = () => {
    if (Platform.OS === 'android') {
        return {
            priority: Notifications.AndroidNotificationPriority.MAX,
        };
    }
    return {};
};

/**
 * Get platform-specific channel configuration for notifications
 */
const getChannelConfig = () => {
    if (Platform.OS === 'android') {
        return {
            channelId: PRAYER_CHANNEL_ID,
        };
    }
    return {};
};

/**
 * Get the selected adhan sound file
 */
const getSelectedAdhanSound = async (): Promise<string> => {
    try {
        const selectedAdhan = await AsyncStorage.getItem('selectedAdhan');
        if (selectedAdhan && ADHAN_SOUND_MAP[selectedAdhan]) {
            return ADHAN_SOUND_MAP[selectedAdhan];
        }
        return ADHAN_SOUND_MAP['adhan1']; // Default fallback
    } catch (error) {
        console.error('Failed to get selected adhan:', error);
        return ADHAN_SOUND_MAP['adhan1'];
    }
};

/**
 * Initialize notification channel for Android
 */
export const initializeNotificationChannel = async () => {
    if (Platform.OS === 'android') {
        try {
            const adhanSound = await getSelectedAdhanSound();
            await Notifications.setNotificationChannelAsync(PRAYER_CHANNEL_ID, {
                name: 'Prayer Time Notifications',
                importance: Notifications.AndroidImportance.MAX,
                sound: adhanSound,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#10B981',
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                bypassDnd: true,
                enableVibrate: true,
                showBadge: true,
                description: 'Notifications for prayer times with Adhan sound',
                audioAttributes: {
                    usage: Notifications.AndroidAudioUsage.NOTIFICATION,
                    contentType: Notifications.AndroidAudioContentType.SONIFICATION,
                },
            });
            console.log(`✅ Prayer notification channel created with Adhan sound: ${adhanSound}`);
        } catch (error) {
            await logError('initializeNotificationChannel', error);
        }
    } else {
        console.log('✅ iOS notification system initialized');
    }
};

/**
 * Update notification channel with new adhan sound
 * This recreates the channel by deleting and recreating it
 */
export const updateNotificationChannelSound = async (newAdhanId: string): Promise<boolean> => {
    try {
        console.log(`\n🔄 Updating notification channel with new adhan: ${newAdhanId}`);

        // Save the new adhan selection to AsyncStorage
        await AsyncStorage.setItem('selectedAdhan', newAdhanId);
        console.log(`✅ Saved new adhan selection: ${newAdhanId}`);

        if (Platform.OS === 'android') {
            // Step 1: Delete the existing channel
            console.log(`🗑️  Deleting old notification channel...`);
            await Notifications.deleteNotificationChannelAsync(PRAYER_CHANNEL_ID);

            // Step 2: Create new channel with the new sound
            const newAdhanSound = ADHAN_SOUND_MAP[newAdhanId] || ADHAN_SOUND_MAP['adhan1'];
            console.log(`🔔 Creating new channel with sound: ${newAdhanSound}`);

            await Notifications.setNotificationChannelAsync(PRAYER_CHANNEL_ID, {
                name: 'Prayer Time Notifications',
                importance: Notifications.AndroidImportance.MAX,
                sound: newAdhanSound,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#10B981',
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                bypassDnd: true,
                enableVibrate: true,
                showBadge: true,
                description: 'Notifications for prayer times with Adhan sound',
                audioAttributes: {
                    usage: Notifications.AndroidAudioUsage.NOTIFICATION,
                    contentType: Notifications.AndroidAudioContentType.SONIFICATION,
                },
            });

            console.log(`✅ Notification channel recreated with new sound`);
        } else {
            // iOS doesn't use channels, just save the preference
            console.log(`✅ iOS: Adhan preference saved (will apply to new notifications)`);
        }

        // Step 3: Reschedule all notifications with the new sound
        console.log(`🔄 Rescheduling notifications with new adhan sound...`);
        const rescheduled = await scheduleNext2Prayers();

        if (rescheduled) {
            console.log(`✅ Notifications rescheduled successfully with ${newAdhanId}`);
            console.log(`=========================================\n`);
            return true;
        } else {
            console.log(`⚠️  Failed to reschedule notifications`);
            return false;
        }
    } catch (error) {
        await logError('updateNotificationChannelSound', error);
        return false;
    }
};

/**
 * Get the next 2 upcoming prayer times
 */
const getNext2Prayers = async (): Promise<Array<{ name: string; time: Date; dateStr: string }>> => {
    try {
        // Get location and adjustments from AsyncStorage
        const locationStr = await AsyncStorage.getItem('userLocation');
        const adjustmentsStr = await AsyncStorage.getItem('userAdjustments');

        if (!locationStr) {
            throw new Error('No location data available');
        }

        const location = JSON.parse(locationStr);
        const adjustments = adjustmentsStr ? JSON.parse(adjustmentsStr) : {
            fajr: 0, sunrise: 0, zuhr: 0, asr: 0, maghrib: 0, isha: 0
        };

        const now = new Date();
        const result: Array<{ name: string; time: Date; dateStr: string }> = [];

        // Calculate prayer times for today and tomorrow
        for (let dayOffset = 0; dayOffset <= 1 && result.length < 2; dayOffset++) {
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + dayOffset);

            const times = calculatePrayerTimes(location.lat, location.lng, targetDate, adjustments);
            const dateStr = targetDate.toLocaleDateString();

            const prayers = [
                { name: 'Fajr', time: times.fajr },
                { name: 'Dhuhr', time: times.zuhr },
                { name: 'Asr', time: times.asr },
                { name: 'Maghrib', time: times.maghrib },
                { name: 'Isha', time: times.isha },
            ];

            for (const prayer of prayers) {
                const timeUntilPrayer = prayer.time.getTime() - now.getTime();

                // Only add prayers that are at least 5 minutes in the future
                if (timeUntilPrayer > MINIMUM_SCHEDULE_DELAY_MS) {
                    result.push({
                        name: prayer.name,
                        time: prayer.time,
                        dateStr: dateStr,
                    });

                    // Stop when we have 2 prayers
                    if (result.length === 2) {
                        break;
                    }
                }
            }
        }

        return result;
    } catch (error) {
        await logError('getNext2Prayers', error);
        return [];
    }
};

/**
 * Schedule a re-engagement notification for 14 days from now.
 * Each time the app opens, this resets the timer. If the user doesn't
 * open the app for 2 weeks, they get a reminder to open it so prayer
 * notifications keep working.
 */
export const scheduleReengagementNotification = async () => {
    try {
        // Cancel any existing re-engagement notification
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
            if (notif.content.data?.type === 'reengagement') {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }
        }

        // Schedule new one for 14 days from now
        const triggerDate = new Date();
        triggerDate.setDate(triggerDate.getDate() + 14);

        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Prayer Times Nigeria',
                body: 'Open the app to keep receiving prayer time notifications',
                sound: 'default',
                ...getPriorityConfig(),
                data: { type: 'reengagement' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
                ...getChannelConfig(),
            },
        });

        console.log(`✅ Re-engagement notification scheduled for ${triggerDate.toLocaleDateString()}`);
    } catch (error) {
        await logError('scheduleReengagementNotification', error);
    }
};

/**
 * Schedule the next 2 upcoming prayer notifications
 * This is the core function of the simplified notification system
 */
export const scheduleNext2Prayers = async (): Promise<boolean> => {
    // If already scheduling, mark as pending and skip
    // This prevents concurrent calls from creating duplicate notifications
    if (isScheduling) {
        console.log('⏳ Scheduling already in progress, queuing...');
        pendingSchedule = true;
        return false;
    }

    isScheduling = true;
    pendingSchedule = false;

    try {
        console.log('\n🔔 ===== SCHEDULING NEXT 2 PRAYERS =====');
        console.log(`🕐 Current time: ${new Date().toLocaleString()}`);

        // Cancel only prayer notifications (preserve re-engagement notification)
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
            if (notif.content.data?.type !== 'reengagement') {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }
        }
        console.log('🗑️  Cleared prayer notifications');

        // Get next 2 prayers
        const prayers = await getNext2Prayers();

        if (prayers.length === 0) {
            console.log('⚠️  No upcoming prayers found to schedule');
            return false;
        }

        console.log(`📋 Found ${prayers.length} upcoming prayer(s) to schedule\n`);

        // Get location for notification body
        const locationStr = await AsyncStorage.getItem('userLocation');
        let locationText = '';
        if (locationStr) {
            const location = JSON.parse(locationStr);
            locationText = location.name || '';
        }

        // Get the selected adhan sound
        const adhanSound = await getSelectedAdhanSound();
        console.log(`🔊 Using adhan sound: ${adhanSound}`);

        let scheduledCount = 0;

        // Schedule each prayer
        for (let i = 0; i < prayers.length; i++) {
            const prayer = prayers[i];
            const timeString = prayer.time.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });

            const minutesAway = Math.floor((prayer.time.getTime() - Date.now()) / 60000);
            console.log(`✅ Scheduling ${prayer.name} for ${timeString} (${minutesAway} minutes away)`);

            // Schedule notification
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `It's time for ${prayer.name}`,
                    body: `${timeString} - ${locationText}`,
                    sound: adhanSound,
                    ...getPriorityConfig(),
                    categoryIdentifier: 'prayer-time',
                    ...(Platform.OS === 'android' && {
                        sticky: false,
                        autoDismiss: true,
                    }),
                    data: {
                        prayerName: prayer.name,
                        type: 'prayer-time',
                        date: prayer.dateStr,
                        position: i + 1, // 1 for first prayer, 2 for second
                        scheduledAt: Date.now(),
                    },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: prayer.time,
                    ...getChannelConfig(),
                },
            });

            if (notificationId) {
                scheduledCount++;
            } else {
                console.error(`❌ Failed to schedule ${prayer.name}`);
            }
        }

        console.log(`\n📊 Successfully scheduled ${scheduledCount} prayer notification(s)`);
        console.log('=========================================\n');

        return scheduledCount > 0;
    } catch (error) {
        await logError('scheduleNext2Prayers', error);
        return false;
    } finally {
        isScheduling = false;

        // If another call came in while we were scheduling, run once more
        if (pendingSchedule) {
            console.log('🔄 Running queued schedule request...');
            pendingSchedule = false;
            return scheduleNext2Prayers();
        }
    }
};

/**
 * Initialize the notification listener for auto-rescheduling
 * This creates a self-sustaining cycle where each notification triggers scheduling of the next 2
 */
export const initializeNotificationListener = () => {
    // Prevent registering multiple listeners (e.g. if called more than once)
    if (listenerInitialized) {
        console.log('👂 Notification listener already initialized, skipping');
        return;
    }
    listenerInitialized = true;

    // Listen for when notifications are received (fires in both foreground and background)
    Notifications.addNotificationReceivedListener(async (notification) => {
        const notificationType = notification.request.content.data?.type;
        const prayerName = notification.request.content.data?.prayerName;

        if (notificationType === 'prayer-time') {
            console.log(`\n🕌 Prayer notification received: ${prayerName}`);
            console.log('🔄 Auto-scheduling next 2 prayers...');

            // Wait a moment before rescheduling
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Schedule the next 2 prayers (lock inside prevents duplicates)
            const success = await scheduleNext2Prayers();

            if (success) {
                console.log('✅ Auto-reschedule completed successfully');
            } else {
                console.log('⚠️  Auto-reschedule failed, will retry on app open');
            }
        }
    });

    console.log('👂 Notification listener initialized for auto-rescheduling');
};

/**
 * Ensure notifications are properly scheduled (fallback check)
 * Call this when the app opens to ensure we always have 2 notifications scheduled
 */
export const ensureNotificationsScheduled = async () => {
    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const now = new Date();

        // Filter for future prayer notifications only (exclude re-engagement)
        const futureNotifications = scheduled.filter(notif => {
            if (notif.content.data?.type === 'reengagement') return false;
            const trigger = notif.trigger as any;
            if (trigger.value) {
                const triggerDate = new Date(trigger.value);
                return triggerDate > now;
            }
            return false;
        });

        console.log(`\n🔍 Notification Health Check`);
        console.log(`📋 Total scheduled: ${scheduled.length}`);
        console.log(`⏰ Future notifications: ${futureNotifications.length}`);

        // If we don't have exactly 2 future notifications, reschedule
        if (futureNotifications.length !== 2) {
            console.log(`⚠️  Expected 2 notifications, found ${futureNotifications.length}`);
            console.log('🔄 Rescheduling to ensure 2 notifications...');

            const success = await scheduleNext2Prayers();

            if (success) {
                console.log('✅ Notifications restored to healthy state');
            }

            return success;
        } else {
            console.log('✅ Notifications are healthy (2 scheduled)\n');
            return true;
        }
    } catch (error) {
        await logError('ensureNotificationsScheduled', error);
        return false;
    }
};

/**
 * Main function to schedule prayer notifications
 * Simplified to use the 2-prayer system
 */
export const schedulePrayerNotifications = async (prayerTimes: PrayerTimeResult) => {
    try {
        console.log('📱 Initializing prayer notification system...');

        // Simply schedule the next 2 prayers
        const success = await scheduleNext2Prayers();

        if (success) {
            console.log('✅ Prayer notifications initialized successfully');
        } else {
            console.log('⚠️  Failed to initialize prayer notifications');
        }

        return success;
    } catch (error) {
        await logError('schedulePrayerNotifications', error);
        return false;
    }
};

/**
 * Request notification permissions and initialize
 */
export const requestNotificationPermissions = async () => {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus === 'granted') {
            await initializeNotificationChannel();
            initializeNotificationListener(); // Set up auto-reschedule listener

            console.log('✅ Notification permissions granted and system initialized');
            return true;
        } else {
            console.log('❌ Notification permissions denied');
            return false;
        }
    } catch (error) {
        await logError('requestNotificationPermissions', error);
        return false;
    }
};

/**
 * Send a test notification immediately
 */
export const sendTestNotification = async (delaySeconds: number = 5) => {
    try {
        const locationStr = await AsyncStorage.getItem('userLocation');
        let locationText = '';
        if (locationStr) {
            const location = JSON.parse(locationStr);
            locationText = location.name || '';
        }

        const adhanSound = await getSelectedAdhanSound();

        const testTime = new Date();
        testTime.setSeconds(testTime.getSeconds() + delaySeconds);
        const timeString = testTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        const prayerTestId = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'It\'s time for Fajr',
                body: `${timeString} - ${locationText}`,
                sound: adhanSound,
                ...getPriorityConfig(),
                categoryIdentifier: 'prayer-time',
                ...(Platform.OS === 'android' && {
                    sticky: false,
                    autoDismiss: true,
                }),
                data: {
                    prayerName: 'Fajr',
                    type: 'test-notification',
                    scheduledAt: Date.now(),
                },
            },
            trigger: {
                seconds: delaySeconds,
                ...getChannelConfig(),
            },
        });

        console.log(`🧪 Test notification scheduled! Will appear in ${delaySeconds} seconds with ${adhanSound}`);
        return { prayerTestId };
    } catch (error) {
        await logError('sendTestNotification', error);
        return null;
    }
};

/**
 * Get all currently scheduled notifications (for debugging)
 */
export const debugScheduledNotifications = async () => {
    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const now = new Date();
        console.log('\n📋 ===== SCHEDULED NOTIFICATIONS DEBUG =====');
        console.log(`Total scheduled: ${scheduled.length}`);
        console.log(`Current time: ${now.toLocaleString()}\n`);

        scheduled.forEach((notif, index) => {
            const trigger = notif.trigger as any;
            const triggerDate = trigger.value ? new Date(trigger.value) : null;
            const timeUntil = triggerDate ? triggerDate.getTime() - now.getTime() : null;
            const hoursUntil = timeUntil ? Math.floor(timeUntil / (1000 * 60 * 60)) : null;
            const minutesUntil = timeUntil ? Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60)) : null;

            console.log(`${index + 1}. ${notif.content.title}`);
            console.log(`   📍 Scheduled for: ${triggerDate?.toLocaleString() || 'Unknown'}`);
            if (hoursUntil !== null && minutesUntil !== null) {
                if (timeUntil! > 0) {
                    console.log(`   ⏰ Fires in: ${hoursUntil}h ${minutesUntil}m`);
                } else {
                    console.log(`   ⚠️  PAST TIME (should have fired already!)`);
                }
            }

            const position = notif.content.data?.position;
            if (position) {
                console.log(`   🔢 Position: ${position} of 2`);
            }

            console.log('');
        });

        console.log('==========================================\n');
        return scheduled;
    } catch (error) {
        await logError('debugScheduledNotifications', error);
        return [];
    }
};

/**
 * Force reschedule notifications (manual trigger)
 */
export const forceReschedule = async () => {
    try {
        console.log('🔄 Force rescheduling notifications...');
        const success = await scheduleNext2Prayers();

        if (success) {
            console.log('✅ Force reschedule completed');
        } else {
            console.log('⚠️  Force reschedule failed');
        }

        return success;
    } catch (error) {
        await logError('forceReschedule', error);
        return false;
    }
};

/**
 * Get notification health status (for UI display)
 */
export const getNotificationHealthStatus = async () => {
    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const errorLogs = await getErrorLogs();

        const now = new Date();
        const upcomingNotifications = scheduled.filter(notif => {
            const trigger = notif.trigger as any;
            if (trigger.value) {
                const triggerDate = new Date(trigger.value);
                return triggerDate > now;
            }
            return false;
        });

        // Healthy if we have exactly 2 upcoming notifications and few errors
        const isHealthy = upcomingNotifications.length === 2 && errorLogs.length < 3;

        return {
            totalScheduled: scheduled.length,
            upcomingNotifications: upcomingNotifications.length,
            expectedCount: 2,
            recentErrors: errorLogs.length,
            isHealthy: isHealthy,
            status: isHealthy ? 'Healthy' : upcomingNotifications.length === 0 ? 'No notifications' : `Expected 2, have ${upcomingNotifications.length}`,
        };
    } catch (error) {
        await logError('getNotificationHealthStatus', error);
        return null;
    }
};