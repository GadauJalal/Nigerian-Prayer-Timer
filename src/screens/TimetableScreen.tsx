import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Settings, Share2 } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { useThemeContext } from '../context/ThemeContext';
import { calculatePrayerTimes, PrayerTimeResult } from '../utils/prayerTimes';
import { formatDate, formatTime } from '../utils/date';
import { isSameDay, addDays } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { getHijriParts } from '../utils/date';
import { getGregorianDaysForHijriMonth, HIJRI_MONTHS_NAMES } from '../utils/islamicDate';
import { HijriCalibration } from '../components/HijriCalibration';

const TimetableScreen = ({ navigation }: any) => {
    const { location, adjustments, hijriAdjustment } = useApp();
    const { isDarkMode } = useThemeContext();
    const [showExportMenu, setShowExportMenu] = useState(false);

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

    const handleExportPDF = async () => {
        if (!timetable.length || !location) return;
        setShowExportMenu(false);

        const pdfHijriTitle = `${hijriMonthName} ${hijriYear} AH`;
        const totalDays = timetable.length;

        // Convert logo to base64 for embedding in PDF
        let logoBase64 = '';
        try {
            const asset = Asset.fromModule(require('../../assets/Prayerlogo.png'));
            await asset.downloadAsync();
            const base64 = await FileSystem.readAsStringAsync(asset.localUri!, { encoding: FileSystem.EncodingType.Base64 });
            logoBase64 = `data:image/png;base64,${base64}`;
        } catch (error) {
            console.error('Failed to load logo:', error);
        }

        // Convert app store badges to base64 for embedding in PDF
        let storeBadgesBase64 = '';
        try {
            const badgesAsset = Asset.fromModule(require('../../assets/app-store-and-google-play-badge-png.png'));
            await badgesAsset.downloadAsync();
            const badgesBase64 = await FileSystem.readAsStringAsync(badgesAsset.localUri!, { encoding: FileSystem.EncodingType.Base64 });
            storeBadgesBase64 = `data:image/png;base64,${badgesBase64}`;
        } catch (error) {
            console.error('Failed to load store badges:', error);
        }

        // Find the state name for the location
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
        const locationDisplay = stateName ? `${location.name}, ${stateName}` : location.name;

        // Dynamic sizing — compact enough so 30 days + dividers always fit one page
        const getDynamicSizes = (days: number) => {
            const estimatedRows = days + 3; // header + up to 2 month dividers
            if (estimatedRows <= 30) {
                return {
                    rowPadding: '4px 3px',
                    fontSize: '7px',
                    headerFontSize: '6.5px',
                    headerPadding: '5px 3px',
                    monthHeaderPadding: '4px 3px',
                };
            } else if (estimatedRows <= 32) {
                return {
                    rowPadding: '3.5px 2.5px',
                    fontSize: '6.5px',
                    headerFontSize: '6px',
                    headerPadding: '4.5px 2.5px',
                    monthHeaderPadding: '3.5px 2.5px',
                };
            } else {
                return {
                    rowPadding: '3px 2px',
                    fontSize: '6px',
                    headerFontSize: '5.5px',
                    headerPadding: '4px 2px',
                    monthHeaderPadding: '3px 2px',
                };
            }
        };

        const sizes = getDynamicSizes(totalDays);

        // Build table rows — detect Gregorian month changes for sub-heading dividers
        let tableRows = '';
        let previousGregorianMonth = -1;
        // Get the initial Gregorian month name for the first column header
        const firstGregorianMonth = timetable[0].date.toLocaleDateString('en-US', { month: 'long' });

        timetable.forEach((item, index) => {
            const hijriDay = index + 1; // Days of the Hijri month: 1, 2, 3...
            const gregorianMonthNum = item.date.getMonth();
            const gregorianMonthName = item.date.toLocaleDateString('en-US', { month: 'long' });
            const dayName = item.date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNumber = item.date.getDate();
            const isFriday = item.date.getDay() === 5;

            // Add a Gregorian month divider when the Gregorian month changes
            if (previousGregorianMonth !== -1 && gregorianMonthNum !== previousGregorianMonth) {
                tableRows += `
            <tr class="month-separator">
              <td colspan="9" class="month-header-cell">
                ${gregorianMonthName} ${item.date.getFullYear()}
              </td>
            </tr>`;
            }

            // Add data row — Hijri day first, then Gregorian date
            tableRows += `
            <tr${isFriday ? ' class="friday-row"' : ''}>
              <td class="islamic-col">${hijriDay}</td>
              <td class="date-col">${dayNumber.toString().padStart(2, '0')}</td>
              <td class="day-col">${dayName}</td>
              <td>${formatTime(item.prayers.fajr)}</td>
              <td>${formatTime(item.prayers.sunrise)}</td>
              <td>${formatTime(item.prayers.zuhr)}</td>
              <td>${formatTime(item.prayers.asr)}</td>
              <td>${formatTime(item.prayers.maghrib)}</td>
              <td>${formatTime(item.prayers.isha)}</td>
            </tr>`;

            previousGregorianMonth = gregorianMonthNum;
        });

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 0;
      size: A4 landscape;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #f9fafb;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      background: #f9fafb;
      width: 297mm;
      height: 210mm;
      padding: 8px 18px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
      gap: 12px;
      flex-shrink: 0;
    }

    .header-left {
      flex: 1;
      text-align: left;
    }

    .header-right {
      flex: 0 0 auto;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .logo-container {
      margin-bottom: 1px;
    }

    .logo {
      width: 32px;
      height: auto;
      display: inline-block;
    }

    .generated-by {
      font-size: 6px;
      color: #374151;
      font-weight: 600;
      margin: 0 0 1px 0;
      white-space: nowrap;
      line-height: 1.1;
    }

    .app-stores {
      display: flex;
      flex-direction: column;
      gap: 2px;
      align-items: center;
    }

    .store-badge {
      height: 15px;
      width: auto;
    }

    h1 {
      color: #1F2937;
      margin: 0 0 1px 0;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: -0.3px;
      line-height: 1.1;
    }

    .hijri-date {
      color: #10B981;
      font-size: 9px;
      margin: 0 0 1px 0;
      font-weight: 600;
      line-height: 1.1;
    }

    .location {
      color: #6B7280;
      font-size: 7.5px;
      margin: 0;
      line-height: 1.1;
    }

    .table-container {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 5px;
      overflow: hidden;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    }

    th, td {
      padding: ${sizes.rowPadding};
      text-align: center;
      font-size: ${sizes.fontSize};
      line-height: 1.2;
    }

    th {
      background-color: #10B981;
      color: white;
      font-weight: 600;
      font-size: ${sizes.headerFontSize};
      text-transform: uppercase;
      letter-spacing: 0.2px;
      padding: ${sizes.headerPadding};
    }

    td {
      border-bottom: 1px solid #E5E7EB;
      color: #374151;
      font-weight: 500;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:nth-child(even):not(.month-separator):not(.friday-row) {
      background-color: #F9FAFB;
    }

    .date-col {
      font-weight: 600;
      color: #1F2937;
    }

    .islamic-col {
      font-weight: 600;
      color: #1F2937;
    }

    .day-col {
      font-weight: 500;
      color: #374151;
    }

    .friday-row {
      background-color: #ECFDF5 !important;
    }

    .friday-row td {
      color: #047857;
      font-weight: 600;
    }

    .month-separator {
      background-color: #374151 !important;
    }

    .month-header-cell {
      background-color: #374151;
      color: white;
      font-weight: 600;
      text-align: left;
      padding: ${sizes.monthHeaderPadding} !important;
      font-size: ${sizes.fontSize};
      text-transform: capitalize;
      border-bottom: 1px solid #4B5563 !important;
    }

    /* Print-specific optimizations */
    @media print {
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
      }

      .page {
        margin: 0;
        page-break-inside: avoid;
        page-break-after: avoid;
      }

      .table-container {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- Single Page: All days -->
  <div class="page">
    <div class="header">
      <div class="header-left">
        ${logoBase64 ? `<div class="logo-container">
          <img src="${logoBase64}" alt="Prayer Times Nigeria Logo" class="logo">
        </div>` : ''}

        <h1>Monthly Prayer Times in ${locationDisplay}</h1>
        <p class="hijri-date">${pdfHijriTitle}</p>
        <p class="location">${gregorianSubHeading}</p>
      </div>

      <div class="header-right">
        <p class="generated-by">Generated by<br>Prayer Times Nigeria</p>
        ${storeBadgesBase64 ? `<div class="app-stores">
          <img src="${storeBadgesBase64}" alt="Download on App Store and Google Play" class="store-badge">
        </div>` : ''}
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>${hijriMonthName}</th>
            <th>${firstGregorianMonth}</th>
            <th>Day</th>
            <th>Fajr</th>
            <th>Sunrise</th>
            <th>Dhuhr</th>
            <th>Asr</th>
            <th>Maghrib</th>
            <th>Isha</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
    `;

        try {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            Alert.alert('Error', 'Failed to generate or share PDF.');
            console.error(error);
        }
    };

    const handleShare = async () => {
        setShowExportMenu(false);
        if (!timetable.length || !location) return;

        let message = `Prayer Timetable - ${HIJRI_MONTHS_NAMES[hijriMonth - 1]} ${hijriYear}\n${location.name}\n\n`;

        timetable.forEach(item => {
            const date = formatDate(item.date, 'd MMM');
            const fajr = formatTime(item.prayers.fajr);
            const zuhr = formatTime(item.prayers.zuhr);
            const asr = formatTime(item.prayers.asr);
            const maghrib = formatTime(item.prayers.maghrib);
            const isha = formatTime(item.prayers.isha);
            message += `${date}: Fajr ${fajr}, Zuhr ${zuhr}, Asr ${asr}, Maghrib ${maghrib}, Isha ${isha}\n`;
        });

        try {
            if (await Sharing.isAvailableAsync()) {
                // Create a temporary text file to share
                const htmlContent = `<pre>${message}</pre>`;
                const { uri } = await Print.printToFileAsync({ html: htmlContent });
                await Sharing.shareAsync(uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to share timetable.');
            console.error(error);
        }
    };

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
                                onPress={handleExportPDF}
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

export default TimetableScreen;