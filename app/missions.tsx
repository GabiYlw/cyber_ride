import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MISSIONS } from '../lib/missions';

const { width, height } = Dimensions.get('window');
const MONOSPACE = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

export default function MissionsScreen() {
  const router = useRouter();
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: fadeIn }]}>
      <LinearGradient colors={['#000000', '#000a1e', '#000510']} style={StyleSheet.absoluteFill} />

      {/* Scanlines */}
      <View style={styles.scanlines} pointerEvents="none">
        {Array.from({ length: 30 }).map((_, i) => (
          <View key={i} style={[styles.scanline, { top: (i / 30) * height }]} />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>◂ BACK</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>◈ SELECT MISSION ◈</Text>
          <Text style={styles.headerSub}>{MISSIONS.length} MISSIONS AVAILABLE</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.dividerLine} />

      {/* Mission list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {MISSIONS.map((mission, index) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            index={index}
            onSelect={() =>
              router.push({ pathname: '/carselect', params: { missionId: mission.id } })
            }
          />
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );
}

function MissionCard({
  mission,
  index,
  onSelect,
}: {
  mission: (typeof MISSIONS)[0];
  index: number;
  onSelect: () => void;
}) {
  const slideIn = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideIn, {
        toValue: 0,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: slideIn }], opacity }}>
      <TouchableOpacity style={styles.card} onPress={onSelect} activeOpacity={0.8}>
        {/* Left: mission number */}
        <View style={styles.cardNumber}>
          <Text style={styles.cardNumberText}>{String(mission.number).padStart(2, '0')}</Text>
        </View>

        {/* Center: info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{mission.title}</Text>
          <Text style={styles.cardSubtitle}>{mission.subtitle}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{mission.description}</Text>
          <View style={styles.cardMeta}>
            <View style={[styles.diffBadge, { borderColor: mission.difficultyColor }]}>
              <Text style={[styles.diffText, { color: mission.difficultyColor }]}>
                {mission.difficulty}
              </Text>
            </View>
            <Text style={styles.cardQuestions}>{mission.questions.length} QUESTIONS</Text>
          </View>
        </View>

        {/* Right: arrow */}
        <View style={styles.cardArrow}>
          <Text style={styles.cardArrowText}>▶</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 70,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backText: {
    fontFamily: MONOSPACE,
    fontSize: 12,
    color: 'rgba(0,229,255,0.6)',
    letterSpacing: 2,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: MONOSPACE,
    fontSize: 13,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 3,
    textShadowColor: '#00e5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerSub: {
    fontFamily: MONOSPACE,
    fontSize: 8,
    color: 'rgba(0,229,255,0.4)',
    letterSpacing: 2,
    marginTop: 3,
  },
  dividerLine: {
    height: 1,
    backgroundColor: 'rgba(0,229,255,0.2)',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.25)',
    backgroundColor: 'rgba(0,10,30,0.8)',
    marginBottom: 12,
    padding: 14,
    gap: 14,
  },
  cardNumber: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,229,255,0.05)',
    flexShrink: 0,
  },
  cardNumberText: {
    fontFamily: MONOSPACE,
    fontSize: 18,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 1,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontFamily: MONOSPACE,
    fontSize: 12,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 1.5,
  },
  cardSubtitle: {
    fontFamily: MONOSPACE,
    fontSize: 9,
    color: 'rgba(0,229,255,0.5)',
    letterSpacing: 1,
  },
  cardDesc: {
    fontFamily: MONOSPACE,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 15,
    marginTop: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  diffBadge: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  diffText: {
    fontFamily: MONOSPACE,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardQuestions: {
    fontFamily: MONOSPACE,
    fontSize: 8,
    color: 'rgba(0,229,255,0.35)',
    letterSpacing: 1,
  },
  cardArrow: {
    flexShrink: 0,
    paddingLeft: 4,
  },
  cardArrowText: {
    fontSize: 18,
    color: 'rgba(0,229,255,0.5)',
  },
});
