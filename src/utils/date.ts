import { format, isValid } from 'date-fns';

export const formatDate = (date: Date, formatStr: string = 'EEEE, d MMMM yyyy') => {
    if (!isValid(date)) return 'Invalid Date';
    return format(date, formatStr);
};

export const formatTime = (date: Date) => {
    if (!isValid(date)) return '--:--';
    return format(date, 'h:mm a');
};

export const getHijriDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
};

export const getHijriMonth = (date: Date) => {
    return new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
        month: 'long',
    }).format(date);
}
