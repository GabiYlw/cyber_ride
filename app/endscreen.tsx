import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const MONOSPACE = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

type Badge = {
  icon: string;
  title: string;
  description: string;
  condition: string;
  earned: boolean;
};

export default function EndScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    score: string;
    wrongAnswers: string;
    timeBonuses: string;
  }>();

  const score = parseInt(params.score ?? '0', 10);
  const wrongAnswers: string[] = JSON.parse(params.wrongAnswers ?? '[]');
  const timeBonuses = parseInt(params.timeBonuses ?? '0', 10);
  const xpEarned = score;

  const missionComplete = score >= 100;

  const avgResponseTime = 15; // Default assumed
  const allCorrect = wrongAnswers.length === 0;

  const badges: Badge[] = [
    {
      icon: '🛡️',
      title: 'FIREWALL GUARDIAN',
      description: 'Score over 200 XP',
      condition: 'score > 200',
      earned: score > 200,
    },
    {
      icon: '⚡',
      title: 'QUICK RESPONDER',
      description: 'Avg response under 15s',
      condition: 'avg < 15s',
      earned: avgResponseTime < 15,
    },
    {
      icon: '🔍',
      title: 'THREAT ANALYST',
      description: 'All answers correct',
      condition: 'all correct',
      earned: allCorrect,
    },
  ];

  const earnedBadges = badges.filter((b) => b.earned);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.6)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);
  const scanlineOffset = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.5)).current;
  const badgeAnims = useRef(badges.map(() => new Animated.Value(0))).current;
  const starParticles = useRef(
    Array.from({ length: 8 }).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    // Title animation
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(titleScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 200);

    // Score count up
    const scoreInterval = setInterval(() => {
      setDisplayScore((prev) => {
        const next = prev + Math.ceil(score / 30);
        if (next >= score) {
          clearInterval(scoreInterval);
          return score;
        }
        return next;
      });
    }, 50);

    // Scanline
    Animated.loop(
      Animated.timing(scanlineOffset, { toValue: height, duration: 4000, useNativeDriver: true })
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Badge reveal
    badgeAnims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.spring(anim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }).start();
      }, 800 + i * 200);
    });

    // Particles if mission complete
    if (missionComplete) {
      starParticles.forEach((p, i) => {
        const angle = (i / starParticles.length) * Math.PI * 2;
        setTimeout(() => {
          p.opacity.setValue(1);
          Animated.parallel([
            Animated.timing(p.x, {
              toValue: Math.cos(angle) * 80,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(p.y, {
              toValue: Math.sin(angle) * 80,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(p.opacity, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]).start();
        }, 600 + i * 50);
      });
    }

    return () => clearInterval(scoreInterval);
  }, []);

  const scoreDisplay = String(displayScore).padStart(4, '0');

  const getRank = () => {
    if (score >= 400) return { rank: 'ELITE AGENT', color: '#00e5ff' };
    if (score >= 300) return { rank: 'SENIOR ANALYST', color: '#00ff88' };
    if (score >= 200) return { rank: 'FIELD OPERATIVE', color: '#ffa500' };
    if (score >= 100) return { rank: 'RECRUIT', color: '#ff4444' };
    return { rank: 'TRAINEE', color: 'rgba(255,255,255,0.5)' };
  };

  const { rank, color: rankColor } = getRank();

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      <LinearGradient
        colors={missionComplete ? ['#000000', '#000a1e', '#001428'] : ['#000000', '#0a0005', '#150000']}
        style={StyleSheet.absoluteFill}
      />

      {/* Scanlines */}
      <View style={styles.scanlinesContainer} pointerEvents="none">
        {Array.from({ length: 40 }).map((_, i) => (
          <View key={i} style={[styles.scanline, { top: i * (height / 40) }]} />
        ))}
      </View>
      <Animated.View
        style={[styles.scanlineSweep, { transform: [{ translateY: scanlineOffset }] }]}
        pointerEvents="none"
      />

      {/* Corner frames */}
      <View
        style={[styles.cornerTL, { borderColor: missionComplete ? '#00e5ff' : '#ff4444' }]}
      />
      <View
        style={[styles.cornerTR, { borderColor: missionComplete ? '#00e5ff' : '#ff4444' }]}
      />
      <View
        style={[styles.cornerBL, { borderColor: missionComplete ? '#00e5ff' : '#ff4444' }]}
      />
      <View
        style={[styles.cornerBR, { borderColor: missionComplete ? '#00e5ff' : '#ff4444' }]}
      />

      {/* Star particles */}
      {missionComplete &&
        starParticles.map((p, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                opacity: p.opacity,
                transform: [{ translateX: p.x }, { translateY: p.y }],
              },
            ]}
            pointerEvents="none"
          />
        ))}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Phase label */}
        <Text style={styles.phaseLabel}>◈ MISSION DEBRIEF ◈</Text>

        {/* Main title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ scale: titleScale }],
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.missionTitle,
              {
                color: missionComplete ? '#00e5ff' : '#ff4444',
                opacity: glowPulse,
              },
            ]}
          >
            {missionComplete ? 'MISSION COMPLETE' : 'MISSION FAILED'}
          </Animated.Text>
          <View
            style={[
              styles.titleBar,
              { backgroundColor: missionComplete ? '#00e5ff' : '#ff4444' },
            ]}
          />
        </Animated.View>

        {/* Score panel */}
        <View style={styles.scorePanel}>
          <Text style={styles.scorePanelLabel}>TOTAL SCORE</Text>
          <Text style={styles.scorePanelValue}>{scoreDisplay}</Text>
          <View style={styles.scoreRow}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>XP EARNED</Text>
              <Text style={[styles.scoreItemValue, { color: '#00ff88' }]}>+{xpEarned}</Text>
            </View>
            <View style={styles.scoreItemDivider} />
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>RANK</Text>
              <Text style={[styles.scoreItemValue, { color: rankColor }]}>{rank}</Text>
            </View>
            <View style={styles.scoreItemDivider} />
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>ERRORS</Text>
              <Text style={[styles.scoreItemValue, { color: '#ff4444' }]}>{wrongAnswers.length}</Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>ACHIEVEMENTS</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.badgesContainer}>
          {badges.map((badge, i) => (
            <Animated.View
              key={i}
              style={[
                styles.badgeCard,
                badge.earned ? styles.badgeEarned : styles.badgeLocked,
                {
                  opacity: badgeAnims[i],
                  transform: [{ scale: badgeAnims[i] }],
                },
              ]}
            >
              <Text style={[styles.badgeIcon, { opacity: badge.earned ? 1 : 0.25 }]}>
                {badge.earned ? badge.icon : '🔒'}
              </Text>
              <View style={styles.badgeInfo}>
                <Text
                  style={[
                    styles.badgeTitle,
                    { color: badge.earned ? '#00e5ff' : 'rgba(0,229,255,0.25)' },
                  ]}
                >
                  {badge.title}
                </Text>
                <Text
                  style={[
                    styles.badgeDesc,
                    { color: badge.earned ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)' },
                  ]}
                >
                  {badge.description}
                </Text>
              </View>
              {badge.earned && (
                <Text style={styles.badgeCheck}>✓</Text>
              )}
            </Animated.View>
          ))}
        </View>

        {/* Wrong answers debrief */}
        {wrongAnswers.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionLine} />
              <Text style={[styles.sectionTitle, { color: '#ff4444' }]}>ERRORS ANALYSIS</Text>
              <View style={styles.sectionLine} />
            </View>

            <View style={styles.debriefPanel}>
              <Text style={styles.debriefHeader}>■ MISSED QUESTIONS</Text>
              {wrongAnswers.map((q, i) => (
                <View key={i} style={styles.wrongAnswerRow}>
                  <Text style={styles.wrongAnswerBullet}>✗</Text>
                  <Text style={styles.wrongAnswerText} numberOfLines={3}>
                    {q}
                  </Text>
                </View>
              ))}
              <Text style={styles.debriefAdvice}>
                RECOMANDARE: Revizuiți modulele de securitate automotive și repetați misiunea pentru a consolida cunoștințele.
              </Text>
            </View>
          </>
        )}

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.playAgainBtn}
            onPress={() => router.replace('/missions')}
            activeOpacity={0.8}
          >
            <Text style={styles.playAgainText}>↺ PLAY AGAIN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => router.replace('/')}
            activeOpacity={0.8}
          >
            <Text style={styles.exitText}>✕ EXIT</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBranding}>
          <Text style={styles.brandingText}>CYBER RIDE v2.4.1 — AUTOMOTIVE SECURITY TRAINING</Text>
          <Text style={styles.brandingText}>[CLASSIFIED SYSTEM — AUTHORIZED USE ONLY]</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scanlinesContainer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  scanlineSweep: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,229,255,0.08)',
  },
  cornerTL: {
    position: 'absolute', top: 20, left: 15, width: 28, height: 28,
    borderTopWidth: 2, borderLeftWidth: 2, zIndex: 10,
  },
  cornerTR: {
    position: 'absolute', top: 20, right: 15, width: 28, height: 28,
    borderTopWidth: 2, borderRightWidth: 2, zIndex: 10,
  },
  cornerBL: {
    position: 'absolute', bottom: 20, left: 15, width: 28, height: 28,
    borderBottomWidth: 2, borderLeftWidth: 2, zIndex: 10,
  },
  cornerBR: {
    position: 'absolute', bottom: 20, right: 15, width: 28, height: 28,
    borderBottomWidth: 2, borderRightWidth: 2, zIndex: 10,
  },
  particle: {
    position: 'absolute',
    top: height * 0.22,
    left: width / 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  phaseLabel: {
    fontFamily: MONOSPACE,
    fontSize: 10,
    color: 'rgba(0,229,255,0.55)',
    letterSpacing: 4,
    marginBottom: 16,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  missionTitle: {
    fontFamily: MONOSPACE,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleBar: {
    width: 200,
    height: 2,
    marginTop: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  scorePanel: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.4)',
    backgroundColor: 'rgba(0,10,30,0.85)',
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  scorePanelLabel: {
    fontFamily: MONOSPACE,
    fontSize: 9,
    color: 'rgba(0,229,255,0.55)',
    letterSpacing: 4,
    marginBottom: 8,
  },
  scorePanelValue: {
    fontFamily: MONOSPACE,
    fontSize: 56,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 8,
    textShadowColor: '#00e5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  scoreItemDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0,229,255,0.2)',
  },
  scoreItemLabel: {
    fontFamily: MONOSPACE,
    fontSize: 8,
    color: 'rgba(0,229,255,0.5)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoreItemValue: {
    fontFamily: MONOSPACE,
    fontSize: 16,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    marginBottom: 14,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,229,255,0.2)',
  },
  sectionTitle: {
    fontFamily: MONOSPACE,
    fontSize: 10,
    color: '#00e5ff',
    letterSpacing: 3,
  },
  badgesContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  badgeEarned: {
    borderColor: 'rgba(0,229,255,0.4)',
    backgroundColor: 'rgba(0,10,30,0.8)',
  },
  badgeLocked: {
    borderColor: 'rgba(0,229,255,0.1)',
    backgroundColor: 'rgba(0,10,30,0.4)',
  },
  badgeIcon: {
    fontSize: 28,
  },
  badgeInfo: {
    flex: 1,
    gap: 3,
  },
  badgeTitle: {
    fontFamily: MONOSPACE,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  badgeDesc: {
    fontFamily: MONOSPACE,
    fontSize: 9,
    letterSpacing: 1,
  },
  badgeCheck: {
    fontFamily: MONOSPACE,
    fontSize: 18,
    color: '#00ff88',
    fontWeight: '900',
  },
  debriefPanel: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.3)',
    backgroundColor: 'rgba(30,0,0,0.5)',
    padding: 14,
    marginBottom: 24,
    gap: 8,
  },
  debriefHeader: {
    fontFamily: MONOSPACE,
    fontSize: 9,
    color: '#ff4444',
    letterSpacing: 2,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,68,68,0.2)',
  },
  wrongAnswerRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  wrongAnswerBullet: {
    fontFamily: MONOSPACE,
    fontSize: 12,
    color: '#ff4444',
    marginTop: 1,
  },
  wrongAnswerText: {
    fontFamily: MONOSPACE,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
    lineHeight: 18,
  },
  debriefAdvice: {
    fontFamily: MONOSPACE,
    fontSize: 10,
    color: 'rgba(255,165,0,0.7)',
    lineHeight: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255,68,68,0.15)',
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  playAgainBtn: {
    borderWidth: 2,
    borderColor: '#00e5ff',
    backgroundColor: 'rgba(0,10,30,0.9)',
    padding: 18,
    alignItems: 'center',
  },
  playAgainText: {
    fontFamily: MONOSPACE,
    fontSize: 18,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 4,
    textShadowColor: '#00e5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  exitBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.5)',
    backgroundColor: 'rgba(30,0,0,0.5)',
    padding: 14,
    alignItems: 'center',
  },
  exitText: {
    fontFamily: MONOSPACE,
    fontSize: 13,
    color: '#ff4444',
    letterSpacing: 4,
  },
  bottomBranding: {
    alignItems: 'center',
    gap: 4,
  },
  brandingText: {
    fontFamily: MONOSPACE,
    fontSize: 8,
    color: 'rgba(0,229,255,0.25)',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
