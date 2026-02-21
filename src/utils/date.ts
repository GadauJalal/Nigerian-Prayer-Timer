import { format, isValid, addDays } from 'date-fns';
import { getAccurateHijriDate, getAccurateHijriParts } from './islamicDate';

// Use Abuja coordinates for consistent national moon sighting calculation
const ABUJA_LAT = 9.0765;
const ABUJA_LNG = 7.3986;

export const formatDate = (date: Date, formatStr: string = 'EEEE, d MMMM yyyy') => {
    if (!isValid(date)) return 'Invalid Date';
    return format(date, formatStr);
};

export const formatTime = (date: Date) => {
    if (!isValid(date)) return '--:--';
    return format(date, 'h:mm a');
};

export const getHijriDate = (date: Date, lat?: number, lng?: number, adjustment?: number) => {
    const adj = adjustment || 0;
    const adjustedDate = adj !== 0 ? addDays(date, adj) : date;
    return getAccurateHijriDate(adjustedDate, ABUJA_LAT, ABUJA_LNG);
};

export const getHijriMonth = (date: Date, lat?: number, lng?: number, adjustment?: number) => {
    const adj = adjustment || 0;
    const adjustedDate = adj !== 0 ? addDays(date, adj) : date;
    const parts = getAccurateHijriParts(adjustedDate, ABUJA_LAT, ABUJA_LNG);
    return `${parts.monthName} ${parts.year}`;
};

export const getHijriParts = (date: Date, adjustment?: number) => {
    const adj = adjustment || 0;
    const adjustedDate = adj !== 0 ? addDays(date, adj) : date;
    return getAccurateHijriParts(adjustedDate, ABUJA_LAT, ABUJA_LNG);
};

