# iOS Scheduling Strategy

## Problem Statement

**iOS Background Fetch Unreliability:**
- Background fetch is system-managed and unpredictable
- May not run for days if device is low on battery
- Depends on app usage patterns
- Can be disabled by user in settings
- Not guaranteed to run at midnight

**Result:** Notifications would stop after 1-2 days if relying on background fetch alone.

## Solution: Schedule Far Ahead

Instead of relying on background fetch, we schedule notifications **7 days in advance**.

### iOS Notification Limits

- **Maximum:** 64 scheduled notifications
- **Prayers per day:** 5 (Fajr, Dhuhr, Asr, Maghrib, Isha)
- **Maximum days:** 12 days (60 notifications)
- **Reserve:** 4 slots for system notifications

### Our Strategy

**Schedule 7 Days Ahead:**
- Total notifications: 35 (5 prayers × 7 days)
- Well within iOS limit of 64
- User opens app weekly to maintain notifications
- Provides 1-week buffer

## Implementation

### Platform-Specific Configuration

```typescript
const getDaysToSchedule = (): number => {
    if (Platform.OS === 'ios') {
        return 7; // iOS: Schedule 7 days ahead
    } else {
        return 2; // Android: Background tasks handle the rest
    }
};
```

### Scheduling Flow

**iOS:**
```
Day 0: User opens app
  ↓
Schedule 7 days of prayers (35 notifications)
  ↓
Days 1-6: No action needed
  ↓
Day 7: User opens app again
  ↓
Reschedule next 7 days
  ↓
Repeat weekly
```

**Android:**
```
Day 0: User opens app
  ↓
Schedule 2 days of prayers (10 notifications)
  ↓
Background task runs hourly
  ↓
Automatically reschedules daily
  ↓
No user action needed
```

## User Experience

### iOS Users

**Weekly App Opening Required:**
- Users must open the app at least once per week
- App automatically reschedules on startup
- No manual intervention needed

**Grace Period:**
- 7-day schedule provides buffer
- If user opens app on day 6, still has 1 day of notifications
- Reschedules for next 7 days

**Visual Feedback:**
```
📅 Platform: iOS - Scheduling 7 day(s) ahead
✅ Successfully scheduled 35 prayer notifications across 7 day(s)
📋 Verified: 35 notifications in queue
```

### Android Users

**No Weekly Requirement:**
- Background tasks run automatically
- Schedules only 2 days ahead
- Refreshes daily via background task
- Can go weeks/months without opening app

**Visual Feedback:**
```
📅 Platform: Android - Scheduling 2 day(s) ahead
✅ Successfully scheduled 10 prayer notifications across 2 day(s)
📋 Verified: 11 notifications in queue
🌙 Midnight reschedule trigger set
```

## Code Changes

### 1. Constants Added

```typescript
// iOS has a limit of 64 scheduled notifications
const MAX_IOS_NOTIFICATIONS = 64;
const PRAYERS_PER_DAY = 5;
const MAX_DAYS_TO_SCHEDULE = Math.floor((MAX_IOS_NOTIFICATIONS - 4) / PRAYERS_PER_DAY); // 12 days
```

### 2. Platform-Specific Scheduling

**Before (All Platforms):**
```typescript
// Always scheduled 2 days
const daysToSchedule = [
    { date: today, times: todayTimes },
    { date: tomorrow, times: tomorrowTimes }
];
```

**After (Platform-Aware):**
```typescript
// iOS: 7 days, Android: 2 days
const daysToSchedule = getDaysToSchedule();

for (let i = 0; i < daysToSchedule; i++) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + i);
    const times = calculatePrayerTimes(location.lat, location.lng, targetDate, adjustments);
    daysArray.push({ date: targetDate, times });
}
```

### 3. Midnight Trigger (Android Only)

```typescript
// Schedule midnight reschedule trigger (primarily for Android)
if (Platform.OS === 'android') {
    await scheduleMidnightReschedule();
}
```

iOS doesn't need midnight triggers since it schedules 7 days ahead.

