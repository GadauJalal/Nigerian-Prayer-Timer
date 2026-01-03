import { format, isValid } from 'date-fns';
import hijri from 'hijri';

export const formatDate = (date: Date, formatStr: string = 'EEEE, d MMMM yyyy') => {
    if (!isValid(date)) return 'Invalid Date';
    return format(date, formatStr);
};

export const formatTime = (date: Date) => {
    if (!isValid(date)) return '--:--';
    return format(date, 'h:mm a');
};

export const getHijriDate = (date: Date) => {
    const hijriResult = hijri.convert(date);
    const hijriMonths = [
        'Muharram', 'Safar', 'Rabi\' Al-Awwal', 'Rabi\' Al-Thani',
        'Jumada Al-Awwal', 'Jumada Al-Thani', 'Rajab', 'Sha\'ban',
        'Ramadan', 'Shawwal', 'Dhu Al-Qi\'dah', 'Dhu Al-Hijjah'
    ];
    return `${hijriResult.dayOfMonth} ${hijriMonths[hijriResult.month - 1]} ${hijriResult.year}`;
};

export const getHijriMonth = (date: Date) => {
    const hijriResult = hijri.convert(date);
    const hijriMonths = [
        'Muharram', 'Safar', 'Rabi\' Al-Awwal', 'Rabi\' Al-Thani',
        'Jumada Al-Awwal', 'Jumada Al-Thani', 'Rajab', 'Sha\'ban',
        'Ramadan', 'Shawwal', 'Dhu Al-Qi\'dah', 'Dhu Al-Hijjah'
    ];
    return `${hijriMonths[hijriResult.month - 1]} ${hijriResult.year}`;
}
