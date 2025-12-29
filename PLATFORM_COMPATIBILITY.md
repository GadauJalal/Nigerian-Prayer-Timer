# Platform Compatibility Guide

## Overview

This document explains how the prayer notification system handles platform-specific features between Android and iOS to ensure cross-platform compatibility.

## Key Principle

**Android-specific features are wrapped in Platform checks to prevent errors on iOS.**

The notification system uses conditional logic to apply platform-specific configurations only where supported, while maintaining full functionality on both platforms.

## Platform-Specific Features

### 1. Notification Priority

**Android:** Uses explicit priority levels
```typescript
priority: Notifications.AndroidNotificationPriority.MAX
```

**iOS:** Uses system-managed priorities (no manual configuration)

**Implementation:**
```typescript
const getPriorityConfig = () => {
  if (Platform.OS === 'android') {
    return {
      priority: Notifications.AndroidNotificationPriority.MAX,
    };
  }
  return {}; // iOS uses system priorities
};
```

**Usage:**
```typescript
content: {
  title: 'Prayer Time',
  body: 'Time for prayer',
  ...getPriorityConfig(), // Conditionally adds priority
}
```

### 2. Notification Channels

**Android:** Requires notification channels (API 26+)
- Channels group notifications
- Users can control per-channel settings
- Required for sound, vibration, priority

**iOS:** No channel concept
- System handles notification categories
- No manual channel configuration needed

**Implementation:**
```typescript
const getChannelConfig = () => {
  if (Platform.OS === 'android') {
    return {
      channelId: PRAYER_CHANNEL_ID,
    };
  }
  return {}; // iOS doesn't use channels
};

export const initializeNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    // Create Android channel with all settings
    await Notifications.setNotificationChannelAsync(/* ... */);
    console.log('✅ Prayer notification channel created');
  } else {
    // iOS doesn't need channels
    console.log('✅ iOS notification system initialized');
  }
};
```

**Usage:**
```typescript
trigger: {
  date: prayerTime,
  ...getChannelConfig(), // Conditionally adds channelId
}
```

### 3. Notification Behavior

