# Daily Rescheduling Feature

## Overview

The daily rescheduling feature ensures that prayer time notifications **continue working indefinitely** without requiring user intervention. This solves the problem where notifications would stop after all prayers for the current day have passed.

## How It Works

The system uses **three complementary mechanisms** to ensure notifications are always scheduled:

### 1. Multi-Day Scheduling
When scheduling notifications, the app now schedules prayers for **both today AND tomorrow**. This means:
- Even after the last prayer of the day (Isha), notifications are still queued for the next day
- Users always have at least 24 hours of upcoming notifications
- No gap in notification coverage

### 2. Midnight Reschedule Trigger
A special notification is scheduled at midnight (12:00 AM) every day that:
- Triggers the rescheduling process
- Refreshes the notification queue with new prayer times
- Automatically schedules the next midnight trigger
- Ensures continuous operation

### 3. Background Task (Expo Background Fetch)
A background task runs periodically (every hour) to:
- Check if notifications need rescheduling
- Reschedule automatically even when the app is closed
- Continue working after device reboot (`startOnBoot: true`)
- Persist through app termination (`stopOnTerminate: false`)

### 4. App Startup Check
Every time the app starts, it:
- Checks if any notifications are scheduled
- Verifies if the last schedule was today
- Automatically reschedules if needed
- Ensures notifications are never missing

## Implementation Details

### Files Modified

1. **src/utils/notifications.ts**
   - Added `registerDailyRescheduleTask()` - Registers the background task
   - Added `ensureNotificationsScheduled()` - Checks and reschedules if needed
   - Added `scheduleMidnightReschedule()` - Sets up midnight trigger
   - Added `scheduleMultipleDays()` - Helper to schedule multiple days
   - Updated `schedulePrayerNotifications()` - Now includes tomorrow's prayers
   - Added background task definition using TaskManager

2. **App.tsx**
   - Added listener for midnight reschedule notifications
   - Triggers `ensureNotificationsScheduled()` when midnight notification fires

3. **package.json**
   - Added `expo-background-fetch` (~14.0.9)
   - Added `expo-task-manager` (~14.0.9)

### New Dependencies

```json
{
  "expo-background-fetch": "~14.0.9",
  "expo-task-manager": "~14.0.9"
}
```

These are official Expo packages compatible with SDK 54.

## Key Features

### Automatic Rescheduling
- **On App Startup**: Checks if notifications are up-to-date
- **At Midnight**: Automatically refreshes for the new day
- **Background Tasks**: Runs even when app is closed
- **After Reboot**: Restarts after device restart

### Persistence Tracking
The system tracks the last schedule date in AsyncStorage:
```typescript
const LAST_SCHEDULE_DATE_KEY = 'lastScheduleDate';
```

This allows the app to detect when a new day has started and reschedule accordingly.

### Smart Scheduling Logic
The `ensureNotificationsScheduled()` function checks three conditions:
1. Are there any scheduled notifications?
2. Was the last schedule on a different day?
3. Are all scheduled notifications in the past?

If any condition is true, it triggers automatic rescheduling.

## Console Logs

The implementation includes comprehensive logging to help with debugging:

```
📅 Scheduling prayers for 2 day(s)
📅 Processing 12/19/2025:
   🌙 Fajr: 5:30:00 AM (future)
   ✅ Scheduled Fajr for 12/19/2025, 5:30:00 AM (in 6h 15m) - ID: ...
   ☀️ Dhuhr: 12:15:00 PM (future)
   ✅ Scheduled Dhuhr for 12/19/2025, 12:15:00 PM (in 12h 0m) - ID: ...
   ...

📅 Processing 12/20/2025:
   🌙 Fajr: 5:30:00 AM (future)
   ✅ Scheduled Fajr for 12/20/2025, 5:30:00 AM (in 30h 15m) - ID: ...
   ...

✅ Successfully scheduled 10 prayer notifications across 2 day(s)
📋 Verified: 10 notifications in queue
🌙 Midnight reschedule trigger set for 12/20/2025, 12:00:00 AM
```

## How to Test

### 1. Install Dependencies
```bash
npx expo install expo-background-fetch expo-task-manager
```

### 2. Rebuild Native App
Since we added native modules, you need to rebuild:
```bash
npx expo prebuild --clean
npx expo run:android
# or
npx expo run:ios
```

### 3. Verify Scheduling
Check the console logs to confirm:
- Notifications are scheduled for both today and tomorrow
- Midnight trigger is set
- Background task is registered

### 4. Test Startup Check
1. Close the app completely
2. Wait a few minutes
3. Reopen the app
4. Check console for: "✅ Notifications are up to date"

### 5. Test Background Task
The background task runs automatically. To verify:
```javascript
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

// Check if task is registered
const isRegistered = await TaskManager.isTaskRegisteredAsync('DAILY_PRAYER_RESCHEDULE');
console.log('Background task registered:', isRegistered);

// Get task status
const status = await BackgroundFetch.getStatusAsync();
console.log('Background fetch status:', status);
```

## Platform-Specific Notes

### Android
- Background fetch minimum interval is 15 minutes
- Requires `RECEIVE_BOOT_COMPLETED` permission (already in app.json)
- Uses Android WorkManager under the hood
- More reliable for background execution

### iOS
- Background fetch is less predictable
- iOS decides when to run based on usage patterns
- May not run if battery is low
- Works best when app is used regularly

## Limitations & Considerations

1. **Background Task Reliability**
   - Android: Generally reliable, runs as scheduled
   - iOS: Less predictable, depends on system resources

2. **Battery Optimization**
   - Users may need to disable battery optimization for the app
   - Some manufacturers (Xiaomi, Huawei) have aggressive battery savers

3. **Midnight Trigger**
   - Only fires if notification is delivered
   - Serves as a backup to background task
   - App must be open to process (foreground listener)

4. **Storage Requirements**
   - Requires saved location and adjustments in AsyncStorage
   - If user clears app data, rescheduling will fail until location is set

## Troubleshooting

### Notifications Stop After a Day
1. Check console logs for errors
2. Verify background task is registered
3. Check device battery optimization settings
4. Ensure location is saved in AsyncStorage

### Background Task Not Running
1. Check Android battery optimization
2. Verify permissions in app.json
3. Test on a different device
4. Check system background fetch status

### Midnight Trigger Not Firing
1. This is a backup mechanism only
2. Background task should handle most cases
3. App must be open for foreground listener to work
4. Check notification permissions

## Future Enhancements

Potential improvements:
- Schedule 7 days in advance instead of 2
- Add health check to verify notification queue
- Implement fallback SMS/alarm if notifications fail
- Add user-facing status indicator
- Sync with calendar apps for backup

## Summary

The daily rescheduling feature provides **three layers of redundancy**:

1. ✅ **Multi-day scheduling** - Always have tomorrow scheduled
2. ✅ **Midnight trigger** - Automatic refresh at day boundary
3. ✅ **Background task** - Runs even when app is closed
4. ✅ **Startup check** - Validates on every app launch

This ensures prayer notifications **continue working indefinitely** without user intervention.
