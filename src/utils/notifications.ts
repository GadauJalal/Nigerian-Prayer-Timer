import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { PrayerTimeResult, calculatePrayerTimes } from './prayerTimes';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior - CRITICAL for showing notifications
// NOTE: This only affects how notifications are displayed when app is in FOREGROUND
// Background notifications are handled by the OS using channel settings
Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        // Check if this is a test notification or a scheduled prayer notification
        const notificationType = notification.request.content.data?.type;
        const isTestNotification = notificationType === 'test-notification';
        const isPrayerNotification = notificationType === 'prayer-time';

        // For test notifications, always show them (for debugging purposes)
        if (isTestNotification) {
            return {
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true, // iOS: Show banner in foreground
                shouldShowList: true, // iOS: Add to notification list in foreground
                ...(Platform.OS === 'android' && {
                    priority: Notifications.AndroidNotificationPriority.MAX,
                }),
            };
        }

        // For prayer notifications, only show them when they're actually triggered (not when app is in foreground)
        // For other notifications (like midnight reschedule), don't show at all in foreground
        return {
            shouldShowAlert: false, // Don't show alerts in foreground - let system handle at scheduled time
            shouldPlaySound: false, // Don't play sound in foreground
            shouldSetBadge: true, // Still update badge count
            shouldShowBanner: false, // iOS: Don't show banner in foreground
            shouldShowList: false, // iOS: Don't add to notification list in foreground
            // Priority is Android-specific
            ...(Platform.OS === 'android' && {
                priority: Notifications.AndroidNotificationPriority.MAX,
            }),
        };
    },
});

// Notification channel ID for Android
const PRAYER_CHANNEL_ID = 'prayer-notifications';

// Background task name for daily rescheduling
const DAILY_RESCHEDULE_TASK = 'DAILY_PRAYER_RESCHEDULE';

// Storage keys
const LAST_SCHEDULE_DATE_KEY = 'lastScheduleDate';

// iOS has a limit of 64 scheduled notifications
// With 5 prayers per day, we can schedule up to 12 days (60 notifications)
// Reserve 4 slots for midnight triggers and other system notifications
const MAX_IOS_NOTIFICATIONS = 64;
const PRAYERS_PER_DAY = 5;
const MAX_DAYS_TO_SCHEDULE = Math.floor((MAX_IOS_NOTIFICATIONS - 4) / PRAYERS_PER_DAY); // 12 days

/**
 * Get number of days to schedule ahead based on platform
 * iOS: Schedule far ahead (7-12 days) since background fetch is unreliable
 * Android: Schedule 2 days ahead since background tasks work reliably
 */
const getDaysToSchedule = (): number => {
    if (Platform.OS === 'ios') {
        // iOS: Schedule 7 days ahead for reliability
        // User needs to open app weekly to maintain notifications
        return 7;
    } else {
        // Android: Schedule 2 days ahead (background task handles the rest)
        return 2;
    }
};

/**
 * Get platform-specific notification priority configuration
 * Android uses explicit priority levels, iOS uses system-managed priorities
 */
const getPriorityConfig = () => {
    if (Platform.OS === 'android') {
        return {
            priority: Notifications.AndroidNotificationPriority.MAX,
        };
    }
    return {}; // iOS uses system priorities, no manual configuration needed
};

/**
 * Get platform-specific channel configuration for notifications
 * Android requires channelId, iOS doesn't use channels
 */
const getChannelConfig = () => {
    if (Platform.OS === 'android') {
        return {
            channelId: PRAYER_CHANNEL_ID,
        };
    }
    return {}; // iOS doesn't use notification channels
};

/**
 * Initialize notification channel for Android
 * iOS doesn't need channels - this is Android-only
 */
