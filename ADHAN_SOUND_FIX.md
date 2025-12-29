# Adhan Sound Not Playing - Fix Guide

## ✅ Changes Made

I've updated the notification system to:

1. **Removed 15-minute reminder notifications** (you only get notifications at exact prayer time)
2. **Fixed Adhan sound configuration** to play even when app is closed
3. **Updated test notification** to only test the prayer time notification with Adhan

## 🔊 Why Adhan Might Not Play

The Adhan sound is configured correctly in the code, but there are Android-specific reasons it might not play:

### Reason 1: Notification Channel Settings
Once a notification channel is created, Android caches its settings. If you:
- Created the channel before
- Changed the sound later
- The old settings are still cached

**Solution**: You need to either:
1. Uninstall and reinstall the app (clears channel cache)
2. Manually reset the channel in Android settings

### Reason 2: Android Volume Settings
- **Notification volume** must be up (not just media volume)
- Check: Settings > Sound > Notification volume

### Reason 3: Do Not Disturb Mode
- Even though we set `bypassDnd: true`, some Android versions still respect DND
- Check: Make sure DND is off when testing

## 🚀 How to Fix It (REQUIRED STEPS)

### Step 1: Uninstall Current App
```bash
# On your emulator/device, uninstall the app completely
# This clears all notification channel caches
```

### Step 2: Rebuild and Reinstall
```bash
cd c:\Users\HomePC\Documents\app

# Clean rebuild
npx expo prebuild --clean

# Run on Android
npx expo run:android
```

### Step 3: Test the Adhan Sound

1. **Open the app** - Grant notification permissions
2. **Scroll to bottom** of Home screen
3. **Tap "🧪 Test Notifications (5s)"**
4. **CLOSE THE APP** (minimize it or go to home screen)
5. **Wait 5 seconds**
6. **You should hear the Adhan** when notification appears

## 📋 What Was Changed in Code

### 1. Removed Reminder Channel
```typescript
// BEFORE: Had two channels (prayer + reminder)
// NOW: Only one channel (prayer with Adhan)

const PRAYER_CHANNEL_ID = 'prayer-notifications';
// Removed: const REMINDER_CHANNEL_ID = 'prayer-reminders';
```

### 2. Added Audio Attributes
```typescript
await Notifications.setNotificationChannelAsync(PRAYER_CHANNEL_ID, {
    name: 'Prayer Time Notifications',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'adhan.mp3', // Points to assets/adhan.mp3
    audioAttributes: {
        usage: Notifications.AndroidAudioUsage.NOTIFICATION,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
    // ... other settings
});
```

### 3. Simplified Notification Scheduling
```typescript
// BEFORE: Scheduled 10 notifications (5 prayers + 5 reminders)
// NOW: Schedules 5 notifications (only prayer times with Adhan)

for (const prayer of prayers) {
    if (prayer.time > now) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: `${prayer.icon} ${prayer.name} Prayer Time`,
                body: `It's time for ${prayer.name} prayer`,
                sound: 'adhan.mp3', // Will play from assets
                priority: Notifications.AndroidNotificationPriority.MAX,
                // ... other settings
            },
            trigger: {
                date: prayer.time,
                channelId: PRAYER_CHANNEL_ID,
            },
        });
    }
}
```

## 🧪 Testing Checklist

- [ ] Uninstalled old app version
- [ ] Rebuilt app with `npx expo prebuild --clean`
- [ ] Installed fresh build
- [ ] Granted notification permissions
- [ ] Notification volume is UP (not muted)
- [ ] Do Not Disturb is OFF
- [ ] Tapped test button
- [ ] CLOSED/MINIMIZED the app
- [ ] Waited 5 seconds
- [ ] ✅ Heard Adhan sound when notification appeared

## 🔧 Additional Troubleshooting

### If Adhan Still Doesn't Play After Reinstall:

1. **Check the adhan.mp3 file**:
   - Make sure it's a valid MP3 file
   - Try playing it on your computer to verify it works
   - File size should be reasonable (< 5MB)

2. **Verify it was copied**:
   - Check: `android/app/src/main/res/raw/adhan.mp3` exists
   - If not, run `npx expo prebuild --clean` again

3. **Check Android notification settings**:
   - Settings > Apps > Your App > Notifications
   - Find "Prayer Time Notifications" channel
   - Verify sound is set to "adhan.mp3" or "Custom"
   - If it says "Default", the channel wasn't properly configured

4. **Try changing the channel ID** (forces recreation):
   ```typescript
   // In src/utils/notifications.ts, change:
   const PRAYER_CHANNEL_ID = 'prayer-notifications-v2'; // Add -v2
   ```
   Then rebuild and reinstall.

## 📊 Expected Behavior

When notification triggers (either from test or actual prayer time):

1. ✅ Notification banner appears at top
2. ✅ **Adhan sound plays from assets/adhan.mp3** (even if app is closed)
3. ✅ Device vibrates (250ms pattern)
4. ✅ LED flashes emerald green (if supported)
5. ✅ Shows on lock screen
6. ✅ Stays visible until dismissed

## 🎯 Summary

The code is now correctly configured to:
- ✅ Play Adhan sound from `assets/adhan.mp3`
- ✅ Work even when app is closed
- ✅ Only send notifications at prayer time (no 15-min reminders)
- ✅ Use maximum priority for visibility

**The key step**: You MUST uninstall and reinstall the app to clear Android's cached notification channel settings. Once you do that, the Adhan should play perfectly!

## 📝 Files Modified

1. **src/utils/notifications.ts**
   - Removed reminder channel
   - Added audio attributes to prayer channel
   - Removed 15-minute reminder scheduling
   - Updated test notification

2. **src/screens/HomeScreen.tsx**
   - Updated test button message

All changes are complete. Just rebuild and test! 🎉