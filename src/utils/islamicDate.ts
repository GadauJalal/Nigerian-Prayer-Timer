import { getMoonData } from './moonCalculations';
import { addDays, differenceInDays } from 'date-fns';

// Anchor Date: 1 Muharram 1445 AH = July 19, 2023
const ANCHOR_GREGORIAN = new Date(2023, 6, 19); // Month is 0-indexed: 6 is July
const ANCHOR_HIJRI_YEAR = 1445;
const ANCHOR_HIJRI_MONTH = 1; // Muharram
const ANCHOR_HIJRI_DAY = 1;

const HIJRI_MONTHS_NAMES = [
    'Muharram', 'Safar', 'Rabi\' Al-Awwal', 'Rabi\' Al-Thani',
    'Jumada Al-Awwal', 'Jumada Al-Thani', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhu Al-Qi\'dah', 'Dhu Al-Hijjah'
];

interface HijriDateParts {
    day: number;
    month: number;
    year: number;
    monthName: string;
}

/**
 * Calculates the accurate Hijri date for a given Gregorian date/location
 * using the strict Moon Age >= 18h rule.
 */
export const getAccurateHijriDate = (targetDate: Date, lat: number, lng: number): string => {
    const parts = getAccurateHijriParts(targetDate, lat, lng);
    return `${parts.day} ${parts.monthName} ${parts.year}`;
};

export { HIJRI_MONTHS_NAMES };

/**
 * Given a Hijri year and month, returns all Gregorian dates that fall in that month.
 * Uses Abuja coordinates for moon sighting consistency.
 */
export const getGregorianDaysForHijriMonth = (
    targetHijriYear: number,
    targetHijriMonth: number,
    lat: number = 9.0765,
    lng: number = 7.3986,
): { days: Date[]; monthLength: number; startDate: Date; endDate: Date } => {
    let refDate = new Date(ANCHOR_GREGORIAN);
    refDate.setHours(12, 0, 0, 0);

    let hYear = ANCHOR_HIJRI_YEAR;
    let hMonth = ANCHOR_HIJRI_MONTH;

    // Iterate month by month until we reach the target Hijri month
    while (hYear < targetHijriYear || (hYear === targetHijriYear && hMonth < targetHijriMonth)) {
        const day29 = addDays(refDate, 28);
        const { isVisible } = getMoonData(day29, lat, lng);
        const monthLength = isVisible ? 29 : 30;
        refDate = addDays(refDate, monthLength);
        hMonth++;
        if (hMonth > 12) {
            hMonth = 1;
            hYear++;
        }
    }

    // Now refDate is the 1st day of the target Hijri month
    const day29 = addDays(refDate, 28);
    const { isVisible } = getMoonData(day29, lat, lng);
    const monthLength = isVisible ? 29 : 30;

    const days: Date[] = [];
    for (let i = 0; i < monthLength; i++) {
        days.push(addDays(refDate, i));
    }

    return {
        days,
        monthLength,
        startDate: refDate,
        endDate: addDays(refDate, monthLength - 1),
    };
};

export const getAccurateHijriParts = (targetDate: Date, lat: number, lng: number): HijriDateParts => {
    // Normalize target to start of day to avoid time issues
    const target = new Date(targetDate);
    target.setHours(12, 0, 0, 0); // Noon to be safe from DST/TimeZone shifts

    let refDate = new Date(ANCHOR_GREGORIAN);
    refDate.setHours(12, 0, 0, 0);

    let hYear = ANCHOR_HIJRI_YEAR;
    let hMonth = ANCHOR_HIJRI_MONTH;

    // Iterate month by month
    // We assume target is after Anchor. If before, return null or fallback (not handled for now as App is new)
    if (target < refDate) {
        // Fallback for dates before Anchor (not expected for current usage)
        return { day: 1, month: 1, year: 1445, monthName: 'Muharram' };
    }

    while (true) {
        // Current Month Start is refDate.
        // We need to determine if this month has 29 or 30 days.

        // Potential 29th day of this Islamic Month
        // If start is Day 1, then Day 29 is start + 28 days
        const day29 = addDays(refDate, 29 - 1);

        // Calculate Moon on Day 29 Local Sunset
        // Note: The visibility check on Day 29 determines if month ends today (29 days) or tomorrow (30 days).
        // If visible on 29th sunset -> New month starts next day (Day 30 becomes Day 1 of new month).
        // If NOT visible -> Month continues (Day 30 is still old month), new month starts day after (Day 31 relative to start).

        const { isVisible } = getMoonData(day29, lat, lng);
        const monthLength = isVisible ? 29 : 30;

        const nextMonthStart = addDays(refDate, monthLength);

        // If the *next* month starts AFTER the target, then the target is in THIS month.
        if (nextMonthStart.getTime() > target.getTime()) {
            break;
        }

        // Advance to next month
        refDate = nextMonthStart;
        hMonth++;
        if (hMonth > 12) {
            hMonth = 1;
            hYear++;
        }
    }

    // Now refDate is the 1st of the Hijri Month containing target date
    const diff = differenceInDays(target, refDate);
    const hDay = diff + 1; // 1-indexed

    return {
        day: hDay,
        month: hMonth,
        year: hYear,
        monthName: HIJRI_MONTHS_NAMES[hMonth - 1]
    };
};
