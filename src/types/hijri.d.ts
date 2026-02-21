declare module 'hijri' {
    export function convert(date: Date): {
        dayOfMonth: number;
        month: number;
        year: number;
    };
}
