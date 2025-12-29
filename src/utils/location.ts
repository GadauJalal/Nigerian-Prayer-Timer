import * as Location from 'expo-location';
import { NIGERIA_LOCATIONS, City, State } from '../data/nigeria_locations';

export const requestLocationPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
};

export const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
        throw new Error('Location permission denied');
    }
    return await Location.getCurrentPositionAsync({});
};

// Haversine formula to calculate distance between two points
const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
};

export const findNearestCity = (lat: number, lng: number): City | null => {
    let nearestCity: City | null = null;
    let minDistance = Infinity;

    for (const state of NIGERIA_LOCATIONS) {
        for (const city of state.cities) {
            const distance = getDistanceFromLatLonInKm(lat, lng, city.lat, city.lng);
            if (distance < minDistance) {
                minDistance = distance;
                nearestCity = city;
            }
        }
    }

    return nearestCity;
};