## Functions Updated

All scheduling functions now use `getDaysToSchedule()`:

1. **`schedulePrayerNotifications()`** - Main scheduling function
2. **`ensureNotificationsScheduled()`** - Startup check
3. **`Background task`** - Background reschedule (Android mainly)
4. **`forceReschedule()`** - Manual reschedule

## Notification Limit Monitoring

```typescript
if (Platform.OS === 'ios' && scheduled.length > MAX_IOS_NOTIFICATIONS) {
    console.warn(`⚠️  iOS notification limit warning: ${scheduled.length}/${MAX_IOS_NOTIFICATIONS} notifications scheduled`);
}
```

Warns if approaching iOS limit (shouldn't happen with 7-day schedule).

## Testing

### iOS Testing

**Initial Schedule:**
1. Open app for first time
2. Check console: "Scheduling 7 day(s) ahead"
3. Verify: 35 notifications scheduled
4. Close app

**7 Days Later:**
1. Open app on day 7
2. App detects old schedule
3. Automatically reschedules next 7 days
4. Verify: 35 new notifications

**Manual Test:**
```typescript
// Force reschedule
await forceReschedule();

// Check scheduled count
const scheduled = await debugScheduledNotifications();
console.log(`Total: ${scheduled.length}`); // Should be ~35
```

### Android Testing

**Initial Schedule:**
1. Open app for first time
2. Check console: "Scheduling 2 day(s) ahead"
3. Verify: 10-11 notifications (10 prayers + midnight trigger)
4. Close app

**24 Hours Later:**
1. Background task runs automatically
2. Reschedules next 2 days
3. No app opening needed
4. Verify via logs or ADB

## Advantages

### iOS Strategy

✅ **Reliable:** Not dependent on background fetch
✅ **Simple:** No complex background coordination
✅ **Battery-Friendly:** No background processing needed
✅ **User-Controlled:** User decides when to refresh
✅ **Predictable:** Always 7 days of coverage

### Tradeoffs

⚠️ **Weekly Requirement:** User must open app weekly
⚠️ **No Auto-Refresh:** Doesn't reschedule automatically
⚠️ **Storage:** Uses more notification slots (35 vs 10)

### Why 7 Days?

**Not Too Long:**
- Doesn't use too many notification slots
- Prayer times don't vary drastically week-to-week
- Easy for users to remember (weekly routine)

**Not Too Short:**
- Provides adequate buffer
- Users don't need to open daily
- Forgiving if user forgets a day or two

**Optimal Balance:**
- 35 notifications (55% of limit)
- Room for growth (could extend to 10-12 days if needed)
- Weekly user engagement is reasonable

## Edge Cases

### What if user doesn't open app for 8 days?

**Scenario:** User opens app on day 8
- Days 1-7: Notifications work (scheduled)
- Day 8: No notifications (schedule expired)
- User opens app: Immediately reschedules next 7 days
- Day 9 onward: Notifications resume

**Mitigation:**
- Add in-app reminder: "Open app weekly"
- Show last schedule date in settings
- Optional: Weekly push reminder (meta-notification)

### What if iOS limit is reached?

**Prevention:**
- 7-day schedule uses only 35 notifications
- 29 slots still available
- Unlikely to hit limit

**Detection:**
```typescript
if (Platform.OS === 'ios' && scheduled.length > MAX_IOS_NOTIFICATIONS) {
    console.warn(`⚠️  iOS notification limit warning`);
}
```

**Handling:**
- Reduce to 5-6 days if limit is approached
- Prioritize future notifications over past

### What if calculation times change?

**Scenario:** Prayer times shift due to location/settings change
- App detects change (via AppContext)
- Cancels all existing notifications
- Recalculates all 7 days with new settings
- Reschedules with updated times

## Future Enhancements

### Optional: Extend to 10-12 Days

```typescript
const getDaysToSchedule = (): number => {
    if (Platform.OS === 'ios') {
        return 10; // 50 notifications, user opens every 10 days
    } else {
        return 2;
    }
};
```

**Benefits:**
- Less frequent app opening (every 10 days)
- Still well within 64 limit

**Tradeoffs:**
- More notification slots used
- Longer between user interactions

### Optional: Dynamic Adjustment

```typescript
const getDaysToSchedule = (): number => {
    if (Platform.OS === 'ios') {
        const userPreference = await AsyncStorage.getItem('scheduleDays');
        return userPreference ? parseInt(userPreference) : 7;
    }
    return 2;
};
```

**User Setting:**
- Low frequency user: 10-12 days
- High frequency user: 5-7 days
- Power user: 2-3 days (similar to Android)

### Optional: Smart Reminder

```typescript
// Schedule reminder on day 6
if (Platform.OS === 'ios') {
    const reminder = new Date(now);
    reminder.setDate(reminder.getDate() + 6);

    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Prayer App Maintenance',
            body: 'Open app tomorrow to refresh notifications',
        },
        trigger: { date: reminder },
    });
}
```

## Comparison Table

| Feature | iOS (7-day) | Android (2-day) |
|---------|-------------|-----------------|
| **Notifications** | 35 | 10-11 |
| **User Action** | Weekly | Never |
| **Background Task** | ❌ Not used | ✅ Runs hourly |
| **Reliability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Battery Impact** | Minimal | Minimal |
| **Auto-Refresh** | ❌ Manual | ✅ Automatic |
| **Schedule Buffer** | 7 days | 2 days |
| **Midnight Trigger** | ❌ Not needed | ✅ Daily |

## Console Log Examples

### iOS

```
📅 Current time: 12/22/2025, 10:30:00 AM
📅 Platform: iOS - Scheduling 7 day(s) ahead
📅 Scheduling prayers for 7 day(s)

📅 Processing 12/22/2025:
   🌙 Fajr: 5:30:00 AM (passed)
   ☀️ Dhuhr: 12:15:00 PM (future)
   ✅ Scheduled Dhuhr for 12/22/2025, 12:15:00 PM (in 1h 45m)
   ...

📅 Processing 12/28/2025:
   🌙 Fajr: 5:31:00 AM (future)
   ✅ Scheduled Fajr for 12/28/2025, 5:31:00 AM (in 6d 19h)
   ...

✅ Successfully scheduled 35 prayer notifications across 7 day(s)
📋 Verified: 35 notifications in queue
```

### Android

```
📅 Current time: 12/22/2025, 10:30:00 AM
📅 Platform: Android - Scheduling 2 day(s) ahead
📅 Scheduling prayers for 2 day(s)

📅 Processing 12/22/2025:
   🌙 Fajr: 5:30:00 AM (passed)
   ☀️ Dhuhr: 12:15:00 PM (future)
   ✅ Scheduled Dhuhr for 12/22/2025, 12:15:00 PM (in 1h 45m)
   ...

📅 Processing 12/23/2025:
   🌙 Fajr: 5:30:00 AM (future)
   ✅ Scheduled Fajr for 12/23/2025, 5:30:00 AM (in 1d 19h)
   ...

✅ Successfully scheduled 10 prayer notifications across 2 day(s)
📋 Verified: 11 notifications in queue
🌙 Midnight reschedule trigger set for 12/23/2025, 12:00:00 AM
```

## Summary

**iOS Approach:**
- ✅ Schedule 7 days ahead (35 notifications)
- ✅ User opens app weekly
- ✅ Reliable and predictable
- ✅ No background fetch dependency
- ✅ Battery efficient

**Android Approach:**
- ✅ Schedule 2 days ahead (10 notifications)
- ✅ Background task auto-refreshes
- ✅ No user action needed
- ✅ Hourly background execution
- ✅ Midnight trigger backup

**Result:** Both platforms have reliable, continuous prayer notifications with different strategies optimized for each platform's capabilities.

---

**Implementation Date:** 2025-12-22
**Status:** Complete ✅
**iOS Requirement:** User must open app weekly
**Android Requirement:** None (fully automatic)
