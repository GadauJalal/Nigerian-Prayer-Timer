# Development Build Guide for Emulator

This guide will help you build and run the app with notifications on your Android emulator.

## Prerequisites

✅ You already have:
- Android emulator installed and working
- `adhan.mp3` file in the `assets/` folder
- All notification code configured

## Option 1: Build Using Android Studio (RECOMMENDED FOR EMULATOR)

This is the easiest method for testing on an emulator since you already have the Gradle issue.

### Step 1: Open Android Studio
1. Launch Android Studio
2. Click **"Open"** (or File → Open)
3. Navigate to: `c:\Users\HomePC\Documents\app\android`
4. Click **"OK"**

### Step 2: Wait for Gradle Sync
- Android Studio will automatically sync Gradle
- Wait for the progress bar at the bottom to finish
- If you see any errors, click **"Sync Project with Gradle Files"** (elephant icon)

### Step 3: Start Your Emulator
1. In Android Studio, click the **Device Manager** tab (phone icon on right side)
2. Click the **Play** button next to your emulator
3. Wait for the emulator to fully boot up

### Step 4: Run the App
1. In Android Studio toolbar, select your emulator from the device dropdown
2. Click the green **"Run"** button (▶️) or press **Shift+F10**
3. Wait for the build to complete
4. The app will automatically install and launch on your emulator

### Step 5: Test Notifications
1. When the app opens, grant notification permissions
2. Check the console for logs like:
   ```
   Notification permissions granted
   Notification channel created successfully
   Scheduled Fajr notification for [time]
   Scheduled Dhuhr notification for [time]
   ...
   ```

---

## Option 2: Command Line Build (If Gradle Issue is Fixed)

If you want to try fixing the Gradle issue:

### Fix Gradle Path Issue
1. Open PowerShell as Administrator
2. Run these commands:

```powershell
# Set Gradle home to a simple path
$env:GRADLE_USER_HOME = "C:\gradle"
[System.Environment]::SetEnvironmentVariable('GRADLE_USER_HOME', 'C:\gradle', 'User')

# Delete old Gradle cache
rd /s /q C:\Users\HomePC\.gradle

# Create new Gradle directory
mkdir C:\gradle
```

### Build and Run
```powershell
cd c:\Users\HomePC\Documents\app

# Rebuild native code
npx expo prebuild --clean

# Run on emulator
npx expo run:android
```

---

## Option 3: Using Metro Bundler with Development Build

Once you've built the app using Option 1 or 2:

### Step 1: Keep the app installed on emulator

### Step 2: Start Metro bundler
```bash
cd c:\Users\HomePC\Documents\app
npx expo start --dev-client
```

### Step 3: From your emulator
- Open the installed development build app
- It will automatically connect to Metro
- You can now make code changes and they'll hot-reload!

---

## Testing the Notifications

### Method 1: Wait for Prayer Time
1. Open the app
2. Check the Home screen for upcoming prayer times
3. Wait for the next prayer time
4. You should see a notification with Adhan sound

### Method 2: Add Test Button (Quick Testing)

Add this to any screen (e.g., Home screen) to trigger a test notification:

```typescript
import * as Notifications from 'expo-notifications';

// Add this button in your JSX
<TouchableOpacity
  onPress={async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test: Fajr Prayer Time',
        body: "It's time for Fajr prayer (TEST)",
        sound: 'adhan.mp3',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        seconds: 5,
        channelId: 'prayer-notifications',
      },
    });
    alert('Test notification scheduled in 5 seconds!');
  }}
  style={{ padding: 20, backgroundColor: '#10B981', borderRadius: 10, margin: 20 }}
>
  <Text style={{ color: 'white', textAlign: 'center' }}>
    Test Notification (5 sec)
  </Text>
</TouchableOpacity>
```

### Method 3: Check Scheduled Notifications

Add this to check what's scheduled:

```typescript
import * as Notifications from 'expo-notifications';

const checkScheduled = async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log('Scheduled notifications:', scheduled);
  alert(`${scheduled.length} notifications scheduled`);
};
```

---

## Expected Behavior

When a notification triggers:

1. ✅ Notification appears at the top of screen
2. ✅ Adhan sound plays
3. ✅ Device vibrates (pattern: 250ms intervals)
4. ✅ Notification shows on lock screen
5. ✅ LED light flashes emerald green (if device supports it)
6. ✅ Tapping notification opens the app

Check console logs for:
- "Notification permissions granted"
- "Notification channel created successfully"
- "Scheduled [Prayer] notification for [time]"
- "Notification received in foreground"
- "Notification tapped"

---

## Troubleshooting

### Issue: Build fails in Android Studio
**Solution:**
1. File → Invalidate Caches → Invalidate and Restart
2. Build → Clean Project
3. Build → Rebuild Project

### Issue: Adhan sound not playing
**Solutions:**
1. Check that `adhan.mp3` exists in `assets/` folder
2. Verify it was copied to: `android/app/src/main/res/raw/adhan.mp3`
3. Ensure emulator volume is up
4. Try running: `npx expo prebuild --clean` to recopy assets

### Issue: No notifications appearing
**Solutions:**
1. Check notification permissions are granted
2. Verify prayer times are in the future (check console logs)
3. Look for "Scheduled [Prayer] notification" logs
4. Check Android notification settings for the app

### Issue: "ENOENT: no such file" during prebuild
**Solution:**
- Ensure `adhan.mp3` exists in `assets/` folder before running prebuild

---

## Quick Start Commands Summary

```bash
# Open in Android Studio (Recommended)
# Just open: c:\Users\HomePC\Documents\app\android

# OR using command line (if Gradle fixed)
cd c:\Users\HomePC\Documents\app
npx expo prebuild --clean
npx expo run:android

# OR start Metro bundler (after first build)
npx expo start --dev-client
```

---

## What's Configured

✅ **expo-dev-client** - Development build support
✅ **expo-notifications** - Notification system
✅ **Adhan sound** - Custom notification sound
✅ **Notification channel** - Android notification channel with MAX importance
✅ **Permissions** - All required Android permissions
✅ **Tap handling** - Notification tap listeners
✅ **Auto-scheduling** - Prayers scheduled automatically based on location

Everything is ready! Just build and run using one of the methods above.