export const initializeNotificationChannel = async () => {
    if (Platform.OS === 'android') {
        try {
            // Main prayer time notification channel with Adhan sound
            await Notifications.setNotificationChannelAsync(PRAYER_CHANNEL_ID, {
                name: 'Prayer Time Notifications',
                importance: Notifications.AndroidImportance.MAX,
                sound: 'adhan.mp3',
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
            console.log('✅ Prayer notification channel created with Adhan sound');
        } catch (error) {
            console.error('❌ Failed to create notification channel:', error);
        }
    } else {
        // iOS doesn't need channels
        console.log('✅ iOS notification system initialized (no channels needed)');
    }
};

/**
 * Background task that reschedules notifications daily
 * This runs even when the app is closed to ensure notifications continue indefinitely
 * Runs silently without console output
 */
TaskManager.defineTask(DAILY_RESCHEDULE_TASK, async () => {
    try {
        // Load saved location and adjustments from storage
        const locationStr = await AsyncStorage.getItem('userLocation');
        const adjustmentsStr = await AsyncStorage.getItem('userAdjustments');

        if (!locationStr) {
            return BackgroundFetch.BackgroundFetchResult.Failed;
        }

        const location = JSON.parse(locationStr);
        const adjustments = adjustmentsStr ? JSON.parse(adjustmentsStr) : {
            fajr: 0, sunrise: 0, zuhr: 0, asr: 0, maghrib: 0, isha: 0
        };

        // Calculate prayer times for multiple days based on platform
        const now = new Date();
        const daysToSchedule = getDaysToSchedule();
        const daysArray: Array<{ date: Date; times: PrayerTimeResult }> = [];

        for (let i = 0; i < daysToSchedule; i++) {
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + i);

            const times = calculatePrayerTimes(location.lat, location.lng, targetDate, adjustments);
            daysArray.push({ date: targetDate, times });
        }

        // Cancel existing notifications before scheduling new ones
        await Notifications.cancelAllScheduledNotificationsAsync();

        // Schedule notifications
        await scheduleMultipleDays(daysArray);

        // Update last schedule date
        await AsyncStorage.setItem(LAST_SCHEDULE_DATE_KEY, now.toISOString());

        // Reschedule midnight trigger (Android only)
        if (Platform.OS === 'android') {
            await scheduleMidnightReschedule();
        }

        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
        // Even if task fails, return NewData to prevent iOS from penalizing the app
        // and reducing future background fetch opportunities
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

/**
 * Register the background task for daily rescheduling
 * This ensures notifications continue working indefinitely
 */
export const registerDailyRescheduleTask = async () => {
    try {
        // Check if task is already registered
        const isRegistered = await TaskManager.isTaskRegisteredAsync(DAILY_RESCHEDULE_TASK);

        if (isRegistered) {
            await BackgroundFetch.unregisterTaskAsync(DAILY_RESCHEDULE_TASK);
        }

        // Platform-specific configuration
        const taskOptions: any = {
            minimumInterval: 60 * 60, // Check every hour (Android minimum is 15 minutes)
        };

        // Android-specific options
        if (Platform.OS === 'android') {
            taskOptions.stopOnTerminate = false; // Continue after app is closed
            taskOptions.startOnBoot = true; // Start after device reboot
        }

        // iOS handles these automatically via system

        // Register the task to run every hour
        await BackgroundFetch.registerTaskAsync(DAILY_RESCHEDULE_TASK, taskOptions);

        const platform = Platform.OS === 'ios' ? 'iOS' : 'Android';
        console.log(`✅ Daily reschedule background task registered for ${platform}`);

        // Also schedule a midnight notification to trigger rescheduling
        await scheduleMidnightReschedule();

        return true;
    } catch (error) {
        console.error('❌ Failed to register background task:', error);
        return false;
    }
};

/**
 * Schedule a notification at midnight to trigger rescheduling
 * This is a backup mechanism to ensure notifications are refreshed daily
 * Runs silently without console output
 */
const scheduleMidnightReschedule = async () => {
    try {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0); // Next midnight

        // Schedule a silent notification that will trigger rescheduling
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Prayer Times Updated',
                body: 'Notifications refreshed for the new day',
                data: { type: 'midnight-reschedule' },
            },
            trigger: {
                date: midnight,
            },
        });
    } catch (error) {
        // Silently fail
    }
};

