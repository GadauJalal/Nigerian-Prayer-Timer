import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { useThemeContext } from '../context/ThemeContext';
import { COLORS, SPACING } from '../constants/theme';
import { City } from '../data/nigeria_locations';
import LocationSelector from '../components/LocationSelector';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: any;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: "Nigeria's first prayer times app",
    description: 'Accurate daily salah times across Nigeria, calculated offline using the MADI Key Standard method.',
    image: require('../../assets/Asset 7.png'),
  },
  {
    id: '2',
    title: 'Built-in accurate Qibla',
    description: 'Find the Qibla direction instantly with an in-app compass, designed to be quick and reliable.',
    image: require('../../assets/Asset 8.png'),
  },
  {
    id: '3',
    title: 'Export your prayer timetable',
    description: 'Generate a full monthly prayer timetable as a PDF, then save it or share it with family and friends.',
    image: require('../../assets/Asset 9.png'),
  },
  {
    id: '4',
    title: 'Choose your location',
    description: 'Select your city to get accurate prayer times for your area.',
    image: require('../../assets/Prayerlogo.png'),
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<City | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { completeOnboarding, setLocation } = useAppContext();
  const { isDarkMode } = useThemeContext();

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      // Save location before completing onboarding
      if (selectedLocation) {
        setLocation(selectedLocation);
      }
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const handleLocationSelect = (city: City) => {
    setSelectedLocation(city);
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const isFinalSlide = index === slides.length - 1;

    return (
      <View style={[styles.slide, { backgroundColor: isDarkMode ? COLORS.dark.background : COLORS.background }]}>
        {!isFinalSlide ? (
          <>
            <View style={styles.imageContainer}>
              <View style={styles.circle}>
                <Image source={item.image} style={styles.image} resizeMode="contain" />
              </View>
            </View>

            <View style={styles.content}>
              <Text style={[styles.title, { color: isDarkMode ? COLORS.dark.text : COLORS.text }]}>
                {item.title}
              </Text>
              <Text style={[styles.description, { color: isDarkMode ? COLORS.dark.textLight : COLORS.textLight }]}>
                {item.description}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.finalSlideContainer}>
            <View style={styles.finalSlideImageContainer}>
              <Image source={item.image} style={styles.finalSlideImage} resizeMode="contain" />
            </View>

            <View style={styles.finalSlideContent}>
              <Text style={[styles.finalSlideTitle, { color: isDarkMode ? COLORS.dark.text : COLORS.text }]}>
                {item.title}
              </Text>
              <Text style={[styles.finalSlideDescription, { color: isDarkMode ? COLORS.dark.textLight : COLORS.textLight }]}>
                {item.description}
              </Text>

              <View style={styles.finalSlideLocationContainer}>
                <LocationSelector
                  onLocationSelect={handleLocationSelect}
                  selectedCity={selectedLocation}
                />
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderPagination = () => (
    <View style={styles.pagination}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentIndex ? COLORS.primary : isDarkMode ? COLORS.dark.textLight : COLORS.textLight,
              width: index === currentIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? COLORS.dark.background : COLORS.background }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        {currentIndex < slides.length - 1 ? (
          <>
            <TouchableOpacity onPress={handleSkip}>
              <Text style={[styles.skipText, { color: COLORS.primary }]}>Skip</Text>
            </TouchableOpacity>

            {renderPagination()}

            <TouchableOpacity onPress={handleNext}>
              <Text style={[styles.nextText, { color: COLORS.primary }]}>Next</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={handleNext}>
            <Text style={styles.startButtonText}>Start Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  circle: {
    width: 350,
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 350,
    height: 350,
  },
  content: {
    flex: 0.5,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
  },
  finalSlideContainer: {
    flex: 1,
    width: '100%',
    paddingTop: 80,
    paddingBottom: 140,
    justifyContent: 'space-between',
  },
  finalSlideImageContainer: {
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  finalSlideImage: {
    width: 240,
    height: 240,
  },
  finalSlideContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  finalSlideTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.s,
    color: COLORS.secondary,
    lineHeight: 36,
  },
  finalSlideDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  finalSlideLocationContainer: {

    width: '100%',
    marginTop: SPACING.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.m,
    color: COLORS.secondary,
    lineHeight: 40,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: SPACING.m,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  skipText: {
    fontSize: 18,
    fontWeight: '500',
  },
  nextText: {
    fontSize: 18,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 80,
    paddingVertical: 16,
    borderRadius: 30,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
