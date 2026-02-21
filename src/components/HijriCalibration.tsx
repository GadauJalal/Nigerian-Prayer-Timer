import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Linking,
} from 'react-native';
import { Minus, Plus, AlertTriangle } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { getHijriDate } from '../utils/date';

interface HijriCalibrationProps {
    isDarkMode: boolean;
}

export function HijriCalibration({ isDarkMode }: HijriCalibrationProps) {
    const { hijriAdjustment, setHijriAdjustment, location } = useApp();
    const [localAdjustment, setLocalAdjustment] = useState(hijriAdjustment);

    // Sync local state when saved value loads from AsyncStorage
    useEffect(() => {
        setLocalAdjustment(hijriAdjustment);
    }, [hijriAdjustment]);

    const todayHijri = getHijriDate(new Date(), location?.lat, location?.lng, localAdjustment);

    const handleDecrease = () => {
        if (localAdjustment > -3) {
            setLocalAdjustment(localAdjustment - 1);
        }
    };

    const handleIncrease = () => {
        if (localAdjustment < 3) {
            setLocalAdjustment(localAdjustment + 1);
        }
    };

    const handleSave = () => {
        setHijriAdjustment(localAdjustment);
    };

    const handleVerify = () => {
        Linking.openURL('https://x.com/moonsightingng');
    };

    const hasUnsavedChanges = localAdjustment !== hijriAdjustment;

    return (
        <View style={[styles.container, isDarkMode ? styles.containerDark : styles.containerLight]}>
            {/* Header Row */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <View style={[styles.indicator, isDarkMode ? styles.indicatorDark : styles.indicatorLight]} />
                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, isDarkMode && styles.titleDark]}>
                            Hijri Calibration
                        </Text>
                        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
                            Adjust based on moon sighting
                        </Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <Text style={[styles.todayLabel, isDarkMode && styles.todayLabelDark]}>
                        TODAY'S DATE
                    </Text>
                    <Text style={[styles.todayDate, isDarkMode && styles.todayDateDark]}>
                        {todayHijri}
                    </Text>
                </View>
            </View>

            {/* Divider */}
            <View style={[styles.divider, isDarkMode && styles.dividerDark]} />

            {/* Correction Controls */}
            <View style={styles.correctionSection}>
                <Text style={[styles.correctionLabel, isDarkMode && styles.correctionLabelDark]}>
                    CORRECTION
                </Text>
                <View style={styles.correctionControls}>
                    <TouchableOpacity
                        onPress={handleDecrease}
                        style={[
                            styles.controlButton,
                            isDarkMode ? styles.controlButtonDark : styles.controlButtonLight,
                            localAdjustment <= -3 && styles.controlButtonDisabled,
                        ]}
                        activeOpacity={0.7}
                        disabled={localAdjustment <= -3}
                    >
                        <Minus size={18} color={localAdjustment <= -3 ? '#94A3B8' : (isDarkMode ? '#CBD5E1' : '#475569')} />
                    </TouchableOpacity>

                    <Text style={[styles.correctionValue, isDarkMode && styles.correctionValueDark]}>
                        {localAdjustment} Days
                    </Text>

                    <TouchableOpacity
                        onPress={handleIncrease}
                        style={[
                            styles.controlButton,
                            isDarkMode ? styles.controlButtonDark : styles.controlButtonLight,
                            localAdjustment >= 3 && styles.controlButtonDisabled,
                        ]}
                        activeOpacity={0.7}
                        disabled={localAdjustment >= 3}
                    >
                        <Plus size={18} color={localAdjustment >= 3 ? '#94A3B8' : (isDarkMode ? '#CBD5E1' : '#475569')} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
                onPress={handleSave}
                style={[
                    styles.saveButton,
                    hasUnsavedChanges ? styles.saveButtonActive : (isDarkMode ? styles.saveButtonInactiveDark : styles.saveButtonInactive),
                ]}
                activeOpacity={0.7}
                disabled={!hasUnsavedChanges}
            >
                <Text style={[
                    styles.saveButtonText,
                    hasUnsavedChanges ? styles.saveButtonTextActive : styles.saveButtonTextInactive,
                ]}>
                    {hasUnsavedChanges ? 'Save Calibration' : 'Saved'}
                </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={[styles.divider, isDarkMode && styles.dividerDark]} />

            {/* Offline Notice */}
            <View style={styles.offlineSection}>
                <AlertTriangle size={16} color="#F59E0B" />
                <View style={styles.offlineTextContainer}>
                    <Text style={[styles.offlineTitle, isDarkMode && styles.offlineTitleDark]}>
                        Offline Application
                    </Text>
                    <Text style={[styles.offlineDesc, isDarkMode && styles.offlineDescDark]}>
                        This app operates completely offline. Please manually adjust the Hijri date to match your local moon sighting for accuracy.
                    </Text>
                </View>
            </View>

            {/* Verify Button */}
            <TouchableOpacity
                onPress={handleVerify}
                style={styles.verifyButton}
                activeOpacity={0.7}
            >
                <Text style={styles.verifyButtonText}>
                    Verify with National Moonsighting Committee
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
        padding: 20,
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
    containerLight: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
    },
    containerDark: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    titleContainer: {
        flex: 1,
    },
    indicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    indicatorLight: {
        backgroundColor: '#10B981',
    },
    indicatorDark: {
        backgroundColor: '#34D399',
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
    },
    titleDark: {
        color: '#F9FAFB',
    },
    subtitle: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    subtitleDark: {
        color: '#94A3B8',
    },
    headerRight: {
        alignItems: 'flex-end',
        marginLeft: 8,
    },
    todayLabel: {
        fontSize: 9,
        fontWeight: '600',
        letterSpacing: 0.5,
        color: '#64748B',
        marginBottom: 4,
    },
    todayLabelDark: {
        color: '#94A3B8',
    },
    todayDate: {
        fontSize: 13,
        fontWeight: '700',
        color: '#047857',
        textAlign: 'right',
    },
    todayDateDark: {
        color: '#34D399',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 16,
    },
    dividerDark: {
        backgroundColor: '#334155',
    },
    correctionSection: {
        alignItems: 'center',
        gap: 12,
    },
    correctionLabel: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1,
        color: '#64748B',
    },
    correctionLabelDark: {
        color: '#94A3B8',
    },
    correctionControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
    },
    controlButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlButtonLight: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
    },
    controlButtonDark: {
        backgroundColor: '#0F172A',
        borderColor: '#334155',
    },
    controlButtonDisabled: {
        opacity: 0.4,
    },
    correctionValue: {
        fontSize: 24,
        fontWeight: '300',
        color: '#0F172A',
        minWidth: 80,
        textAlign: 'center',
    },
    correctionValueDark: {
        color: '#F9FAFB',
    },
    saveButton: {
        marginTop: 16,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonActive: {
        backgroundColor: '#059669',
    },
    saveButtonInactive: {
        backgroundColor: '#F1F5F9',
    },
    saveButtonInactiveDark: {
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    saveButtonTextActive: {
        color: '#FFFFFF',
    },
    saveButtonTextInactive: {
        color: '#94A3B8',
    },
    offlineSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    offlineTextContainer: {
        flex: 1,
    },
    offlineTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 4,
    },
    offlineTitleDark: {
        color: '#F9FAFB',
    },
    offlineDesc: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
    },
    offlineDescDark: {
        color: '#94A3B8',
    },
    verifyButton: {
        marginTop: 16,
        backgroundColor: '#059669',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
});