/**
 * Format time remaining as countdown string
 */
const formatCountdown = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `in ${hours}h ${minutes}m`;
    }
    return `in ${minutes}m`;
};

/**
 * Helper function to schedule notifications for multiple days
 * This ensures notifications continue working even after all today's prayers have passed
 * Runs silently in the background without console output
 */
const scheduleMultipleDays = async (days: Array<{ date: Date; times: PrayerTimeResult }>) => {
    const now = new Date();
    let scheduledCount = 0;

    for (const { date, times } of days) {
        const dateStr = date.toLocaleDateString();

        const prayers = [
            { name: 'Fajr', time: times.fajr, icon: '🌙' },
            { name: 'Dhuhr', time: times.zuhr, icon: '☀️' },
            { name: 'Asr', time: times.asr, icon: '🌤️' },
            { name: 'Maghrib', time: times.maghrib, icon: '🌅' },
            { name: 'Isha', time: times.isha, icon: '🌃' },
        ];

        for (const prayer of prayers) {
            // Only schedule if the prayer time is at least 1 minute in the future
            // This prevents notifications from firing immediately
            const timeUntilPrayer = prayer.time.getTime() - now.getTime();
            const minimumDelay = 60 * 1000; // 1 minute in milliseconds

            if (timeUntilPrayer > minimumDelay) {
                try {
                    // Schedule prayer time notification with Adhan sound
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: `${prayer.icon} ${prayer.name} Prayer Time`,
                            body: `It's time for ${prayer.name} prayer`,
                            sound: 'adhan.mp3',
                            ...getPriorityConfig(), // Platform-specific priority
                            categoryIdentifier: 'prayer-time',
                            // sticky and autoDismiss are Android-specific
                            ...(Platform.OS === 'android' && {
                                sticky: false,
                                autoDismiss: true,
                            }),
                            data: {
                                prayerName: prayer.name,
                                type: 'prayer-time',
                                icon: prayer.icon,
                                date: dateStr,
                            },
                        },
                        trigger: {
                            date: prayer.time,
                            ...getChannelConfig(), // Platform-specific channel (Android only)
                        },
                    });

                    scheduledCount++;
                } catch (scheduleError) {
                    // Silently fail - don't spam console
                }
            }
        }
    }

    return scheduledCount;
};

/**
 * Schedule prayer notifications for all prayer times
 * iOS: Schedules 7 days ahead (user opens app weekly)
 * Android: Schedules 2 days ahead (background task handles rest)
 * Runs silently in the background
 */
export const schedulePrayerNotifications = async (prayerTimes: PrayerTimeResult) => {
    try {
        // Cancel all existing notifications first to avoid duplicates
        await Notifications.cancelAllScheduledNotificationsAsync();

        const now = new Date();
        const daysToSchedule = getDaysToSchedule();

        // Load location and adjustments
        const locationStr = await AsyncStorage.getItem('userLocation');
        const adjustmentsStr = await AsyncStorage.getItem('userAdjustments');

        if (!locationStr) {
            return;
        }

        const location = JSON.parse(locationStr);
        const adjustments = adjustmentsStr ? JSON.parse(adjustmentsStr) : {
            fajr: 0, sunrise: 0, zuhr: 0, asr: 0, maghrib: 0, isha: 0
        };

        // Calculate prayer times for multiple days
        const daysArray: Array<{ date: Date; times: PrayerTimeResult }> = [];

        for (let i = 0; i < daysToSchedule; i++) {
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + i);

            const times = i === 0
                ? prayerTimes // Use provided times for today
                : calculatePrayerTimes(location.lat, location.lng, targetDate, adjustments);

            daysArray.push({ date: targetDate, times });
        }

        await scheduleMultipleDays(daysArray);

        // Save the last schedule date
        await AsyncStorage.setItem(LAST_SCHEDULE_DATE_KEY, now.toISOString());

        // Schedule midnight reschedule trigger (primarily for Android)
        if (Platform.OS === 'android') {
            await scheduleMidnightReschedule();
        }

    } catch (error) {
        // Silently fail
    }
};

