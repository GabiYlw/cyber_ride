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
import { MISSIONS } from '../lib/missions';

const { width, height } = Dimensions.get('window');
const MONOSPACE = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

type DecisionResult = 'idle' | 'correct' | 'partial' | 'wrong';

export default function ScenarioScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ score: string; wrongAnswers: string; missionId: string }>();
  const baseScore = parseInt(params.score ?? '0', 10);
  const wrongAnswers: string[] = JSON.parse(params.wrongAnswers ?? '[]');
  const mission = MISSIONS.find(m => m.id === params.missionId) ?? MISSIONS[0];
  const SCENARIO = mission.scenario;
  const DECISIONS = SCENARIO.decisions;

  const [selectedDecision, setSelectedDecision] = useState<number | null>(null);
  const [decisionResult, setDecisionResult] = useState<DecisionResult>('idle');
  const [finalScore, setFinalScore] = useState(baseScore);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const alertPulse = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const feedbackSlide = useRef(new Animated.Value(40)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const glitchAnim = useRef(new Animated.Value(0)).current;
  const scanlineOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Alert pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(alertPulse, { toValue: 1.04, duration: 600, useNativeDriver: true }),
        Animated.timing(alertPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    // Glitch effect
    const glitchLoop = setInterval(() => {
      Animated.sequence([
        Animated.timing(glitchAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
        Animated.timing(glitchAnim, { toValue: -3, duration: 50, useNativeDriver: true }),
        Animated.timing(glitchAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }, 2500);

    // Scanline
    Animated.loop(
      Animated.timing(scanlineOffset, { toValue: height, duration: 4000, useNativeDriver: true })
    ).start();

    return () => clearInterval(glitchLoop);
  }, []);

  const handleDecision = (decision: typeof DECISIONS[0]) => {
    if (selectedDecision !== null) return;
    setSelectedDecision(decision.id);
    setDecisionResult(decision.result);
    const newScore = Math.max(0, finalScore + decision.xpDelta);
    setFinalScore(newScore);

    // Flash
    flashAnim.setValue(decision.result === 'correct' ? 1 : decision.result === 'wrong' ? -1 : 0.5);
    Animated.timing(flashAnim, { toValue: 0, duration: 600, useNativeDriver: false }).start();

    // Feedback slide in
    Animated.parallel([
      Animated.timing(feedbackSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(feedbackOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const handleContinue = () => {
    router.push({
      pathname: '/endscreen',
      params: {
        score: finalScore.toString(),
        wrongAnswers: JSON.stringify(wrongAnswers),
        timeBonuses: '0',
      },
    });
  };

  const flashBgColor = flashAnim.interpolate({
    inputRange: [-1, 0, 0.5, 1],
    outputRange: [
      'rgba(255,68,68,0.2)',
      'rgba(0,0,0,0)',
      'rgba(255,165,0,0.15)',
      'rgba(0,255,136,0.2)',
    ],
  });

  const getDecisionStyle = (dec: typeof DECISIONS[0]) => {
    if (selectedDecision === null) return styles.decisionBtn;
    if (selectedDecision === dec.id) {
      if (dec.result === 'correct') return [styles.decisionBtn, styles.decisionCorrect];
      if (dec.result === 'wrong') return [styles.decisionBtn, styles.decisionWrong];
      return [styles.decisionBtn, styles.decisionPartial];
    }
    return [styles.decisionBtn, styles.decisionDim];
  };

  const getDecisionBadge = (dec: typeof DECISIONS[0]) => {
    if (dec.result === 'correct') return { label: `+${dec.xpDelta} XP`, color: '#00ff88' };
    if (dec.result === 'wrong') return { label: `${dec.xpDelta} XP`, color: '#ff4444' };
    return { label: `+${dec.xpDelta} XP`, color: '#ffa500' };
  };

  const getResultIcon = () => {
    if (decisionResult === 'correct') return '✓ RĂSPUNS OPTIMAL';
    if (decisionResult === 'wrong') return '✗ DECIZIE GREȘITĂ';
    if (decisionResult === 'partial') return '◐ RĂSPUNS PARȚIAL';
    return '';
  };

  const getResultColor = () => {
    if (decisionResult === 'correct') return '#00ff88';
    if (decisionResult === 'wrong') return '#ff4444';
    return '#ffa500';
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      <LinearGradient
        colors={['#000000', '#0a0005', '#000a1e']}
        style={StyleSheet.absoluteFill}
      />

      {/* Flash overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: flashBgColor }]}
        pointerEvents="none"
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
      <View style={styles.cornerTL} />
      <View style={styles.cornerTR} />
      <View style={styles.cornerBL} />
      <View style={styles.cornerBR} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.phaseLabel}>◈ PHASE 2: INCIDENT RESPONSE ◈</Text>
          <Text style={styles.scoreDisplay}>XP: {finalScore}</Text>
        </View>

        {/* Alert header */}
        <Animated.View
          style={[styles.alertHeader, { transform: [{ scale: alertPulse }, { translateX: glitchAnim }] }]}
        >
          <Text style={styles.alertIcon}>⚠</Text>
          <Text style={styles.alertTitle}>{SCENARIO.alertTitle}</Text>
          <Text style={styles.alertIcon}>⚠</Text>
        </Animated.View>

        {/* Scenario panel */}
        <View style={styles.scenarioPanel}>
          <View style={styles.scenarioHeader}>
            <Text style={styles.scenarioHeaderText}>■ INCIDENT REPORT — LIVE</Text>
            <View style={styles.liveDot} />
          </View>
          <Text style={styles.scenarioText}>{SCENARIO.description}</Text>
          <Text style={styles.scenarioText}>
            {`\nSistemul detectează activitate suspectă:\n${SCENARIO.threats.map(t => `  → ${t}`).join('\n')}`}
          </Text>
          <View style={styles.scenarioFooter}>
            <Text style={styles.scenarioFooterText}>SURSA: {SCENARIO.source}</Text>
            <Text style={[styles.scenarioFooterText, { color: '#ff4444' }]}>STATUS: BREACH ACTIVE</Text>
          </View>
        </View>

        {/* Decision prompt */}
        <View style={styles.promptRow}>
          <View style={styles.promptLine} />
          <Text style={styles.promptText}>CE FACI?</Text>
          <View style={styles.promptLine} />
        </View>

        {/* Decision buttons */}
        <View style={styles.decisionsContainer}>
          {DECISIONS.map((dec, idx) => {
            const badge = getDecisionBadge(dec);
            return (
              <TouchableOpacity
                key={dec.id}
                style={getDecisionStyle(dec)}
                onPress={() => handleDecision(dec)}
                activeOpacity={0.75}
                disabled={selectedDecision !== null}
              >
                <View style={styles.decisionContent}>
                  <Text style={styles.decisionNumber}>{String.fromCharCode(65 + idx)}</Text>
                  <Text style={styles.decisionText}>{dec.text}</Text>
                </View>
                {selectedDecision === dec.id && (
                  <Text style={[styles.xpBadge, { color: badge.color }]}>
                    {badge.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback panel */}
        {selectedDecision !== null && (
          <Animated.View
            style={[
              styles.feedbackPanel,
              {
                opacity: feedbackOpacity,
                transform: [{ translateY: feedbackSlide }],
                borderColor:
                  decisionResult === 'correct'
                    ? 'rgba(0,255,136,0.5)'
                    : decisionResult === 'wrong'
                    ? 'rgba(255,68,68,0.5)'
                    : 'rgba(255,165,0,0.5)',
              },
            ]}
          >
            <Text style={[styles.feedbackTitle, { color: getResultColor() }]}>
              {getResultIcon()}
            </Text>
            <Text style={styles.feedbackText}>
              {DECISIONS.find((d) => d.id === selectedDecision)?.feedback}
            </Text>
          </Animated.View>
        )}

        {/* Continue button */}
        {selectedDecision !== null && (
          <Animated.View style={{ opacity: feedbackOpacity }}>
            <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.8}>
              <Text style={styles.continueBtnText}>► FINISH</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

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
    height: 3,
    backgroundColor: 'rgba(255,68,68,0.1)',
  },
  cornerTL: {
    position: 'absolute', top: 20, left: 15, width: 25, height: 25,
    borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#ff4444', zIndex: 10,
  },
  cornerTR: {
    position: 'absolute', top: 20, right: 15, width: 25, height: 25,
    borderTopWidth: 2, borderRightWidth: 2, borderColor: '#ff4444', zIndex: 10,
  },
  cornerBL: {
    position: 'absolute', bottom: 20, left: 15, width: 25, height: 25,
    borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#ff4444', zIndex: 10,
  },
  cornerBR: {
    position: 'absolute', bottom: 20, right: 15, width: 25, height: 25,
    borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#ff4444', zIndex: 10,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  phaseLabel: {
    fontFamily: MONOSPACE,
    fontSize: 9,
    color: 'rgba(255,68,68,0.7)',
    letterSpacing: 2,
  },
  scoreDisplay: {
    fontFamily: MONOSPACE,
    fontSize: 14,
    color: '#00e5ff',
    fontWeight: '900',
    letterSpacing: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  alertIcon: {
    fontSize: 24,
    color: '#ff4444',
    textShadowColor: '#ff4444',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  alertTitle: {
    fontFamily: MONOSPACE,
    fontSize: 26,
    fontWeight: '900',
    color: '#ff4444',
    letterSpacing: 6,
    textShadowColor: '#ff4444',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  scenarioPanel: {
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.4)',
    backgroundColor: 'rgba(30,0,0,0.6)',
    padding: 16,
    marginBottom: 20,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,68,68,0.2)',
  },
  scenarioHeaderText: {
    fontFamily: MONOSPACE,
    fontSize: 9,
    color: '#ff4444',
    letterSpacing: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  scenarioText: {
    fontFamily: MONOSPACE,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
  },
  scenarioFooter: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255,68,68,0.2)',
    gap: 2,
  },
  scenarioFooterText: {
    fontFamily: MONOSPACE,
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  promptLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,229,255,0.3)',
  },
  promptText: {
    fontFamily: MONOSPACE,
    fontSize: 16,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 4,
    textShadowColor: '#00e5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  decisionsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  decisionBtn: {
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.4)',
    backgroundColor: 'rgba(0,10,30,0.8)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  decisionCorrect: {
    borderColor: 'rgba(0,255,136,0.7)',
    backgroundColor: 'rgba(0,255,136,0.1)',
  },
  decisionWrong: {
    borderColor: 'rgba(255,68,68,0.7)',
    backgroundColor: 'rgba(255,68,68,0.1)',
  },
  decisionPartial: {
    borderColor: 'rgba(255,165,0,0.7)',
    backgroundColor: 'rgba(255,165,0,0.1)',
  },
  decisionDim: {
    borderColor: 'rgba(0,229,255,0.1)',
    backgroundColor: 'rgba(0,10,30,0.4)',
  },
  decisionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  decisionNumber: {
    fontFamily: MONOSPACE,
    fontSize: 14,
    fontWeight: '900',
    color: 'rgba(0,229,255,0.6)',
    minWidth: 20,
  },
  decisionText: {
    fontFamily: MONOSPACE,
    fontSize: 13,
    color: '#00e5ff',
    flex: 1,
    lineHeight: 20,
  },
  xpBadge: {
    fontFamily: MONOSPACE,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginLeft: 8,
  },
  feedbackPanel: {
    borderWidth: 1,
    backgroundColor: 'rgba(0,10,30,0.9)',
    padding: 14,
    marginBottom: 16,
  },
  feedbackTitle: {
    fontFamily: MONOSPACE,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
  },
  feedbackText: {
    fontFamily: MONOSPACE,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  continueBtn: {
    borderWidth: 2,
    borderColor: '#00e5ff',
    backgroundColor: 'rgba(0,10,30,0.9)',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueBtnText: {
    fontFamily: MONOSPACE,
    fontSize: 16,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 4,
    textShadowColor: '#00e5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