**Android-Specific Properties:**
- `sticky` - Pin notification (doesn't auto-dismiss)
- `autoDismiss` - Auto-dismiss on tap
- `vibrationPattern` - Custom vibration
- `lightColor` - Notification LED color
- `lockscreenVisibility` - Show on lock screen
- `bypassDnd` - Bypass Do Not Disturb
- `audioAttributes` - Sound configuration

**iOS:**
- System manages these behaviors
- Configured via notification categories
- No manual per-notification control

**Implementation:**
```typescript
content: {
  title: 'Prayer Time',
  body: 'Time for prayer',
  // Android-specific behavior
  ...(Platform.OS === 'android' && {
    sticky: false,
    autoDismiss: true,
  }),
}
```

### 4. Background Tasks

**Android:**
- `stopOnTerminate` - Control task persistence
- `startOnBoot` - Restart after device reboot
- More predictable execution timing
- Runs via WorkManager

**iOS:**
- System-managed background fetch
- No manual control over persistence
- Execution depends on usage patterns
- Runs via Background Fetch API

**Implementation:**
```typescript
export const registerDailyRescheduleTask = async () => {
  const taskOptions: any = {
    minimumInterval: 60 * 60, // Both platforms
  };

  // Android-specific options
  if (Platform.OS === 'android') {
    taskOptions.stopOnTerminate = false;
    taskOptions.startOnBoot = true;
  }
  // iOS handles these automatically

  await BackgroundFetch.registerTaskAsync(DAILY_RESCHEDULE_TASK, taskOptions);
};
```

## File Structure Changes

### Modified Files

**[src/utils/notifications.ts](src/utils/notifications.ts)**

Added helper functions:
- `getPriorityConfig()` - Platform-specific priority
- `getChannelConfig()` - Platform-specific channel
- Updated `initializeNotificationChannel()` - iOS-aware
- Updated `registerDailyRescheduleTask()` - Platform options
- Updated all notification scheduling - Conditional properties

## Platform Comparison Table

| Feature | Android | iOS | Implementation |
|---------|---------|-----|----------------|
| **Notification Priority** | ✅ Manual (MAX, HIGH, etc.) | ❌ System-managed | `getPriorityConfig()` |
| **Notification Channels** | ✅ Required | ❌ Not used | `getChannelConfig()` |
| **Custom Vibration** | ✅ Pattern array | ✅ System default | Channel config (Android) |
| **LED Color** | ✅ Configurable | ❌ No LED | Channel config (Android) |
| **Sticky Notifications** | ✅ `sticky` property | ❌ Not supported | Conditional spread |
| **Auto Dismiss** | ✅ `autoDismiss` | ✅ System default | Conditional spread |
| **Lock Screen Visibility** | ✅ Configurable | ✅ System-managed | Channel config (Android) |
| **Bypass DND** | ✅ `bypassDnd` | ❌ Not available | Channel config (Android) |
| **Background Task Persistence** | ✅ `stopOnTerminate` | ❌ System-managed | Task options (Android) |
| **Boot Restart** | ✅ `startOnBoot` | ✅ Automatic | Task options (Android) |
| **Sound Configuration** | ✅ Per-channel | ✅ Per-notification | Both platforms |
| **Badge Count** | ✅ Optional | ✅ Automatic | Both platforms |

## Testing on Both Platforms

### Android Testing

1. **Build and Run:**
```bash
npx expo prebuild --clean
npx expo run:android
```

2. **Check Console Logs:**
```
✅ Prayer notification channel created with Adhan sound
✅ Daily reschedule background task registered for Android
```

3. **Verify Channel:**
   - Open Settings → Apps → [Your App] → Notifications
   - Should see "Prayer Time Notifications" channel
   - Check sound, vibration, DND bypass

4. **Test Features:**
   - Notifications show with MAX priority
   - Adhan sound plays
   - Vibration pattern works
   - Shows on lock screen
   - Bypasses Do Not Disturb

### iOS Testing

1. **Build and Run:**
```bash
npx expo prebuild --clean
npx expo run:ios
```

2. **Check Console Logs:**
```
✅ iOS notification system initialized (no channels needed)
✅ Daily reschedule background task registered for iOS
```

3. **Verify Permissions:**
   - Settings → [Your App] → Notifications
   - Should be enabled
   - Check sound, badges, alerts

4. **Test Features:**
   - Notifications appear
   - Adhan sound plays
   - Badge count updates
   - Shows on lock screen
   - Respects Focus modes

## Code Examples

### ✅ CORRECT: Platform-Aware Code

```typescript
// Good: Uses helper functions
const notificationContent = {
  title: 'Prayer Time',
  body: 'Time for prayer',
  sound: 'adhan.mp3',
  ...getPriorityConfig(), // Adds priority only on Android
  ...(Platform.OS === 'android' && {
    sticky: false,
    autoDismiss: true,
  }),
};

const trigger = {
  date: prayerTime,
  ...getChannelConfig(), // Adds channelId only on Android
};
```

### ❌ INCORRECT: Android-Only Code

```typescript
// Bad: Will crash on iOS
const notificationContent = {
  title: 'Prayer Time',
  body: 'Time for prayer',
  priority: Notifications.AndroidNotificationPriority.MAX, // iOS error!
  sticky: false, // iOS doesn't support
  autoDismiss: true, // iOS doesn't support
};

const trigger = {
  date: prayerTime,
  channelId: PRAYER_CHANNEL_ID, // iOS error!
};
```

## Best Practices

### 1. Always Use Helper Functions

```typescript
// Instead of direct Android API usage
...getPriorityConfig()
...getChannelConfig()
```

### 2. Use Conditional Spreads for Optional Properties

```typescript
...(Platform.OS === 'android' && {
  androidSpecificProperty: value,
})
```

### 3. Log Platform-Specific Initialization

```typescript
if (Platform.OS === 'android') {
  console.log('✅ Android feature initialized');
} else {
  console.log('✅ iOS system ready');
}
```

### 4. Handle Platform Differences in Documentation

Always document which features are platform-specific in code comments:
```typescript
// Android-specific: sticky and autoDismiss
// iOS uses system defaults for these behaviors
...(Platform.OS === 'android' && {
  sticky: false,
  autoDismiss: true,
})
```

## Common Issues & Solutions

### Issue 1: Notification Not Showing on iOS

**Problem:** Using Android-only properties without Platform checks

**Solution:**
```typescript
// Remove or wrap Android-specific properties
content: {
  title: 'Prayer',
  // priority: Notifications.AndroidNotificationPriority.MAX, // ❌ iOS error
  ...getPriorityConfig(), // ✅ Correct
}
```

### Issue 2: Channel ID Error on iOS

**Problem:** `channelId` required on Android, not on iOS

**Solution:**
```typescript
trigger: {
  date: prayerTime,
  // channelId: PRAYER_CHANNEL_ID, // ❌ iOS error
  ...getChannelConfig(), // ✅ Correct
}
```

### Issue 3: Background Task Not Working

**Problem:** Using Android-specific task options on iOS

**Solution:**
```typescript
const taskOptions: any = {
  minimumInterval: 60 * 60, // Both platforms
};

if (Platform.OS === 'android') {
  taskOptions.stopOnTerminate = false; // Android-only
  taskOptions.startOnBoot = true; // Android-only
}
// iOS handles these automatically
```

## Sound Configuration

### Both Platforms Support

- Custom notification sounds (MP3)
- Sound plays when notification arrives
- Respects device silent mode

### Platform Differences

**Android:**
- Sound configured in channel
- Can bypass Do Not Disturb
- Per-channel audio attributes

**iOS:**
- Sound configured per-notification
- Respects Focus modes
- No DND bypass

**Implementation:**
```typescript
// Works on both platforms
content: {
  sound: 'adhan.mp3', // Both Android and iOS
}

// Android channel setup
if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync(PRAYER_CHANNEL_ID, {
    sound: 'adhan.mp3',
    audioAttributes: { /* Android-specific */ },
  });
}
```

## Debugging Platform Issues

### Check Current Platform
```typescript
console.log('Platform:', Platform.OS); // 'ios' or 'android'
console.log('Version:', Platform.Version); // OS version
```

### Test Platform-Specific Code
```typescript
if (__DEV__) {
  console.log('Priority config:', getPriorityConfig());
  console.log('Channel config:', getChannelConfig());
}
```

### Verify Feature Support
```typescript
const hasAndroidFeatures = Platform.OS === 'android';
console.log('Android features enabled:', hasAndroidFeatures);
```

## Migration Checklist

If you have existing Android-only code:

- [ ] Replace hard-coded `priority` with `...getPriorityConfig()`
- [ ] Replace hard-coded `channelId` with `...getChannelConfig()`
- [ ] Wrap `sticky`/`autoDismiss` in Platform checks
- [ ] Update channel initialization with iOS fallback
- [ ] Update background task registration with platform options
- [ ] Test on both Android and iOS devices
- [ ] Verify notifications work on both platforms
- [ ] Check console logs for platform-specific messages

## Summary

The notification system now:

✅ **Works on both Android and iOS**
✅ **Uses platform-specific features where available**
✅ **Gracefully degrades on unsupported platforms**
✅ **Maintains full functionality everywhere**
✅ **Follows platform best practices**
✅ **Provides clear logging for each platform**

All Android-specific code is properly wrapped in `Platform.OS === 'android'` checks, ensuring the app never tries to use Android-only APIs on iOS.

---

**Last Updated:** 2025-12-22
**Status:** Production Ready ✅
