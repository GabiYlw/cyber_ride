import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ImageBackground,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const MONOSPACE = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

const cockpitImage = require('../assets/images/cockpit.png');

export default function CockpitScreen() {
  const router = useRouter();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.92)).current;
  const btnPulse = useRef(new Animated.Value(1)).current;
  const [imgError, setImgError] = React.useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(titleScale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(btnPulse, { toValue: 1.03, duration: 1000, useNativeDriver: true }),
        Animated.timing(btnPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const Background = ({ children }: { children: React.ReactNode }) => {
    if (imgError) {
      return (
        <LinearGradient
          colors={['#000000', '#000a1e', '#001428', '#000a1e']}
          style={[StyleSheet.absoluteFill, styles.container]}
          locations={[0, 0.3, 0.6, 1]}
        >
          {children}
        </LinearGradient>
      );
    }
    return (
      <ImageBackground
        source={cockpitImage}
        style={styles.container}
        resizeMode="cover"
        imageStyle={{ width: '100%', height: '100%', objectFit: 'cover' } as any}
        onError={() => setImgError(true)}
      >
        {children}
      </ImageBackground>
    );
  };

  return (
    <Background>
      {/* Dark overlay */}
      <View style={[StyleSheet.absoluteFill, styles.darkOverlay]} pointerEvents="none" />

      {/* Gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.85)', 'rgba(0,10,30,0.5)', 'rgba(0,10,30,0.6)', 'rgba(0,0,0,0.92)']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.25, 0.7, 1]}
        pointerEvents="none"
      />

      {/* Scanlines */}
      <View style={styles.scanlinesContainer} pointerEvents="none">
        {Array.from({ length: 40 }).map((_, i) => (
          <View key={i} style={[styles.scanline, { top: i * (height / 40) }]} />
        ))}
      </View>

      <Animated.View style={[styles.content, { opacity: fadeIn }]}>

        {/* Logo area */}
        <Animated.View style={[styles.logoArea, { transform: [{ scale: titleScale }] }]}>
          <Text style={styles.logoEyebrow}>◈ AUTOMOTIVE CYBERSECURITY ◈</Text>
          <Text style={styles.logoTitle}>CYBER RIDE</Text>
          <View style={styles.logoUnderline} />
          <Text style={styles.logoSub}>TRAINING SIMULATOR</Text>
        </Animated.View>

        {/* Buttons */}
        <View style={styles.buttonsArea}>
          <Animated.View style={{ transform: [{ scale: btnPulse }] }}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => router.push('/missions')}
              activeOpacity={0.8}
            >
              <View style={styles.btnGlow} />
              <Text style={styles.btnPrimaryText}>▶  START MISSIONS</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.push('/docs')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSecondaryText}>◆  DOCUMENTATION</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom status */}
        <View style={styles.bottomBar}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>SYSTEM ONLINE  ·  v2.4.1  ·  5 MISSIONS AVAILABLE</Text>
        </View>

      </Animated.View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  darkOverlay: {
    backgroundColor: 'rgba(0,10,30,0.6)',
  },
  scanlinesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  logoArea: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoEyebrow: {
    fontFamily: MONOSPACE,
    fontSize: 9,
    color: 'rgba(0,229,255,0.55)',
    letterSpacing: 3,
    marginBottom: 12,
  },
  logoTitle: {
    fontFamily: MONOSPACE,
    fontSize: 52,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 10,
    textShadowColor: '#00e5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  logoUnderline: {
    width: 220,
    height: 2,
    backgroundColor: '#00e5ff',
    marginTop: 10,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  logoSub: {
    fontFamily: MONOSPACE,
    fontSize: 11,
    color: 'rgba(0,229,255,0.6)',
    letterSpacing: 5,
    marginTop: 10,
  },
  buttonsArea: {
    width: '100%',
    maxWidth: 340,
    gap: 16,
    alignItems: 'center',
  },
  btnPrimary: {
    borderWidth: 2,
    borderColor: '#00e5ff',
    backgroundColor: 'rgba(0,10,30,0.9)',
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    minWidth: 280,
    overflow: 'hidden',
  },
  btnGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,229,255,0.06)',
  },
  btnPrimaryText: {
    fontFamily: MONOSPACE,
    fontSize: 18,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 3,
    textShadowColor: '#00e5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.4)',
    backgroundColor: 'rgba(0,10,30,0.6)',
    paddingVertical: 14,
    paddingHorizontal: 36,
    alignItems: 'center',
    minWidth: 280,
  },
  btnSecondaryText: {
    fontFamily: MONOSPACE,
    fontSize: 14,
    color: 'rgba(0,229,255,0.8)',
    letterSpacing: 3,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  statusText: {
    fontFamily: MONOSPACE,
    fontSize: 9,
    color: 'rgba(0,229,255,0.4)',
    letterSpacing: 1,
  },
});