/**
 * Check if notifications need to be rescheduled
 * This runs on app startup to ensure notifications are always active
 * Runs silently without console output
 */
export const ensureNotificationsScheduled = async () => {
    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const lastScheduleStr = await AsyncStorage.getItem(LAST_SCHEDULE_DATE_KEY);

        const now = new Date();
        const today = now.toDateString();

        let needsReschedule = false;

        // Check if we have no scheduled notifications
        if (scheduled.length === 0) {
            needsReschedule = true;
        }
        // Check if last schedule was on a different day
        else if (lastScheduleStr) {
            const lastSchedule = new Date(lastScheduleStr);
            if (lastSchedule.toDateString() !== today) {
                needsReschedule = true;
            }
        }
        // Check if we have notifications but they're all in the past
        else {
            const allPassed = scheduled.every(notif => {
                const trigger = notif.trigger as any;
                if (trigger.value) {
                    const triggerDate = new Date(trigger.value);
                    return triggerDate < now;
                }
                return true;
            });

            if (allPassed) {
                needsReschedule = true;
            }
        }

        if (needsReschedule) {
            // Load saved settings and reschedule
            const locationStr = await AsyncStorage.getItem('userLocation');
            const adjustmentsStr = await AsyncStorage.getItem('userAdjustments');

            if (locationStr) {
                const location = JSON.parse(locationStr);
                const adjustments = adjustmentsStr ? JSON.parse(adjustmentsStr) : {
                    fajr: 0, sunrise: 0, zuhr: 0, asr: 0, maghrib: 0, isha: 0
                };

                const daysToSchedule = getDaysToSchedule();
                const daysArray: Array<{ date: Date; times: PrayerTimeResult }> = [];

                // Calculate prayer times for multiple days
                for (let i = 0; i < daysToSchedule; i++) {
                    const targetDate = new Date(now);
                    targetDate.setDate(targetDate.getDate() + i);

                    const times = calculatePrayerTimes(location.lat, location.lng, targetDate, adjustments);
                    daysArray.push({ date: targetDate, times });
                }

                await Notifications.cancelAllScheduledNotificationsAsync();
                await scheduleMultipleDays(daysArray);

                await AsyncStorage.setItem(LAST_SCHEDULE_DATE_KEY, now.toISOString());

                if (Platform.OS === 'android') {
                    await scheduleMidnightReschedule();
                }
            }
        }

        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Request notification permissions and initialize channel
 * Note: Does NOT schedule notifications immediately to prevent sound on app load
 * Notifications are scheduled by AppContext when location/settings change
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
            // Initialize notification channel after permissions are granted
            await initializeNotificationChannel();

            // Register background task for daily rescheduling
            await registerDailyRescheduleTask();

            // DON'T call ensureNotificationsScheduled() here - it causes immediate notifications on app load
            // The AppContext will handle scheduling when location/settings are available

            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
};

/**
 * Send a test notification immediately (for testing purposes)
 */
