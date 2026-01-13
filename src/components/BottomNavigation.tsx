import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Home, Compass, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Screen = 'Home' | 'Qibla' | 'Timetable';

interface BottomNavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  isDarkMode: boolean;
}

export function BottomNavigation({
  currentScreen,
  onNavigate,
  isDarkMode,
}: BottomNavigationProps) {
  const insets = useSafeAreaInsets();

  const navItems = [
    { id: 'Qibla' as Screen, label: 'Qibla', icon: Compass },
    { id: 'Home' as Screen, label: 'Home', icon: Home },
    { id: 'Timetable' as Screen, label: 'Calendar', icon: Calendar },
  ];

  // Animation values for each nav item
  const animations = useRef<Record<Screen, Animated.Value>>({
    Qibla: new Animated.Value(0),
    Home: new Animated.Value(1),
    Timetable: new Animated.Value(0),
  }).current;

  // Animate when screen changes
  useEffect(() => {
    navItems.forEach((item) => {
      const isActive = currentScreen === item.id;
      Animated.timing(animations[item.id], {
        toValue: isActive ? 1 : 0,
        duration: 250,
        useNativeDriver: false, // Need false for width animation
      }).start();
    });
  }, [currentScreen]);

  return (
    <View style={[
      styles.container,
      {
        paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 24,
      }
    ]}>
      {/* Liquid Glass Dock Container */}
      <View
        style={[
          styles.dockContainer,
          isDarkMode ? styles.dockContainerDark : styles.dockContainerLight,
        ]}
      >
        {/* Inner glow gradient effect */}
        <View style={styles.innerGlow} />

        <View style={styles.itemsContainer}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            const animValue = animations[item.id];

            // Animated styles for sliding with proper max width based on label
            const maxLabelWidths: Record<Screen, number> = {
              'Qibla': 50,
              'Home': 50,
              'Timetable': 70,
            };

            const labelWidth = animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, maxLabelWidths[item.id]],
            });

            const labelOpacity = animValue;

            return (
              <View
                key={item.id}
                style={styles.navButton}
              >
                <TouchableOpacity
                  onPress={() => onNavigate(item.id)}
                  activeOpacity={0.7}
                  style={styles.navButtonInner}
                >
                  {/* Active pill background with shadow */}
                  <Animated.View
                    style={[
                      styles.activePillShadow,
                      { opacity: animValue },
                    ]}
                    pointerEvents="none"
                  />
                  <Animated.View
                    style={[
                      styles.activePill,
                      isDarkMode ? styles.activePillDark : styles.activePillLight,
                      { opacity: animValue },
                    ]}
                    pointerEvents="none"
                  />

                  {/* Icon */}
                  <View style={styles.iconWrapper}>
                    <Icon
                      size={20}
                      color={
                        isActive
                          ? '#FFFFFF'
                          : isDarkMode
                            ? '#94A3B8' // slate-400
                            : '#64748B' // slate-500
                      }
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </View>

                  {/* Label - slides in/out */}
                  <Animated.View
                    style={[
                      styles.labelContainer,
                      {
                        width: labelWidth,
                        opacity: labelOpacity,
                      },
                    ]}
                    pointerEvents="none"
                  >
                    <Text
                      style={[
                        styles.label,
                        isDarkMode && styles.labelDark,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </Animated.View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  dockContainer: {
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginHorizontal: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dockContainerLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dockContainerDark: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0,
    borderTopLeftRadius: 9999,
    borderTopRightRadius: 9999,
    backgroundColor: 'transparent',
  },
  itemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
    zIndex: 10,
    minHeight: 48,
  },
  navButton: {
    position: 'relative',
    borderRadius: 9999,
    overflow: 'visible',
  },
  navButtonInner: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 9999,
    minHeight: 44,
  },
  navButtonActiveLight: {
    // Active state handled by activePill
  },
  navButtonActiveDark: {
    // Active state handled by activePill
  },
  activePillShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  activePill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 9999,
  },
  activePillLight: {
    backgroundColor: '#10B981', // emerald-500
  },
  activePillDark: {
    backgroundColor: '#10B981', // emerald-500
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  labelContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
    marginLeft: 8,
    zIndex: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  labelDark: {
    color: '#FFFFFF',
  },
});
