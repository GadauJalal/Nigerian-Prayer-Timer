import { useState, useEffect, useRef } from 'react';
import { Animated, AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import { DeviceMotion } from 'expo-sensors';

const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

const SMOOTHING_FACTOR = 0.15;
const ACCURACY_THRESHOLD_POOR = 3;

export interface QiblaCompassState {
  headingDegrees: number;
  qiblaBearing: number;
  dialRotationAnimated: Animated.Value;
  needleRotationAnimated: Animated.Value;
  isPhoneFlat: boolean;
  isSensorAvailable: boolean | null;
  isCalibrationPoor: boolean;
  isUsingGPS: boolean;
  locationName: string;
}

function calculateQiblaDirection(userLat: number, userLng: number): number {
  const phi1 = (userLat * Math.PI) / 180;
  const lamb1 = (userLng * Math.PI) / 180;
  const phi2 = (KAABA_LAT * Math.PI) / 180;
  const lamb2 = (KAABA_LNG * Math.PI) / 180;

  const deltaLambda = lamb2 - lamb1;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

function circularLowPass(
  prevSin: number,
  prevCos: number,
  newAngleDeg: number,
  alpha: number
): { sin: number; cos: number; angle: number } {
  const rad = (newAngleDeg * Math.PI) / 180;
  const newSin = Math.sin(rad);
  const newCos = Math.cos(rad);

  const smoothedSin = prevSin + alpha * (newSin - prevSin);
  const smoothedCos = prevCos + alpha * (newCos - prevCos);

  let angle = (Math.atan2(smoothedSin, smoothedCos) * 180) / Math.PI;
  angle = (angle + 360) % 360;

  return { sin: smoothedSin, cos: smoothedCos, angle };
}

function shortestRotation(from: number, to: number): number {
  let diff = to - from;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return from + diff;
}

export function useQiblaCompass(
  fallbackLocation: { lat: number; lng: number; name: string } | null,
  isFocused: boolean
): QiblaCompassState {
  const dialRotationAnimated = useRef(new Animated.Value(0)).current;
  const needleRotationAnimated = useRef(new Animated.Value(0)).current;

  const [headingDegrees, setHeadingDegrees] = useState(0);
  const [qiblaBearing, setQiblaBearing] = useState(() => {
    if (fallbackLocation) {
      return Math.round(
        calculateQiblaDirection(fallbackLocation.lat, fallbackLocation.lng)
      );
    }
    return 0;
  });
  const [isPhoneFlat, setIsPhoneFlat] = useState(true);
  const [isSensorAvailable, setIsSensorAvailable] = useState<boolean | null>(null);
  const [isCalibrationPoor, setIsCalibrationPoor] = useState(false);
  const [isUsingGPS, setIsUsingGPS] = useState(false);
  const [locationName, setLocationName] = useState(
    fallbackLocation?.name || 'Unknown'
  );

  const filterSin = useRef(0);
  const filterCos = useRef(1);
  const lastDialTarget = useRef(0);
  const lastNeedleTarget = useRef(0);
  const qiblaBearingRef = useRef(qiblaBearing);

  const headingSub = useRef<Location.LocationSubscription | null>(null);
  const positionSub = useRef<Location.LocationSubscription | null>(null);
  const motionSub = useRef<{ remove: () => void } | null>(null);

  // Keep qiblaBearingRef in sync
  useEffect(() => {
    qiblaBearingRef.current = qiblaBearing;
  }, [qiblaBearing]);

  // Update qibla bearing when fallback location changes
  useEffect(() => {
    if (fallbackLocation && !isUsingGPS) {
      const bearing = Math.round(
        calculateQiblaDirection(fallbackLocation.lat, fallbackLocation.lng)
      );
      setQiblaBearing(bearing);
      setLocationName(fallbackLocation.name);
    }
  }, [fallbackLocation?.lat, fallbackLocation?.lng]);

  // Main sensor lifecycle — driven by isFocused
  useEffect(() => {
    if (!isFocused) {
      headingSub.current?.remove();
      headingSub.current = null;
      positionSub.current?.remove();
      positionSub.current = null;
      motionSub.current?.remove();
      motionSub.current = null;
      return;
    }

    let isMounted = true;

    const startSensors = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) setIsSensorAvailable(false);
          return;
        }

        // 1. OS sensor-fused heading (true north)
        headingSub.current = await Location.watchHeadingAsync((headingData) => {
          if (!isMounted) return;

          const rawHeading = headingData.trueHeading;
          const effectiveHeading =
            rawHeading >= 0 ? rawHeading : headingData.magHeading;

          // Circular low-pass filter
          const filtered = circularLowPass(
            filterSin.current,
            filterCos.current,
            effectiveHeading,
            SMOOTHING_FACTOR
          );
          filterSin.current = filtered.sin;
          filterCos.current = filtered.cos;

          const smoothedHeading = Math.round(filtered.angle);
          setHeadingDegrees(smoothedHeading);

          // Animate dial (negative heading = dial rotates opposite)
          const dialTarget = shortestRotation(
            lastDialTarget.current,
            -smoothedHeading
          );
          lastDialTarget.current = dialTarget;
          Animated.timing(dialRotationAnimated, {
            toValue: dialTarget,
            duration: 150,
            useNativeDriver: true,
          }).start();

          // Animate needle
          const needleTarget = shortestRotation(
            lastNeedleTarget.current,
            qiblaBearingRef.current - smoothedHeading
          );
          lastNeedleTarget.current = needleTarget;
          Animated.timing(needleRotationAnimated, {
            toValue: needleTarget,
            duration: 150,
            useNativeDriver: true,
          }).start();

          // Calibration check
          setIsCalibrationPoor(headingData.accuracy >= ACCURACY_THRESHOLD_POOR);

          if (isMounted) setIsSensorAvailable(true);
        });

        // 2. Real-time GPS for Qibla bearing
        positionSub.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 50,
            timeInterval: 10000,
          },
          (position) => {
            if (!isMounted) return;
            const { latitude, longitude } = position.coords;
            const bearing = Math.round(
              calculateQiblaDirection(latitude, longitude)
            );
            setQiblaBearing(bearing);
            setIsUsingGPS(true);
            setLocationName('GPS Location');
          }
        );

        // 3. DeviceMotion for flat detection
        DeviceMotion.setUpdateInterval(200);
        motionSub.current = DeviceMotion.addListener((data) => {
          if (!isMounted || !data.rotation) return;
          const beta = data.rotation.beta * (180 / Math.PI);
          const gamma = data.rotation.gamma * (180 / Math.PI);
          const isFlat = Math.abs(beta) < 30 && Math.abs(gamma) < 30;
          setIsPhoneFlat(isFlat);
        });
      } catch (error) {
        console.error('Error setting up Qibla compass sensors:', error);
        if (isMounted) setIsSensorAvailable(false);
      }
    };

    startSensors();

    return () => {
      isMounted = false;
      headingSub.current?.remove();
      headingSub.current = null;
      positionSub.current?.remove();
      positionSub.current = null;
      motionSub.current?.remove();
      motionSub.current = null;
    };
  }, [isFocused]);

  return {
    headingDegrees,
    qiblaBearing,
    dialRotationAnimated,
    needleRotationAnimated,
    isPhoneFlat,
    isSensorAvailable,
    isCalibrationPoor,
    isUsingGPS,
    locationName,
  };
}
