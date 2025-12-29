import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

interface QiblaCompassProps {
  heading: number;
  qiblaDirection: number;
  isDarkMode: boolean;
}

const COMPASS_SIZE = Math.min(Dimensions.get('window').width - 48, 320);

export function QiblaCompass({
  heading,
  qiblaDirection,
  isDarkMode,
}: QiblaCompassProps) {
  // Calculate the needle rotation (relative to phone heading)
  const needleRotation = qiblaDirection - heading;

  // Calculate alignment for UI feedback
  const diff = Math.abs(heading - qiblaDirection);
  const normalizedDiff = ((diff % 360) + 360) % 360;
  const isAligned = normalizedDiff < 3 || normalizedDiff > 357;

  return (
    <View style={styles.container}>

      {/* 1. FIXED KAABA TARGET (Top of Screen) */}
      <View style={styles.targetSection}>
        <View style={[
          styles.targetBox,
          isAligned
            ? (isDarkMode ? styles.targetBoxAlignedDark : styles.targetBoxAlignedLight)
            : (isDarkMode ? styles.targetBoxDefaultDark : styles.targetBoxDefaultLight)
        ]}>
          {/* Alignment notches on the target box */}
          <View style={[styles.targetNotchTop, { opacity: 0.2 }]} />
          <View style={[styles.targetNotchBottom, { opacity: 0.2 }]} />

          {/* Kaaba Icon */}
          <Svg width={40} height={40} viewBox="0 0 32 32" fill="none">
            <Path d="M16 4 L26 9 L26 23 L16 28 L6 23 L6 9 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="0.5" />
            <Path d="M6 9 L16 4 L16 28 L6 23 Z" fill="#334155" />
            <Path d="M26 9 L16 4 L16 28 L26 23 Z" fill="#475569" />
            <Rect x="6" y="14" width="20" height="3" fill="#d97706" opacity="0.95" />
            <Path d="M6 14 L16 11 L16 14 L6 17 Z" fill="#b45309" />
            <Path d="M26 14 L16 11 L16 14 L26 17 Z" fill="#f59e0b" />
          </Svg>

          {/* Success Indicator (Checkmark) */}
          {isAligned && (
            <View style={styles.successIndicator}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3}>
                <Path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </Svg>
            </View>
          )}
        </View>

        {/* Guide line connecting Target to Compass */}
        <View style={[
          styles.guideLine,
          isAligned
            ? styles.guideLineAligned
            : (isDarkMode ? styles.guideLineDark : styles.guideLineLight)
        ]} />
      </View>

      {/* 2. COMPASS ASSEMBLY */}
      <View style={styles.compassWrapper}>

        {/* STATIC BEZEL & BACKGROUND - Does not rotate */}
        <View style={[
          styles.compassBezel,
          isDarkMode ? styles.compassBezelDark : styles.compassBezelLight
        ]}>
          <View style={[
            styles.compassInnerShadow,
            isDarkMode && styles.compassInnerShadowDark
          ]} />
        </View>

        {/* ROTATING DIAL - Only markings rotate */}
        <View
          style={[
            styles.rotatingDial,
            { transform: [{ rotate: `${-heading}deg` }] }
          ]}
        >
          {/* Compass Ring with Tick Marks */}
          <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} style={styles.compassSvg}>
            {Array.from({ length: 72 }).map((_, i) => {
              const angle = i * 5;
              const isCardinal = angle % 90 === 0;
              const isMajor = angle % 30 === 0;

              const radius = COMPASS_SIZE / 2;
              const tickLength = isCardinal ? 16 : isMajor ? 12 : 8;
              const tickWidth = isCardinal ? 2 : isMajor ? 1.5 : 1;

              // Calculate positions from edge going inward
              const angleRad = (angle - 90) * Math.PI / 180;
              const x1 = radius + (radius - 8) * Math.cos(angleRad);
              const y1 = radius + (radius - 8) * Math.sin(angleRad);
              const x2 = radius + (radius - 8 - tickLength) * Math.cos(angleRad);
              const y2 = radius + (radius - 8 - tickLength) * Math.sin(angleRad);

              const tickColor = isCardinal
                ? (isDarkMode ? '#CBD5E1' : '#1E293B')
                : isMajor
                ? (isDarkMode ? '#64748B' : '#94A3B8')
                : (isDarkMode ? '#475569' : '#E2E8F0');

              return (
                <Path
                  key={i}
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke={tickColor}
                  strokeWidth={tickWidth}
                  strokeLinecap="round"
                />
              );
            })}
          </Svg>

          {/* Cardinal Directions */}
          <Text style={[styles.cardinalN, isDarkMode && styles.cardinalNDark]}>N</Text>
          <Text style={[styles.cardinalS, isDarkMode && styles.cardinalSDark]}>S</Text>
          <Text style={[styles.cardinalE, isDarkMode && styles.cardinalEDark]}>E</Text>
          <Text style={[styles.cardinalW, isDarkMode && styles.cardinalWDark]}>W</Text>
        </View>

        {/* QIBLA NEEDLE - Clean, no shadow artifacts */}
        <View
          style={[
            styles.needleContainer,
            { transform: [{ rotate: `${needleRotation}deg` }] }
          ]}
        >
          <View style={styles.needleWrapper}>

            {/* NEEDLE TIP (North/Qibla End) */}
            <View style={styles.needleTip}>
              {/* Left triangle half */}
              <View style={[
                styles.needleTipLeft,
                isAligned ? styles.needleTipAligned : styles.needleTipDefault
              ]} />
              {/* Right triangle half */}
              <View style={[
                styles.needleTipRight,
                isAligned ? styles.needleTipAlignedLight : styles.needleTipDefaultLight
              ]} />
            </View>

            {/* NEEDLE SHAFT */}
            <View style={styles.needleShaft}>
              <View style={[
                styles.needleShaftLeft,
                isAligned ? styles.needleShaftAligned : styles.needleShaftDefault
              ]} />
              <View style={[
                styles.needleShaftRight,
                isAligned ? styles.needleShaftAlignedLight : styles.needleShaftDefaultLight
              ]} />
            </View>

            {/* COUNTERWEIGHT (South End) */}
            <View style={[
              styles.counterweight,
              isDarkMode ? styles.counterweightDark : styles.counterweightLight
            ]}>
              <View style={[
                styles.counterweightDot,
                isDarkMode ? styles.counterweightDotDark : styles.counterweightDotLight
              ]} />
            </View>

          </View>
        </View>

        {/* Center Cap - Detailed Machined Look */}
        <View style={styles.centerCapOuter}>
          <View style={[
            styles.centerCap,
            isDarkMode ? styles.centerCapDark : styles.centerCapLight
          ]}>
            <View style={[
              styles.centerCapInner,
              isDarkMode ? styles.centerCapInnerDark : styles.centerCapInnerLight
            ]} />
            {/* Cross screw head detail */}
            <View style={styles.screwHorizontal} />
            <View style={styles.screwVertical} />
          </View>
        </View>
      </View>

      {/* Text Feedback - Elegant & Minimal */}
      <View style={styles.feedbackSection}>
        <View style={[
          styles.feedbackPill,
          isAligned
            ? (isDarkMode ? styles.feedbackPillAlignedDark : styles.feedbackPillAlignedLight)
            : styles.feedbackPillDefault
        ]}>
          {isAligned && (
            <View style={styles.pulseContainer}>
              <View style={styles.pulseOuter} />
              <View style={styles.pulseInner} />
            </View>
          )}
          <Text style={[
            styles.feedbackText,
            isAligned
              ? (isDarkMode ? styles.feedbackTextAlignedDark : styles.feedbackTextAlignedLight)
              : (isDarkMode ? styles.feedbackTextDefaultDark : styles.feedbackTextDefaultLight)
          ]}>
            {isAligned ? 'Qibla Aligned' : 'Align arrow with Kaaba'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },

  // Target Section
  targetSection: {
    position: 'relative',
    zIndex: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  targetBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  targetBoxAlignedLight: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
    transform: [{ scale: 1.05 }],
  },
  targetBoxAlignedDark: {
    backgroundColor: 'rgba(6, 95, 70, 0.3)',
    borderColor: '#10B981',
    transform: [{ scale: 1.05 }],
  },
  targetBoxDefaultLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  targetBoxDefaultDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  targetNotchTop: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -0.5,
    width: 1,
    height: 6,
    backgroundColor: '#000',
  },
  targetNotchBottom: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -0.5,
    width: 1,
    height: 6,
    backgroundColor: '#000',
  },
  successIndicator: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideLine: {
    position: 'absolute',
    bottom: -40,
    left: '50%',
    marginLeft: -0.5,
    width: 1,
    height: 40,
  },
  guideLineAligned: {
    backgroundColor: '#10B981',
    opacity: 0.5,
  },
  guideLineLight: {
    backgroundColor: '#E2E8F0',
    opacity: 0.5,
  },
  guideLineDark: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },

  // Compass Wrapper
  compassWrapper: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    position: 'relative',
  },
  compassBezel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 8,
  },
  compassBezelLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
  },
  compassBezelDark: {
    backgroundColor: '#0B1120',
    borderColor: '#334155',
  },
  compassInnerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: COMPASS_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  compassInnerShadowDark: {
    shadowOpacity: 0.2,
  },

  // Rotating Dial
  rotatingDial: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  compassSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  // Cardinal Directions
  cardinalN: {
    position: 'absolute',
    top: 32,
    left: '50%',
    transform: [{ translateX: -7 }],
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  cardinalNDark: {
    color: '#EF4444',
  },
  cardinalS: {
    position: 'absolute',
    bottom: 32,
    left: '50%',
    transform: [{ translateX: -6 }],
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  cardinalSDark: {
    color: '#64748B',
  },
  cardinalE: {
    position: 'absolute',
    top: '50%',
    right: 32,
    transform: [{ translateY: -10 }],
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  cardinalEDark: {
    color: '#64748B',
  },
  cardinalW: {
    position: 'absolute',
    top: '50%',
    left: 32,
    transform: [{ translateY: -10 }],
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  cardinalWDark: {
    color: '#64748B',
  },

  // Needle
  needleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  needleWrapper: {
    width: 40,
    height: '100%',
    alignItems: 'center',
    paddingVertical: 24,
  },
  needleTip: {
    position: 'relative',
    width: 14,
    height: 40,
    marginTop: 16,
  },
  needleTipLeft: {
    position: 'absolute',
    left: 0,
    width: 0,
    height: 0,
    borderRightWidth: 7,
    borderLeftWidth: 7,
    borderBottomWidth: 40,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  needleTipDefault: {
    borderBottomColor: '#D97706',
  },
  needleTipAligned: {
    borderBottomColor: '#059669',
  },
  needleTipRight: {
    position: 'absolute',
    left: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 40,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  needleTipDefaultLight: {
    borderBottomColor: '#F59E0B',
  },
  needleTipAlignedLight: {
    borderBottomColor: '#10B981',
  },
  needleShaft: {
    flex: 1,
    width: 6,
    marginTop: -8,
    marginBottom: 8,
    flexDirection: 'row',
  },
  needleShaftLeft: {
    flex: 1,
  },
  needleShaftDefault: {
    backgroundColor: '#D97706',
  },
  needleShaftAligned: {
    backgroundColor: '#059669',
  },
  needleShaftRight: {
    flex: 1,
  },
  needleShaftDefaultLight: {
    backgroundColor: '#F59E0B',
  },
  needleShaftAlignedLight: {
    backgroundColor: '#10B981',
  },
  counterweight: {
    width: 12,
    height: 48,
    borderRadius: 6,
    marginBottom: 16,
    opacity: 0.8,
    alignItems: 'center',
    paddingTop: 8,
  },
  counterweightLight: {
    backgroundColor: '#CBD5E1',
  },
  counterweightDark: {
    backgroundColor: '#475569',
  },
  counterweightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  counterweightDotLight: {
    backgroundColor: '#94A3B8',
  },
  counterweightDotDark: {
    backgroundColor: '#64748B',
  },

  // Center Cap
  centerCapOuter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
    zIndex: 20,
  },
  centerCap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  centerCapLight: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
  },
  centerCapDark: {
    backgroundColor: '#475569',
    borderColor: '#64748B',
  },
  centerCapInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  centerCapInnerLight: {
    backgroundColor: '#94A3B8',
  },
  centerCapInnerDark: {
    backgroundColor: '#64748B',
  },
  screwHorizontal: {
    position: 'absolute',
    width: 16,
    height: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: 1,
  },
  screwVertical: {
    position: 'absolute',
    width: 2,
    height: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: 1,
  },

  // Feedback Section
  feedbackSection: {
    marginTop: 40,
    alignItems: 'center',
  },
  feedbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  feedbackPillAlignedLight: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  feedbackPillAlignedDark: {
    backgroundColor: 'rgba(6, 95, 70, 0.3)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  feedbackPillDefault: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  pulseContainer: {
    position: 'relative',
    width: 8,
    height: 8,
  },
  pulseOuter: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
    opacity: 0.75,
  },
  pulseInner: {
    position: 'relative',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  feedbackTextAlignedLight: {
    color: '#047857',
  },
  feedbackTextAlignedDark: {
    color: '#34D399',
  },
  feedbackTextDefaultLight: {
    color: '#64748B',
  },
  feedbackTextDefaultDark: {
    color: '#94A3B8',
  },
});
