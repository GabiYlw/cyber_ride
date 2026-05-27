import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const MONOSPACE = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

const CARS = [
  {
    id: 'cla',
    name: 'MERCEDES CLA',
    tag: 'COMPACT SPORT SEDAN',
    image: require('../assets/cars/cla.png'),
  },
  {
    id: 'cls',
    name: 'MERCEDES CLS',
    tag: 'EXECUTIVE FOUR-DOOR COUPE',
    image: require('../assets/cars/cls.png'),
  },
  {
    id: 'g_class',
    name: 'MERCEDES G-CLASS',
    tag: 'OFF-ROAD TACTICAL ELITE',
    image: require('../assets/cars/g_class.png'),
  },
  {
    id: 'gls',
    name: 'MERCEDES GLS',
    tag: 'FULL-SIZE LUXURY SUV',
    image: require('../assets/cars/gls.png'),
  },
  {
    id: 'sl',
    name: 'MERCEDES SL',
    tag: 'HIGH-PERFORMANCE ROADSTER',
    image: require('../assets/cars/sl.png'),
  },
];

export default function CarSelectScreen() {
  const router = useRouter();
  const { missionId } = useLocalSearchParams<{ missionId?: string }>();
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const select = (carId: string) => {
    router.push({
      pathname: '/drive',
      params: { missionId: missionId ?? 'can_bus', carId },
    });
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#000000', '#000a1e', '#000408']}
        style={StyleSheet.absoluteFill}
      />

      {/* Scanlines */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 32 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: (i / 32) * height,
              height: 1,
              backgroundColor: 'rgba(0,0,0,0.12)',
            }}
          />
        ))}
      </View>

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeIn }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backTxt}>◀  BACK</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.eyebrow}>◈ VEHICLE SELECTION ◈</Text>
          <Text style={styles.title}>SELECT YOUR RIDE</Text>
          <View style={styles.titleUnderline} />
          <Text style={styles.subtitle}>CHOOSE THE VEHICLE FOR THIS MISSION</Text>
        </View>
      </Animated.View>

      <View style={styles.divider} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {CARS.map((car, idx) => (
          <CarCard key={car.id} car={car} delay={idx * 90} onSelect={select} />
        ))}
        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

function CarCard({
  car,
  delay,
  onSelect,
}: {
  car: (typeof CARS)[0];
  delay: number;
  onSelect: (id: string) => void;
}) {
  const slideX = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const btnPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideX, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () =>
    Animated.timing(btnPulse, { toValue: 0.96, duration: 80, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.timing(btnPulse, { toValue: 1, duration: 80, useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateX: slideX }] }]}>
      {/* Corner accents */}
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />

      {/* Car image */}
      <View style={styles.imageBox}>
        <Image source={car.image} style={styles.carImage} resizeMode="contain" />
      </View>

      {/* Info + button */}
      <View style={styles.info}>
        <Text style={styles.carName}>{car.name}</Text>
        <Text style={styles.carTag}>[ {car.tag} ]</Text>
        <Animated.View style={{ transform: [{ scale: btnPulse }], marginTop: 10 }}>
          <TouchableOpacity
            style={styles.selectBtn}
            onPress={() => onSelect(car.id)}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={1}
          >
            <View style={styles.selectBtnGlow} />
            <Text style={styles.selectTxt}>▶  SELECT</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 14,
    alignItems: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: 54,
    left: 20,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backTxt: {
    fontFamily: MONOSPACE,
    fontSize: 11,
    color: 'rgba(0,229,255,0.6)',
    letterSpacing: 2,
  },
  headerCenter: { alignItems: 'center' },
  eyebrow: {
    fontFamily: MONOSPACE,
    fontSize: 8,
    color: 'rgba(0,229,255,0.45)',
    letterSpacing: 4,
    marginBottom: 6,
  },
  title: {
    fontFamily: MONOSPACE,
    fontSize: 24,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 6,
    textShadowColor: '#00e5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  titleUnderline: {
    width: 180,
    height: 2,
    backgroundColor: '#00e5ff',
    marginTop: 8,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  subtitle: {
    fontFamily: MONOSPACE,
    fontSize: 8,
    color: 'rgba(0,229,255,0.35)',
    letterSpacing: 3,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,229,255,0.18)',
    marginHorizontal: 16,
    marginBottom: 10,
  },

  list: {
    paddingHorizontal: 14,
    paddingTop: 6,
    gap: 14,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0,229,255,0.28)',
    backgroundColor: 'rgba(0,8,22,0.9)',
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },

  // Corner neon accents
  corner: { position: 'absolute', width: 10, height: 10 },
  cornerTL: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#00e5ff' },
  cornerTR: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#00e5ff' },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#00e5ff' },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#00e5ff' },

  imageBox: {
    width: 150,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  carImage: {
    width: 150,
    height: 90,
  },

  info: { flex: 1, gap: 4 },
  carName: {
    fontFamily: MONOSPACE,
    fontSize: 13,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 2,
    textShadowColor: '#00e5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  carTag: {
    fontFamily: MONOSPACE,
    fontSize: 8,
    color: 'rgba(0,229,255,0.45)',
    letterSpacing: 1.5,
  },

  selectBtn: {
    borderWidth: 1.5,
    borderColor: '#00e5ff',
    backgroundColor: 'rgba(0,229,255,0.06)',
    paddingVertical: 10,
    alignItems: 'center',
    overflow: 'hidden',
  },
  selectBtnGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,229,255,0.04)',
  },
  selectTxt: {
    fontFamily: MONOSPACE,
    fontSize: 13,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 3,
    textShadowColor: '#00e5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
