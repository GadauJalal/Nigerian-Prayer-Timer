import { Body, SearchMoonQuarter, SearchRiseSet, Observer, Equator, Horizon } from 'astronomy-engine';

/**
 * Calculates relevant moon data for Islamic month determination.
 * 
 * @param date The date to check (should be the 29th of the Islamic month)
 * @param lat Latitude of the observer
 * @param lng Longitude of the observer
 * @returns Object containing moon age details and visibility status
 */
/**
 * Calculates relevant moon data for Islamic month determination.
 * 
 * @param date The date to check (should be the 29th of the Islamic month)
 * @param lat Latitude of the observer
 * @param lng Longitude of the observer
 * @returns Object containing moon age details and visibility status
 */
export const getMoonData = (date: Date, lat: number, lng: number) => {
    const observer = new Observer(lat, lng, 0); // Elevation 0 for simplicity

    // 1. Calculate Local Sunset Time on this date
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    // Search for sunset after dayStart (limit 1 day). Direction -1 = setting.
    const sunsetEvent = SearchRiseSet(Body.Sun, observer, -1, dayStart, 1);

    if (!sunsetEvent) {
        return { moonAgeHours: 0, isVisible: false, sunsetTime: null, debug: "No sunset found" };
    }

    const sunsetTime = sunsetEvent.date;

    // 2. Find the Previous New Moon (Conjunction) before this Sunset

    // Strategy: Search backwards from Sunset to find the most recent Conjunction.
    // SearchMoonQuarter returns the *next* quarter event after the given date.
    // So we pick a date sufficiently in the past (e.g., 30 days ago) and find all New Moons
    // up to the Sunset time, picking the last one.

    let conjunctionTime: Date | null = null;

    // Start searching from 35 days before generic enough to catch the cycle
    const searchStart = new Date(sunsetTime.getTime() - 35 * 24 * 60 * 60 * 1000);
    let searchDate = searchStart;

    while (true) {
        const nm = SearchMoonQuarter(searchDate);

        if (nm.quarter === 0) { // New Moon
            if (nm.time.date.getTime() < sunsetTime.getTime()) {
                // This is a candidate, keep it and search for a later one
                conjunctionTime = nm.time.date;
                // Advance searchDate to slightly after this new moon to find the next one
                searchDate = new Date(nm.time.date.getTime() + 1 * 60 * 60 * 1000); // +1 hour
            } else {
                // This New Moon is after Sunset, so the *previous* one (already in conjunctionTime) is the correct one.
                break;
            }
        } else {
            // Not a new moon, just advance a bit (e.g. 1 day) or better, use the date returned and add a bit
            // SearchMoonQuarter returns the NEXT phase. If it's not New Moon, we can skip past it?
            // Actually SearchMoonQuarter searches for *any* quarter. 
            // We just want New Moon.
            // Let's just increment safely.
            searchDate = new Date(nm.time.date.getTime() + 1 * 60 * 60 * 1000);
        }

        // Safety break if we go past sunset
        if (searchDate.getTime() > sunsetTime.getTime()) {
            break;
        }
    }

    if (!conjunctionTime) {
        // Fallback: try a tighter search if the loop failed (unlikely)
        // Or just return failure.
        // Let's try one direct search from 4 days ago simply.
        const nearPast = new Date(sunsetTime.getTime() - 4 * 24 * 60 * 60 * 1000);
        const nm = SearchMoonQuarter(nearPast);
        if (nm.quarter === 0 && nm.time.date.getTime() < sunsetTime.getTime()) {
            conjunctionTime = nm.time.date;
        }
    }

    if (!conjunctionTime) {
        return { moonAgeHours: 0, isVisible: false, sunsetTime, conjunctionTime: null };
    }

    // 3. Calculate Moon Age in Hours at Sunset
    const diffMs = sunsetTime.getTime() - conjunctionTime.getTime();
    const moonAgeHours = diffMs / (1000 * 60 * 60);

    // 4. Determine Visibility based on Strict Requirements

    // Condition 1: Moon Age >= 18.0 hours
    const isAgeValid = moonAgeHours >= 18.0;

    // Condition 2: Crescent Visibility = YES
    // The requirement says: 
    // "If moon age is < 18.0 hours, crescent visibility SHALL be considered NO"
    // "A new month may begin only after a valid crescent visibility determination."
    // "Decision Logic: If Moon Age >= 18h AND Crescent Visibility = YES -> Start Month"

    // We strictly interpret "Crescent Visibility" here as the result of this function.
    // If age is valid opacity/size is likely sufficient, but the user spec separates "Age" and "Visibility".
    // Usually "Visibility" implies it is physically above the horizon and conditions allow seeing it.
    // We will add the check that Moon must be above horizon at sunset.

    let isVisible = false;

    if (isAgeValid) {
        // Strict Check: Moon must be above the horizon at sunset
        const moonPos = Equator(Body.Moon, sunsetTime, observer, true, true);
        const moonHor = Horizon(sunsetTime, observer, moonPos.ra, moonPos.dec, 'normal');

        if (moonHor.altitude > 0) {
            // Above horizon AND Age >= 18h
            isVisible = true;
        }
    }

    // The spec emphasizes: "If moon age < 18.0, visibility SHALL be NO". 
    // Our logic `if (isAgeValid)` covers this (isVisible remains false).

    return {
        moonAgeHours,
        isVisible, // This is the binary YES/NO decision
        sunsetTime,
        conjunctionTime
    };
};
