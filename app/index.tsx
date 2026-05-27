import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';

const { width, height } = Dimensions.get('window');
const MONOSPACE = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

// Persists for the lifetime of the JS bundle (resets only on refresh / app restart)
let introPlayed = false;

export default function IndexScreen() {
  const router = useRouter();
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const scanlineOffset = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;
  const borderOpacity = useRef(new Animated.Value(0)).current;
  const [bootLines, setBootLines] = useState<string[]>([]);

  const BOOT_SEQUENCE = [
    '> INITIALIZING CYBER_RIDE v2.4.1...',
    '> LOADING AUTOMOTIVE SECURITY MODULES...',
    '> CAN BUS ANALYZER: ONLINE',
    '> OBD-II INTERCEPTOR: READY',
    '> V2X THREAT DATABASE: LOADED',
    '> ENCRYPTION ENGINE: ACTIVE',
    '> SYSTEM READY.',
  ];

  useEffect(() => {
    // Skip intro if already played this session — go straight to cockpit
    if (introPlayed) {
      router.replace('/cockpit');
      return;
    }
    introPlayed = true;

    // Boot sequence lines
    BOOT_SEQUENCE.forEach((line, index) => {
      setTimeout(() => {
        setBootLines((prev) => [...prev, line]);
      }, index * 200);
    });

    // Scanline animation
    Animated.loop(
      Animated.timing(scanlineOffset, {
        toValue: height,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Title fade in after 1s
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(borderOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1000);

    // Subtitle fade in after 1.8s
    setTimeout(() => {
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, 1800);

    // Navigate after 4s
    const navTimer = setTimeout(() => {
      router.replace('/cockpit');
    }, 4000);

    return () => clearTimeout(navTimer);
  }, []);

  const handleVideoError = useCallback(() => {
    setVideoError(true);
  }, []);

  const handleVideoLoad = useCallback(() => {
    setVideoLoaded(true);
  }, []);

  return (
    <View style={styles.container}>
      {/* Video background — show if available */}
      {!videoError && (
        <Video
          source={require('../assets/videos/door_open.mp4')}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' } as any}
          shouldPlay
          isLooping={false}
          isMuted
          onError={handleVideoError}
          onLoad={handleVideoLoad}
        />
      )}

      {/* Gradient overlay (always visible) */}
      <LinearGradient
        colors={
          videoLoaded && !videoError
            ? ['rgba(0,0,0,0.6)', 'rgba(0,10,30,0.75)', 'rgba(0,0,0,0.8)']
            : ['#000000', '#000a1e', '#001020']
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Grid overlay */}
      <View style={styles.gridOverlay} pointerEvents="none">
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={[styles.gridLineH, { top: (i / 20) * height }]}
          />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={[styles.gridLineV, { left: (i / 12) * width }]}
          />
        ))}
      </View>

      {/* Scanline effect */}
      <Animated.View
        style={[
          styles.scanline,
          { transform: [{ translateY: scanlineOffset }] },
        ]}
        pointerEvents="none"
      />

      {/* Corner brackets */}
      <Animated.View style={[styles.cornerTL, { opacity: borderOpacity }]} />
      <Animated.View style={[styles.cornerTR, { opacity: borderOpacity }]} />
      <Animated.View style={[styles.cornerBL, { opacity: borderOpacity }]} />
      <Animated.View style={[styles.cornerBR, { opacity: borderOpacity }]} />

      {/* Boot sequence */}
      <View style={styles.bootContainer}>
        {bootLines.map((line, i) => (
          <Text key={i} style={styles.bootText}>
            {line}
          </Text>
        ))}
      </View>

      {/* Main title */}
      <View style={styles.centerContent}>
        <Animated.View style={[styles.titleContainer, { opacity: titleOpacity }]}>
          <Animated.Text
            style={[
              styles.title,
              { opacity: glowPulse },
            ]}
          >
            CYBER RIDE
          </Animated.Text>
          <View style={styles.titleUnderline} />
        </Animated.View>

        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          AUTOMOTIVE CYBERSECURITY TRAINING
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { opacity: subtitleOpacity }]}>
          [CLASSIFIED — AUTHORIZED PERSONNEL ONLY]
        </Animated.Text>
      </View>

      {/* Bottom status */}
      <View style={styles.bottomBar}>
        <Text style={styles.statusText}>■ SYSTEM ARMED</Text>
        <Text style={styles.statusText}>◈ ENCRYPTION: ON</Text>
        <Text style={styles.statusText}>▲ THREAT LEVEL: HIGH</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,229,255,0.04)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0,229,255,0.04)',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,229,255,0.12)',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  cornerTL: {
    position: 'absolute',
    top: 30,
    left: 20,
    width: 40,
    height: 40,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#00e5ff',
  },
  cornerTR: {
    position: 'absolute',
    top: 30,
    right: 20,
    width: 40,
    height: 40,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#00e5ff',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    width: 40,
    height: 40,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#00e5ff',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 40,
    height: 40,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#00e5ff',
  },
  bootContainer: {
    position: 'absolute',
    top: 80,
    left: 30,
    right: 30,
  },
  bootText: {
    fontFamily: MONOSPACE,
    fontSize: 10,
    color: 'rgba(0,229,255,0.55)',
    lineHeight: 18,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: MONOSPACE,
    fontSize: 52,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 12,
    textShadowColor: '#00e5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleUnderline: {
    width: 240,
    height: 2,
    backgroundColor: '#00e5ff',
    marginTop: 8,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  subtitle: {
    fontFamily: MONOSPACE,
    fontSize: 13,
    color: '#00e5ff',
    letterSpacing: 4,
    marginTop: 8,
    opacity: 0.85,
  },
  tagline: {
    fontFamily: MONOSPACE,
    fontSize: 10,
    color: 'rgba(255,68,68,0.8)',
    letterSpacing: 2,
    marginTop: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  statusText: {
    fontFamily: MONOSPACE,
    fontSize: 9,
    color: 'rgba(0,255,136,0.7)',
    letterSpacing: 1,
  },
});
