import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Settings, Share2 } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { useThemeContext } from '../context/ThemeContext';
import { calculatePrayerTimes, PrayerTimeResult } from '../utils/prayerTimes';
import { formatTime } from '../utils/date';
import { isSameDay, addDays } from 'date-fns';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { getHijriParts } from '../utils/date';
import { getGregorianDaysForHijriMonth, HIJRI_MONTHS_NAMES } from '../utils/islamicDate';
import { HijriCalibration } from '../components/HijriCalibration';

const TimetableScreen = ({ navigation }: any) => {
    const { location, adjustments, hijriAdjustment } = useApp();
    const { isDarkMode } = useThemeContext();
    const [isExporting, setIsExporting] = useState(false);
    const exportRef = useRef<View>(null);

    // Initialize with the current Hijri month/year
    const currentHijri = useMemo(() => getHijriParts(new Date(), hijriAdjustment), [hijriAdjustment]);
    const [hijriYear, setHijriYear] = useState(currentHijri.year);
    const [hijriMonth, setHijriMonth] = useState(currentHijri.month);

    const [timetable, setTimetable] = useState<{ date: Date; prayers: PrayerTimeResult }[]>([]);

    useEffect(() => {
        if (location) {
            generateTimetable();
        }
    }, [location, hijriYear, hijriMonth, adjustments, hijriAdjustment]);

    const generateTimetable = () => {
        if (!location) return;

        const { days } = getGregorianDaysForHijriMonth(hijriYear, hijriMonth);

        // Apply hijri adjustment: shift the Gregorian days
        const adjustedDays = hijriAdjustment
            ? days.map(d => addDays(d, -hijriAdjustment))
            : days;

        const newTimetable = adjustedDays.map(day => ({
            date: day,
            prayers: calculatePrayerTimes(location.lat, location.lng, day, adjustments),
        }));

        setTimetable(newTimetable);
    };

    const handlePrevMonth = () => {
        if (hijriMonth === 1) {
            setHijriMonth(12);
            setHijriYear(hijriYear - 1);
        } else {
            setHijriMonth(hijriMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (hijriMonth === 12) {
            setHijriMonth(1);
            setHijriYear(hijriYear + 1);
        } else {
            setHijriMonth(hijriMonth + 1);
        }
    };

    // Hijri display values
    const hijriMonthName = HIJRI_MONTHS_NAMES[hijriMonth - 1];
    const hijriDisplay = `${hijriMonthName} ${hijriYear}`;

    // Compute Gregorian range for sub-heading
    const gregorianSubHeading = useMemo(() => {
        if (!timetable.length) return '';
        const firstDate = timetable[0].date;
        const lastDate = timetable[timetable.length - 1].date;
        const firstMonth = firstDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const lastMonth = lastDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (firstMonth === lastMonth) return firstMonth;
        const firstShort = firstDate.toLocaleDateString('en-US', { month: 'long' });
        const lastFull = lastDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return `${firstShort} - ${lastFull}`;
    }, [timetable]);

    const handleSettings = () => {
        navigation.getParent()?.navigate('Settings');
    };

    // Compute location display name with state
    const locationDisplay = useMemo(() => {
        if (!location) return '';
        const NIGERIA_LOCATIONS = require('../data/nigeria_locations').NIGERIA_LOCATIONS;
        let stateName = '';
        for (const state of NIGERIA_LOCATIONS) {
            const cityExists = state.cities.find((city: any) =>
                city.name === location.name &&
                city.lat === location.lat &&
                city.lng === location.lng
            );
            if (cityExists) {
                stateName = state.name;
                break;
            }
        }
        return stateName ? `${location.name}, ${stateName}` : location.name;
    }, [location]);

    // First Gregorian month name for table header
    const firstGregorianMonth = useMemo(() => {
        if (!timetable.length) return '';
        return timetable[0].date.toLocaleDateString('en-US', { month: 'long' });
    }, [timetable]);

    const handleExportImage = async () => {
        if (!timetable.length || !location) return;
        setIsExporting(true);
    };

    const onExportViewLayout = useCallback(async () => {
        if (!isExporting || !exportRef.current) return;

        try {
            // Allow time for images and layout to fully render
            await new Promise(resolve => setTimeout(resolve, 400));

            const uri = await captureRef(exportRef, {
                format: 'png',
                quality: 1,
            });

            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                UTI: 'public.png',
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to generate image.');
            console.error(error);
        } finally {
            setIsExporting(false);
        }
    }, [isExporting]);

    if (!location) {
        return (
            <View style={[styles.container, isDarkMode && styles.containerDark]}>
                <View style={styles.centerContainer}>
                    <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
                        Please select a location first.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, isDarkMode && styles.containerDark]}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerCenter}>
                        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
                            Prayer Calendar
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleSettings}
                        style={[styles.iconButton, isDarkMode ? styles.iconButtonDark : styles.iconButtonLight]}
                        activeOpacity={0.7}
                    >
                        <Settings size={18} color={isDarkMode ? '#CBD5E1' : '#475569'} />
                    </TouchableOpacity>
                </View>


                {/* Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hijri Calibration */}
                    <HijriCalibration isDarkMode={isDarkMode} />

                    {/* Month Card */}
                    <View style={[styles.monthCard, isDarkMode ? styles.monthCardDark : styles.monthCardLight]}>
                        <View style={styles.monthCardContent}>
                            <TouchableOpacity
                                onPress={handlePrevMonth}
                                style={styles.monthNavButton}
                                activeOpacity={0.7}
                            >
                                <ChevronLeft size={24} color={isDarkMode ? '#CBD5E1' : '#64748B'} />
                            </TouchableOpacity>

                            <View style={styles.monthInfo}>
                                <Text style={[styles.monthTitle, isDarkMode && styles.monthTitleDark]}>
                                    {hijriDisplay}
                                </Text>
                                <Text style={[styles.hijriMonth, isDarkMode && styles.hijriMonthDark]}>
                                    {gregorianSubHeading}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={handleExportImage}
                                style={styles.monthNavButton}
                                activeOpacity={0.7}
                            >
                                <Share2 size={20} color={isDarkMode ? '#CBD5E1' : '#64748B'} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleNextMonth}
                                style={styles.monthNavButton}
                                activeOpacity={0.7}
                            >
                                <ChevronRight size={24} color={isDarkMode ? '#CBD5E1' : '#64748B'} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Timetable Card */}
                    <View style={[styles.timetableCard, isDarkMode ? styles.timetableCardDark : styles.timetableCardLight]}>
                        {/* Table Header */}
                        <View style={[styles.tableHeader, isDarkMode && styles.tableHeaderDark]}>
                            <Text style={[styles.headerCell, styles.dayCell, isDarkMode && styles.headerCellDark]}>
                                DAY
                            </Text>
                            <Text style={[styles.headerCell, isDarkMode && styles.headerCellDark]}>FAJR</Text>
                            <Text style={[styles.headerCell, isDarkMode && styles.headerCellDark]}>DHUHR</Text>
                            <Text style={[styles.headerCell, isDarkMode && styles.headerCellDark]}>ASR</Text>
                            <Text style={[styles.headerCell, isDarkMode && styles.headerCellDark]}>MAGHRIB</Text>
                            <Text style={[styles.headerCell, isDarkMode && styles.headerCellDark]}>ISHA</Text>
                        </View>

                        {/* Table Body - Scrollable */}
                        <ScrollView
                            style={styles.tableBody}
                            showsVerticalScrollIndicator={true}
                            nestedScrollEnabled={true}
                        >
                            {timetable.map((item, index) => {
                                const isToday = isSameDay(item.date, new Date());
                                const isLastRow = index === timetable.length - 1;
                                const dayName = item.date.toLocaleDateString('en-US', { weekday: 'short' });
                                const hijriDay = index + 1; // Hijri day of the month

                                return (
                                    <View
                                        key={item.date.toISOString()}
                                        style={[
                                            styles.tableRow,
                                            isToday && (isDarkMode ? styles.todayRowDark : styles.todayRowLight),
                                            !isLastRow && (isDarkMode ? styles.rowBorderDark : styles.rowBorderLight),
                                        ]}
                                    >
                                        <View style={[styles.dayCell, styles.cellContainer]}>
                                            <Text style={[styles.dayNumber, isToday && styles.todayText, isDarkMode && styles.cellDark]}>
                                                {hijriDay}
                                            </Text>
                                            <Text style={[styles.dayName, isToday && styles.todayText, isDarkMode && styles.dayNameDark]}>
                                                {dayName}
                                            </Text>
                                        </View>
                                        <Text style={[styles.cell, isToday && styles.todayText, isDarkMode && styles.cellDark]}>
                                            {item.prayers.fajr.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </Text>
                                        <Text style={[styles.cell, isToday && styles.todayText, isDarkMode && styles.cellDark]}>
                                            {item.prayers.zuhr.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </Text>
                                        <Text style={[styles.cell, isToday && styles.todayText, isDarkMode && styles.cellDark]}>
                                            {item.prayers.asr.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </Text>
                                        <Text style={[styles.cell, isToday && styles.todayText, isDarkMode && styles.cellDark]}>
                                            {item.prayers.maghrib.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </Text>
                                        <Text style={[styles.cell, isToday && styles.todayText, isDarkMode && styles.cellDark]}>
                                            {item.prayers.isha.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </Text>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Footer */}
                    <Text style={[styles.footerText, isDarkMode && styles.footerTextDark]}>
                        Prayer times for {location.name} • Times in 24-hour format
                    </Text>
                </ScrollView>
            </SafeAreaView>

            {/* Hidden export view — rendered full-screen, captured as image */}
            {isExporting && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f9fafb', zIndex: 9999 }]}>
                    <View
                        ref={exportRef}
                        collapsable={false}
                        onLayout={onExportViewLayout}
                        style={exportStyles.page}
                    >
                        {/* Header */}
                        <View style={exportStyles.header}>
                            <View style={exportStyles.headerLeft}>
                                <Image
                                    source={require('../../assets/Prayerlogo.png')}
                                    style={exportStyles.logo}
                                    resizeMode="contain"
                                />
                                <Text style={exportStyles.title}>
                                    Monthly Prayer Times in {locationDisplay}
                                </Text>
                                <Text style={exportStyles.hijriDate}>
                                    {hijriMonthName} {hijriYear} AH
                                </Text>
                                <Text style={exportStyles.subtitle}>
                                    {gregorianSubHeading}
                                </Text>
                            </View>
                            <View style={exportStyles.headerRight}>
                                <Text style={exportStyles.generatedBy}>
                                    Generated by{'\n'}Prayer Times Nigeria
                                </Text>
                                <Image
                                    source={require('../../assets/app-store-and-google-play-badge-png.png')}
                                    style={exportStyles.storeBadge}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>

                        {/* Table */}
                        <View style={exportStyles.table}>
                            {/* Table header row */}
                            <View style={exportStyles.tableHeaderRow}>
                                <Text style={[exportStyles.th, exportStyles.colNarrow]}>{hijriMonthName.substring(0, 3)}</Text>
                                <Text style={[exportStyles.th, exportStyles.colNarrow]}>{firstGregorianMonth.substring(0, 3)}</Text>
                                <Text style={[exportStyles.th, exportStyles.colNarrow]}>Day</Text>
                                <Text style={[exportStyles.th, exportStyles.colWide]}>Fajr</Text>
                                <Text style={[exportStyles.th, exportStyles.colWide]}>Sunrise</Text>
                                <Text style={[exportStyles.th, exportStyles.colWide]}>Dhuhr</Text>
                                <Text style={[exportStyles.th, exportStyles.colWide]}>Asr</Text>
                                <Text style={[exportStyles.th, exportStyles.colWide]}>Maghrib</Text>
                                <Text style={[exportStyles.th, exportStyles.colWide]}>Isha</Text>
                            </View>

                            {/* Table body rows */}
                            {timetable.map((item, index) => {
                                const isFriday = item.date.getDay() === 5;
                                const prevMonth = index > 0 ? timetable[index - 1].date.getMonth() : item.date.getMonth();
                                const showMonthDivider = index > 0 && item.date.getMonth() !== prevMonth;

                                return (
                                    <React.Fragment key={index}>
                                        {showMonthDivider && (
                                            <View style={exportStyles.monthDivider}>
                                                <Text style={exportStyles.monthDividerText}>
                                                    {item.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={[
                                            exportStyles.tableRow,
                                            isFriday && exportStyles.fridayRow,
                                            index % 2 === 1 && !isFriday && exportStyles.evenRow,
                                        ]}>
                                            <Text style={[exportStyles.td, exportStyles.colNarrow, exportStyles.tdBold, isFriday && exportStyles.fridayText]}>
                                                {index + 1}
                                            </Text>
                                            <Text style={[exportStyles.td, exportStyles.colNarrow, exportStyles.tdBold, isFriday && exportStyles.fridayText]}>
                                                {item.date.getDate().toString().padStart(2, '0')}
                                            </Text>
                                            <Text style={[exportStyles.td, exportStyles.colNarrow, isFriday && exportStyles.fridayText]}>
                                                {item.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </Text>
                                            <Text style={[exportStyles.td, exportStyles.colWide, isFriday && exportStyles.fridayText]}>
                                                {formatTime(item.prayers.fajr)}
                                            </Text>
                                            <Text style={[exportStyles.td, exportStyles.colWide, isFriday && exportStyles.fridayText]}>
                                                {formatTime(item.prayers.sunrise)}
                                            </Text>
                                            <Text style={[exportStyles.td, exportStyles.colWide, isFriday && exportStyles.fridayText]}>
                                                {formatTime(item.prayers.zuhr)}
                                            </Text>
                                            <Text style={[exportStyles.td, exportStyles.colWide, isFriday && exportStyles.fridayText]}>
                                                {formatTime(item.prayers.asr)}
                                            </Text>
                                            <Text style={[exportStyles.td, exportStyles.colWide, isFriday && exportStyles.fridayText]}>
                                                {formatTime(item.prayers.maghrib)}
                                            </Text>
                                            <Text style={[exportStyles.td, exportStyles.colWide, isFriday && exportStyles.fridayText]}>
                                                {formatTime(item.prayers.isha)}
                                            </Text>
                                        </View>
                                    </React.Fragment>
                                );
                            })}
                        </View>

                        {/* Footer */}
                        <Text style={exportStyles.footer}>
                            Generated by Prayer Times Nigeria App
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        position: 'relative',
    },
    containerDark: {
        backgroundColor: '#0B1120',
    },
    ambientGlow: {
        position: 'absolute',
        top: '40%',
        left: '50%',
        width: 400,
        height: 400,
        marginLeft: -200,
        marginTop: -200,
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderRadius: 200,
    },
    ambientGlowDark: {
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    safeArea: {
        flex: 1,
        position: 'relative',
        zIndex: 10,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#64748B',
    },
    emptyTextDark: {
        color: '#94A3B8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        position: 'relative',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0F172A',
    },
    headerTitleDark: {
        color: '#F9FAFB',
    },
    iconButton: {
        position: 'absolute',
        right: 24,
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    iconButtonLight: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
    },
    iconButtonDark: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
    },
    exportMenu: {
        position: 'absolute',
        top: 80,
        right: 24,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        zIndex: 100,
        minWidth: 180,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    exportMenuLight: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
    },
    exportMenuDark: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
    },
    exportMenuItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    exportMenuText: {
        fontSize: 14,
        color: '#334155',
    },
    exportMenuTextDark: {
        color: '#CBD5E1',
    },
    exportMenuDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    exportMenuDividerDark: {
        backgroundColor: '#334155',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 120,
        gap: 16,
    },
    monthCard: {
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    monthCardLight: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
    },
    monthCardDark: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
    },
    monthCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        gap: 12,
    },
    monthNavButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthInfo: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    monthTitle: {
        fontSize: 20,
        fontWeight: '400',
        color: '#0F172A',
    },
    monthTitleDark: {
        color: '#F9FAFB',
    },
    hijriMonth: {
        fontSize: 13,
        color: '#64748B',
    },
    hijriMonthDark: {
        color: '#94A3B8',
    },
    timetableCard: {
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
        maxHeight: 500,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    timetableCardLight: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
    },
    timetableCardDark: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#E2E8F0',
    },
    tableBody: {
        maxHeight: 450,
    },
    tableHeaderDark: {
        borderBottomColor: '#334155',
    },
    headerCell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
        color: '#64748B',
        textTransform: 'uppercase',
    },
    headerCellDark: {
        color: '#94A3B8',
    },
    dayCell: {
        flex: 0.8,
    },
    cellContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 2,
    },
    dayName: {
        fontSize: 10,
        color: '#64748B',
        textTransform: 'capitalize',
    },
    dayNameDark: {
        color: '#94A3B8',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    rowBorderLight: {
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    rowBorderDark: {
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    todayRowLight: {
        backgroundColor: '#059669',
    },
    todayRowDark: {
        backgroundColor: '#047857',
    },
    cell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 13,
        color: '#475569',
        fontVariant: ['tabular-nums'],
    },
    cellDark: {
        color: '#94A3B8',
    },
    todayText: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    footerText: {
        fontSize: 11,
        textAlign: 'center',
        color: '#94A3B8',
        marginTop: 16,
        marginBottom: 8,
    },
    footerTextDark: {
        color: '#64748B',
    },
});

// Styles for the image export view (compact portrait layout)
const exportStyles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: '#f9fafb',
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        alignItems: 'center',
        gap: 2,
    },
    logo: {
        width: 28,
        height: 28,
        marginBottom: 2,
    },
    title: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 1,
    },
    hijriDate: {
        fontSize: 9,
        fontWeight: '600',
        color: '#10B981',
        marginBottom: 1,
    },
    subtitle: {
        fontSize: 7.5,
        color: '#6B7280',
    },
    generatedBy: {
        fontSize: 6,
        color: '#374151',
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 8,
    },
    storeBadge: {
        width: 80,
        height: 15,
        marginTop: 2,
    },
    table: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#10B981',
        paddingVertical: 5,
        paddingHorizontal: 4,
    },
    th: {
        textAlign: 'center',
        fontSize: 7,
        fontWeight: '600',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 0.2,
    },
    colNarrow: {
        width: 30,
    },
    colWide: {
        flex: 1,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 4,
        paddingHorizontal: 4,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E7EB',
    },
    evenRow: {
        backgroundColor: '#F9FAFB',
    },
    fridayRow: {
        backgroundColor: '#ECFDF5',
    },
    td: {
        textAlign: 'center',
        fontSize: 7.5,
        color: '#374151',
        fontWeight: '500',
    },
    tdBold: {
        fontWeight: '600',
        color: '#1F2937',
    },
    fridayText: {
        color: '#047857',
        fontWeight: '600',
    },
    monthDivider: {
        backgroundColor: '#374151',
        paddingVertical: 3,
        paddingHorizontal: 6,
    },
    monthDividerText: {
        color: '#FFFFFF',
        fontSize: 7,
        fontWeight: '600',
    },
    footer: {
        textAlign: 'center',
        fontSize: 7,
        color: '#9CA3AF',
        marginTop: 6,
    },
});

export default TimetableScreen;