export const sendTestNotification = async (delaySeconds: number = 5) => {
    try {
        // Test prayer time notification with Adhan sound
        const prayerTestId = await Notifications.scheduleNotificationAsync({
            content: {
                title: '🕌 TEST: Fajr Prayer Time',
                body: "It's time for Fajr prayer (TEST - Adhan should play)",
                sound: 'adhan.mp3', // This will play the Adhan from assets/adhan.mp3
                ...getPriorityConfig(), // Platform-specific priority
                categoryIdentifier: 'prayer-time',
                // sticky and autoDismiss are Android-specific
                ...(Platform.OS === 'android' && {
                    sticky: false,
                    autoDismiss: true,
                }),
                data: {
                    prayerName: 'Fajr',
                    type: 'test-notification', // Mark as test notification
                    icon: '🌙',
                },
            },
            trigger: {
                seconds: delaySeconds,
                ...getChannelConfig(), // Platform-specific channel (Android only)
            },
        });

        console.log(`🧪 Test prayer notification scheduled! Will appear in ${delaySeconds} seconds with Adhan sound`);
        return { prayerTestId };
    } catch (error) {
        console.error('❌ Failed to send test notification:', error);
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
        console.log('📋 Scheduled Notifications:', scheduled.length);
        console.log('📅 Current time:', now.toLocaleString());
        console.log('');

        scheduled.forEach((notif, index) => {
            const trigger = notif.trigger as any;
            const triggerDate = trigger.value ? new Date(trigger.value) : null;
            const timeUntil = triggerDate ? triggerDate.getTime() - now.getTime() : null;
            const hoursUntil = timeUntil ? Math.floor(timeUntil / (1000 * 60 * 60)) : null;
            const minutesUntil = timeUntil ? Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60)) : null;

            console.log(`  ${index + 1}. ${notif.content.title}`);
            console.log(`     📍 Scheduled for: ${triggerDate?.toLocaleString() || 'Unknown'}`);
            if (hoursUntil !== null && minutesUntil !== null) {
                if (timeUntil! > 0) {
                    console.log(`     ⏰ Fires in: ${hoursUntil}h ${minutesUntil}m`);
                } else {
                    console.log(`     ⚠️  PAST TIME (should have fired already!)`);
                }
            }
            console.log('');
        });

        return scheduled;
    } catch (error) {
        console.error('❌ Failed to get scheduled notifications:', error);
        return [];
    }
};

/**
 * Get background task status and information
 * This helps diagnose if background tasks are working properly
 */
export const getBackgroundTaskStatus = async () => {
    try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(DAILY_RESCHEDULE_TASK);
        const status = await BackgroundFetch.getStatusAsync();

        const statusMap: Record<number, string> = {
            [BackgroundFetch.BackgroundFetchStatus.Restricted]: 'Restricted (iOS)',
            [BackgroundFetch.BackgroundFetchStatus.Denied]: 'Denied',
            [BackgroundFetch.BackgroundFetchStatus.Available]: 'Available',
        };

        const info = {
            taskRegistered: isRegistered,
            backgroundFetchStatus: statusMap[status] || 'Unknown',
            statusCode: status,
        };

        console.log('📊 Background Task Status:', info);
        return info;
    } catch (error) {
        console.error('❌ Failed to get background task status:', error);
        return null;
    }
};

/**
 * Force reschedule notifications (manual trigger)
 * This can be called from UI if user notices notifications stopped
 * Runs silently without console output
 */
export const forceReschedule = async () => {
    try {
        const locationStr = await AsyncStorage.getItem('userLocation');
        const adjustmentsStr = await AsyncStorage.getItem('userAdjustments');

        if (!locationStr) {
            return false;
        }

        const location = JSON.parse(locationStr);
        const adjustments = adjustmentsStr ? JSON.parse(adjustmentsStr) : {
            fajr: 0, sunrise: 0, zuhr: 0, asr: 0, maghrib: 0, isha: 0
        };

        const now = new Date();
        const daysToSchedule = getDaysToSchedule();
        const daysArray: Array<{ date: Date; times: PrayerTimeResult }> = [];

        // Calculate prayer times for multiple days
        for (let i = 0; i < daysToSchedule; i++) {
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + i);

            const times = calculatePrayerTimes(location.lat, location.lng, targetDate, adjustments);
            daysArray.push({ date: targetDate, times });
        }

        await Notifications.cancelAllScheduledNotificationsAsync();
        await scheduleMultipleDays(daysArray);

        await AsyncStorage.setItem(LAST_SCHEDULE_DATE_KEY, now.toISOString());

        if (Platform.OS === 'android') {
            await scheduleMidnightReschedule();
        }

        return true;
    } catch (error) {
        return false;
    }
};
