# Prayer Time Notifications Setup Guide

## Overview
This app now includes prayer time notifications with Adhan sound for Android devices. Notifications are automatically scheduled for all five daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha).

## Setup Instructions

### 1. Add Adhan Sound File
**IMPORTANT**: You must add an Adhan sound file to the assets folder:
- File name: `adhan.mp3`
- Location: `assets/adhan.mp3`
- Format: MP3
- Recommended duration: 30 seconds to 2 minutes
- File size: < 5MB for optimal performance

You can download an Adhan MP3 file from Islamic websites or use your own recording.

### 2. Build the App
Since we've added notification configuration to `app.json`, you need to rebuild the native app:

```bash
# For development build
npx expo prebuild --clean

# Then run on Android
npx expo run:android

# OR create a production build
eas build --platform android
```

**Note**: Hot reload will NOT apply these changes. You must rebuild the native app.

### 3. Grant Permissions
When you first launch the app:
1. The app will request notification permissions
2. Tap "Allow" to enable prayer time notifications
3. On Android 13+, you'll see a system permission dialog

## Features Implemented

### ✅ Notification Channel
- **Channel Name**: Prayer Time Notifications
- **Importance**: MAX (appears as heads-up notification)
- **Sound**: Custom Adhan sound (adhan.mp3)
- **Vibration**: Pattern vibration (250ms intervals)
- **LED Color**: Emerald green (#10B981)
- **DND Bypass**: Can bypass Do Not Disturb mode
- **Lock Screen**: Visible on lock screen

### ✅ Prayer Time Scheduling
- Automatically schedules notifications for all 5 daily prayers
- Notifications are scheduled based on your location settings
- Only future prayer times are scheduled (past times are skipped)
- Notifications are rescheduled when:
  - Location changes
  - Prayer time adjustments are made
  - App is restarted

### ✅ Notification Content
- **Title**: "[Prayer Name] Prayer Time" (e.g., "Fajr Prayer Time")
- **Body**: "It's time for [Prayer Name] prayer"
- **Sound**: Plays Adhan sound (adhan.mp3)
- **Vibration**: Vibrates device
- **Badge**: Shows notification badge count

### ✅ Tap Handling
- When user taps on a notification:
  - App opens (or comes to foreground)
  - Prayer name is logged to console
  - Can be extended to navigate to specific screens

### ✅ Foreground Notifications
- Notifications are shown even when app is in foreground
- Useful for testing and ensuring users don't miss prayer times

## Testing the Notifications

### Method 1: Wait for Prayer Time
1. Open the app
2. Check the Home screen for upcoming prayer times
3. Wait until a prayer time arrives
4. The notification should appear with Adhan sound

### Method 2: Manual Testing (Recommended)
Add a test notification in your app to verify the setup works:

```typescript
// In any screen, add a button to trigger test notification
import * as Notifications from 'expo-notifications';

const testNotification = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test: Fajr Prayer Time',
      body: "It's time for Fajr prayer",
      sound: 'adhan.mp3',
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: {
      seconds: 5, // Trigger in 5 seconds
      channelId: 'prayer-notifications',
    },
  });
};
```

### Method 3: Check Scheduled Notifications
Open React Native Debugger or check console logs:
- You should see logs like: "Scheduled Fajr notification for [date/time]"
- Use `Notifications.getAllScheduledNotificationsAsync()` to verify

## Troubleshooting

### Issue: Notification sound not playing
**Solutions**:
1. Ensure `adhan.mp3` exists in `assets/` folder
2. Rebuild the app with `npx expo prebuild --clean`
3. Check that the file is properly formatted (MP3)
4. Verify phone volume is not muted
5. Check if Do Not Disturb mode is blocking sounds

### Issue: Notifications not appearing
**Solutions**:
1. Check notification permissions: Settings > Apps > [Your App] > Notifications
2. Verify the channel exists: Settings > Apps > [Your App] > Notifications > Prayer Time Notifications
3. Ensure prayer times are in the future (check console logs)
4. Check if battery optimization is blocking notifications

### Issue: "Permission denied" error
**Solutions**:
1. Manually grant notification permission in Android settings
2. For Android 13+, ensure `POST_NOTIFICATIONS` permission is granted
3. Restart the app after granting permissions

### Issue: Adhan sound file error
**Solutions**:
1. Verify the file is named exactly `adhan.mp3` (lowercase)
2. Place it directly in the `assets/` folder (not in a subfolder)
3. Check the file format is valid MP3
4. Ensure file size is reasonable (< 5MB)

## Files Modified/Created

### Created:
1. `src/services/notification.ts` - Notification service (alternative implementation)
2. `assets/ADHAN_SOUND_README.txt` - Guide for Adhan sound file
3. `NOTIFICATION_SETUP.md` - This setup guide

### Modified:
1. `src/utils/notifications.ts` - Updated with full notification implementation
2. `App.tsx` - Added notification tap handling
3. `app.json` - Added notification configuration and permissions

### Existing (Already Working):
1. `src/context/AppContext.tsx` - Automatically schedules notifications when prayer times change
2. `src/utils/prayerTimes.ts` - Calculates prayer times based on location

## Android Permissions Explained

The app requests these permissions for notifications:

- **VIBRATE**: Allow device vibration for notifications
- **RECEIVE_BOOT_COMPLETED**: Reschedule notifications after device restart
- **SCHEDULE_EXACT_ALARM**: Schedule notifications at exact prayer times
- **USE_EXACT_ALARM**: Alternative exact alarm permission (Android 14+)
- **POST_NOTIFICATIONS**: Display notifications (Android 13+)

## Next Steps

1. **Add the Adhan sound file** (`assets/adhan.mp3`)
2. **Rebuild the app** with `npx expo prebuild --clean && npx expo run:android`
3. **Grant permissions** when prompted
4. **Test notifications** using one of the methods above
5. **Wait for prayer time** to verify automatic notifications work

## Future Enhancements (Optional)

Consider adding these features later:
- Toggle to enable/disable notifications
- Different Adhan sounds for different prayers
- Pre-notification reminder (e.g., 10 minutes before prayer)
- Notification history/log
- Silent mode during specific hours
- Multiple notification channels for different prayer types
