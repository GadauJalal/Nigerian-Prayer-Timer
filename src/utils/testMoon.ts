
import { getMoonData } from './moonCalculations';
import { getAccurateHijriDate } from './islamicDate';

const ABUJA_LAT = 9.0765;
const ABUJA_LNG = 7.3986;

console.log("Running Moon Calculation Tests (Abuja Coordinates)...");

// Test Case 1: Check a specific date
// We need to find a date where we know the outcome.
// Let's just run it for today and the next few days to see the output.
const today = new Date();
console.log(`\nTesting from Today: ${today.toISOString()}`);

for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    // Check Moon Data directly
    const moonData = getMoonData(d, ABUJA_LAT, ABUJA_LNG);
    console.log(`\nDate: ${d.toDateString()}`);
    console.log(`Moon Age: ${moonData.moonAgeHours.toFixed(2)} hours`);
    console.log(`Visible: ${moonData.isVisible}`);
    console.log(`Sunset: ${moonData.sunsetTime?.toISOString()}`);
    console.log(`Conjunction: ${moonData.conjunctionTime?.toISOString()}`);

    // Check Full Hijri Date
    const hDate = getAccurateHijriDate(d, ABUJA_LAT, ABUJA_LNG);
    console.log(`Hijri Date: ${hDate}`);
}

// Test Case 2: Specific Known Event
// Example: Shawwal 1445 (April 2024)
// Conjunction was April 8, 2024 around 18:21 UTC (Total Solar Eclipse day)
// sunset in Abuja on April 9?
const testDate = new Date('2024-04-09T12:00:00Z');
console.log(`\nTesting Specific Date: ${testDate.toDateString()}`);
const md = getMoonData(testDate, ABUJA_LAT, ABUJA_LNG);
console.log(`Moon Age: ${md.moonAgeHours.toFixed(2)} hours`);
console.log(`Visible: ${md.isVisible}`);
