import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, ChevronRight } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { NIGERIA_LOCATIONS, State, City } from '../data/nigeria_locations';
import { getCurrentLocation, findNearestCity } from '../utils/location';
import { COLORS, SPACING } from '../constants/theme';

const LocationScreen = ({ navigation }: any) => {
    const { setLocation } = useApp();
    const [loading, setLoading] = useState(false);
    const [selectedState, setSelectedState] = useState<State | null>(null);

    const handleUseGPS = async () => {
        setLoading(true);
        try {
            const location = await getCurrentLocation();
            const nearestCity = findNearestCity(location.coords.latitude, location.coords.longitude);

            if (nearestCity) {
                setLocation(nearestCity);
                navigation.goBack();
            } else {
                Alert.alert('Error', 'Could not find a nearby city in our database.');
            }
        } catch (error) {
            Alert.alert('Permission Denied', 'Please enable location services to use GPS.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCity = (city: City) => {
        setLocation(city);
        navigation.goBack();
    };

    const renderStateItem = ({ item }: { item: State }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => setSelectedState(item)}
        >
            <Text style={styles.itemText}>{item.name}</Text>
            <ChevronRight size={20} color={COLORS.textLight} />
        </TouchableOpacity>
    );

    const renderCityItem = ({ item }: { item: City }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => handleSelectCity(item)}
        >
            <Text style={styles.itemText}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Detecting location...</Text>
                </View>
            ) : (
                <>
                    {!selectedState ? (
                        <>
                            <TouchableOpacity style={styles.gpsButton} onPress={handleUseGPS}>
                                <MapPin size={20} color={COLORS.white} />
                                <Text style={styles.gpsButtonText}>Use Current Location</Text>
                            </TouchableOpacity>

                            <Text style={styles.sectionTitle}>Select State</Text>
                            <FlatList
                                data={NIGERIA_LOCATIONS.sort((a, b) => a.name.localeCompare(b.name))}
                                renderItem={renderStateItem}
                                keyExtractor={(item) => item.name}
                                contentContainerStyle={styles.listContent}
                            />
                        </>
                    ) : (
                        <>
                            <TouchableOpacity style={styles.backButton} onPress={() => setSelectedState(null)}>
                                <Text style={styles.backButtonText}>← Back to States</Text>
                            </TouchableOpacity>

                            <Text style={styles.sectionTitle}>{selectedState.name} Cities</Text>
                            <FlatList
                                data={selectedState.cities.sort((a, b) => a.name.localeCompare(b.name))}
                                renderItem={renderCityItem}
                                keyExtractor={(item) => item.name}
                                contentContainerStyle={styles.listContent}
                            />
                        </>
                    )}
                </>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: SPACING.m,
        color: COLORS.text,
    },
    gpsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        margin: SPACING.m,
        padding: SPACING.m,
        borderRadius: 12,
    },
    gpsButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        marginLeft: SPACING.s,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginLeft: SPACING.m,
        marginBottom: SPACING.s,
    },
    listContent: {
        paddingHorizontal: SPACING.m,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    itemText: {
        fontSize: 16,
        color: COLORS.text,
    },
    backButton: {
        padding: SPACING.m,
    },
    backButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default LocationScreen;
