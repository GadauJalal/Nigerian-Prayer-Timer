import { Coordinates, CalculationMethod, PrayerTimes, Madhab, HighLatitudeRule } from 'adhan';

export interface PrayerTimeResult {
    fajr: Date;
    sunrise: Date;
    zuhr: Date;
    asr: Date;
    maghrib: Date;
    isha: Date;
}

export const calculatePrayerTimes = (
    lat: number,
    lng: number,
    date: Date,
    offsets: { [key: string]: number } = {}
): PrayerTimeResult => {
    const coordinates = new Coordinates(lat, lng);

    // Custom Nigerian Calculation Method
    // Fajr: 18 degrees
    // Isha: Fixed interval of 65 minutes after Maghrib (approx, usually handled via adjustments or custom params)
    // But adhan library allows setting custom params.

    const params = CalculationMethod.MuslimWorldLeague(); // Start with a base
    params.fajrAngle = 18;
    params.ishaAngle = 0; // Set to 0 to use interval if possible, or we manually adjust
    params.ishaInterval = 65; // Maghrib + 65 minutes
    params.madhab = Madhab.Shafi; // Asr 1x shadow
    params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;

    // Maghrib is Sunset + 1 minute
    // We can use adjustments for this.
    params.adjustments.maghrib = 1;

    // Apply user manual offsets
    params.adjustments.fajr += offsets.fajr || 0;
    params.adjustments.sunrise += offsets.sunrise || 0;
    params.adjustments.zuhr += offsets.zuhr || 0;
    params.adjustments.asr += offsets.asr || 0;
    params.adjustments.maghrib += offsets.maghrib || 0;
    params.adjustments.isha += offsets.isha || 0;

    const prayerTimes = new PrayerTimes(coordinates, date, params);

    if (isNaN(prayerTimes.fajr.getTime())) {
        console.error('Invalid Prayer Times Calculated:', { lat, lng, date, params });
    }

    return {
        fajr: prayerTimes.fajr,
        sunrise: prayerTimes.sunrise,
        zuhr: prayerTimes.dhuhr, // adhan library uses 'dhuhr'
        asr: prayerTimes.asr,
        maghrib: prayerTimes.maghrib,
        isha: prayerTimes.isha,
    };
};

export const getNextPrayer = (prayerTimes: PrayerTimeResult): { name: string; time: Date; remaining: number } => {
    const now = new Date();
    const times = [
        { name: 'Fajr', time: prayerTimes.fajr },
        { name: 'Sunrise', time: prayerTimes.sunrise },
        { name: 'Zuhr', time: prayerTimes.zuhr },
        { name: 'Asr', time: prayerTimes.asr },
        { name: 'Maghrib', time: prayerTimes.maghrib },
        { name: 'Isha', time: prayerTimes.isha },
    ];

    // Find the first time that is after now
    for (const t of times) {
        if (t.time > now) {
            return { name: t.name, time: t.time, remaining: t.time.getTime() - now.getTime() };
        }
    }

    // If all are passed, next is Fajr tomorrow (logic handled by caller usually, or we return null/Fajr of next day)
    // For simplicity here, we return null or handle it in the UI logic by calculating next day.
    // But let's return a "Tomorrow Fajr" indicator if needed.
    return { name: 'Fajr', time: prayerTimes.fajr, remaining: -1 }; // Caller should handle "passed"
};
