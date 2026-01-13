import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Settings, Share2 } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { useThemeContext } from '../context/ThemeContext';
import { calculatePrayerTimes, PrayerTimeResult } from '../utils/prayerTimes';
import { formatDate, formatTime, getHijriMonth } from '../utils/date';
import { startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

const TimetableScreen = ({ navigation }: any) => {
    const { location, adjustments } = useApp();
    const { isDarkMode } = useThemeContext();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [timetable, setTimetable] = useState<{ date: Date; prayers: PrayerTimeResult }[]>([]);
    const [showExportMenu, setShowExportMenu] = useState(false);

    useEffect(() => {
        if (location) {
            generateTimetable();
        }
    }, [location, currentMonth, adjustments]);

    const generateTimetable = () => {
        if (!location) return;

        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start, end });

        const newTimetable = days.map(day => ({
            date: day,
            prayers: calculatePrayerTimes(location.lat, location.lng, day, adjustments),
        }));

        setTimetable(newTimetable);
    };

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const handleSettings = () => {
        navigation.getParent()?.navigate('Settings');
    };

    const handleExportPDF = async () => {
        if (!timetable.length || !location) return;
        setShowExportMenu(false);

        const monthName = currentMonth.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
        const hijriMonth = getHijriMonth(currentMonth);

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

        // Split timetable: first 13 days on page 1, rest on page 2
        const firstHalf = timetable.slice(0, 13);
        const secondHalf = timetable.slice(13);

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { 
      margin: 0; 
      size: A4 portrait;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
      margin: 0; 
      padding: 0; 
      background: #f9fafb;
    }
    
    .page {
      background: #f9fafb;
      width: 210mm;
      height: 297mm;
      padding: 40px 35px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }
    
    .page-break {
      page-break-after: always;
      break-after: page;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 24px;
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
      gap: 6px;
    }
    
    .logo-container {
      margin-bottom: 8px;
    }
    
    .logo {
      width: 80px;
      height: auto;
      display: inline-block;
    }
    
    .app-name {
      font-size: 13px;
      font-weight: 600;
      color: #1F2937;
      margin: 6px 0 18px 0;
    }
    
    .generated-by {
      font-size: 10px;
      color: #374151;
      font-weight: 600;
      margin: 0 0 6px 0;
      white-space: nowrap;
      line-height: 1.3;
    }
    
    .app-stores {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
    }
    
    .store-badge {
      height: 32px;
      width: auto;
    }
    
    h1 { 
      color: #1F2937; 
      margin: 0 0 6px 0; 
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }
    
    h2 { 
      color: #1F2937; 
      font-size: 22px; 
      font-weight: 600; 
      margin: 0 0 8px 0;
      line-height: 1.2;
    }
    
    .hijri-date { 
      color: #10B981; 
      font-size: 14px; 
      margin: 0 0 3px 0;
      font-weight: 500;
      line-height: 1.3;
    }
    
    .location { 
      color: #6B7280; 
      font-size: 13px; 
      margin: 0;
      line-height: 1.3;
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
      border-radius: 10px; 
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    th, td { 
      padding: 10px 6px; 
      text-align: center;
      font-size: 12px;
    }
    
    th { 
      background-color: #10B981; 
      color: white; 
      font-weight: 600; 
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.2;
    }
    
    td { 
      border-bottom: 1px solid #E5E7EB; 
      color: #374151;
      font-weight: 500;
      line-height: 1.2;
    }
    
    tr:last-child td { 
      border-bottom: none; 
    }
    
    tr:nth-child(even) {
      background-color: #F9FAFB;
    }
    
    .day-cell {
      font-weight: 600;
      color: #1F2937;
      font-size: 13px;
    }
    
    .day-name {
      font-size: 9px;
      color: #9CA3AF;
      display: block;
      margin-top: 2px;
      font-weight: 400;
      line-height: 1;
    }
    
    .friday-row {
      background-color: #ECFDF5 !important;
    }
    
    .friday-row .day-cell {
      color: #10B981;
      font-weight: 700;
    }
    
    /* Print-specific optimizations */
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      
      .page {
        margin: 0;
        padding: 40px 35px;
      }
      
      .page-break {
        page-break-after: always;
        break-after: page;
      }
    }
  </style>
</head>
<body>
  <!-- PAGE 1: Days 1-13 -->
  <div class="page page-break">
    <div class="header">
      <div class="header-left">
        ${logoBase64 ? `<div class="logo-container">
          <img src="${logoBase64}" alt="Prayer Times Nigeria Logo" class="logo">
        </div>` : ''}
        
        <h1>Prayer Timetable</h1>
        <h2>${monthName}</h2>
        <p class="hijri-date">${hijriMonth}</p>
        <p class="location">${location.name}, Nigeria</p>
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
            <th>DAY</th>
            <th>FAJR</th>
            <th>SUNRISE</th>
            <th>DHUHR</th>
            <th>ASR</th>
            <th>MAGHRIB</th>
            <th>ISHA</th>
          </tr>
        </thead>
        <tbody>
          ${firstHalf.map(item => {
            const dayName = item.date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNumber = item.date.getDate();
            const isFriday = item.date.getDay() === 5;
            return `
            <tr${isFriday ? ' class="friday-row"' : ''}>
              <td class="day-cell">${dayNumber}<span class="day-name">${dayName}</span></td>
              <td>${formatTime(item.prayers.fajr)}</td>
              <td>${formatTime(item.prayers.sunrise)}</td>
              <td>${formatTime(item.prayers.zuhr)}</td>
              <td>${formatTime(item.prayers.asr)}</td>
              <td>${formatTime(item.prayers.maghrib)}</td>
              <td>${formatTime(item.prayers.isha)}</td>
            </tr>
              `;
        }).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- PAGE 2: Days 14-31 -->
  <div class="page">
    <div class="header">
      <div class="header-left">
        <h1>Prayer Timetable - ${monthName}</h1>
        <p class="hijri-date">${location.name}, Nigeria (continued)</p>
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
            <th>DAY</th>
            <th>FAJR</th>
            <th>SUNRISE</th>
            <th>DHUHR</th>
            <th>ASR</th>
            <th>MAGHRIB</th>
            <th>ISHA</th>
          </tr>
        </thead>
        <tbody>
          ${secondHalf.map(item => {
            const dayName = item.date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNumber = item.date.getDate();
            const isFriday = item.date.getDay() === 5;
            return `
            <tr${isFriday ? ' class="friday-row"' : ''}>
              <td class="day-cell">${dayNumber}<span class="day-name">${dayName}</span></td>
              <td>${formatTime(item.prayers.fajr)}</td>
              <td>${formatTime(item.prayers.sunrise)}</td>
              <td>${formatTime(item.prayers.zuhr)}</td>
              <td>${formatTime(item.prayers.asr)}</td>
              <td>${formatTime(item.prayers.maghrib)}</td>
              <td>${formatTime(item.prayers.isha)}</td>
            </tr>
              `;
        }).join('')}
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

        const monthName = currentMonth.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
        let message = `Prayer Timetable - ${monthName}\n${location.name}\n\n`;

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

    const monthName = currentMonth.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
    const hijriMonth = getHijriMonth(currentMonth);

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
            {/* Ambient glow */}
            <View style={[styles.ambientGlow, isDarkMode && styles.ambientGlowDark]} />

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
                                    {monthName}
                                </Text>
                                <Text style={[styles.hijriMonth, isDarkMode && styles.hijriMonthDark]}>
                                    {hijriMonth}
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
                                const dayNumber = item.date.getDate();

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
                                                {dayNumber}
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