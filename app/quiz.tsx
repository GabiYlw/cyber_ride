import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MISSIONS } from '../lib/missions';

const cockpitImage = require('../assets/images/cockpit.png');

const { width, height } = Dimensions.get('window');
const MONOSPACE = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

type AnswerState = 'idle' | 'correct' | 'wrong';

export default function QuizScreen() {
  const router = useRouter();
  const { missionId } = useLocalSearchParams<{ missionId?: string }>();
  const mission = MISSIONS.find(m => m.id === missionId) ?? MISSIONS[0];
  const QUESTIONS = useMemo(() =>
    mission.questions.map(q => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [timeBonuses, setTimeBonuses] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [xpLabel, setXpLabel] = useState('');

  const flashAnim = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;
  const xpOpacity = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const questionAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef(30);
  const scoreRef = useRef(0);
  const wrongAnswersRef = useRef<string[]>([]);

  const question = QUESTIONS[currentIndex];

  const progressWidth = ((currentIndex) / QUESTIONS.length) * 100;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    animateQuestion();
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex]);

  const animateQuestion = () => {
    questionAnim.setValue(0);
    Animated.timing(questionAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(30);
    timeLeftRef.current = 30;

    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);

      if (timeLeftRef.current <= 10) {
        Animated.sequence([
          Animated.timing(timerAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
          Animated.timing(timerAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
      }

      if (timeLeftRef.current <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleTimeout();
      }
    }, 1000);
  };

  const handleTimeout = () => {
    setAnswerState('wrong');
    setShowExplanation(true);
    const updated = [...wrongAnswersRef.current, question.question_text];
    wrongAnswersRef.current = updated;
    setWrongAnswers(updated);
    triggerFlash('wrong');
    scheduleNext();
  };

  const triggerFlash = (type: 'correct' | 'wrong') => {
    flashAnim.setValue(type === 'correct' ? 1 : -1);
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: type === 'correct' ? 0.6 : -0.6,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const showXPBadge = (label: string) => {
    setXpLabel(label);
    xpAnim.setValue(0);
    xpOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(xpAnim, {
        toValue: -60,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(xpOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const scheduleNext = () => {
    setTimeout(() => {
      setAnswerState('idle');
      setSelectedAnswer(null);
      setShowExplanation(false);
      if (currentIndex + 1 >= QUESTIONS.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        router.push({
          pathname: '/scenario',
          params: {
            score: scoreRef.current.toString(),
            wrongAnswers: JSON.stringify(wrongAnswersRef.current),
            missionId: missionId ?? 'can_bus',
          },
        });
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 2200);
  };

  const handleAnswer = (answer: string) => {
    if (answerState !== 'idle') return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedAnswer(answer);
    const correct = answer === question.correct_answer;

    if (correct) {
      const timeBonus = Math.floor(timeLeftRef.current * 1.5);
      const earned = 50 + timeBonus;
      scoreRef.current = scoreRef.current + earned;
      setScore(scoreRef.current);
      setTimeBonuses((prev) => prev + timeBonus);
      setAnswerState('correct');
      triggerFlash('correct');
      showXPBadge(`+${earned} XP`);
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 10);
      setScore(scoreRef.current);
      setAnswerState('wrong');
      const updated = [...wrongAnswersRef.current, question.question_text];
      wrongAnswersRef.current = updated;
      setWrongAnswers(updated);
      triggerFlash('wrong');
      showXPBadge('-10 XP');
    }
    setShowExplanation(true);
    scheduleNext();
  };

  const flashBgColor = flashAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['rgba(255,68,68,0.18)', 'rgba(0,0,0,0)', 'rgba(0,255,136,0.18)'],
  });

  const timerColor = timeLeft <= 10 ? '#ff4444' : '#00e5ff';

  const getButtonStyle = (option: string) => {
    if (answerState === 'idle') return styles.answerBtn;
    if (option === question.correct_answer) return [styles.answerBtn, styles.answerCorrect];
    if (option === selectedAnswer && answerState === 'wrong') return [styles.answerBtn, styles.answerWrong];
    return [styles.answerBtn, styles.answerDim];
  };

  const getButtonTextStyle = (option: string) => {
    if (answerState === 'idle') return styles.answerBtnText;
    if (option === question.correct_answer) return [styles.answerBtnText, { color: '#00ff88' }];
    if (option === selectedAnswer && answerState === 'wrong') return [styles.answerBtnText, { color: '#ff4444' }];
    return [styles.answerBtnText, { color: 'rgba(0,229,255,0.3)' }];
  };

  const scoreDisplay = String(score).padStart(4, '0');
  const timeDisplay = String(timeLeft).padStart(2, '0');
  const questionNum = currentIndex + 1;

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      <ImageBackground
        source={cockpitImage}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        imageStyle={{ width: '100%', height: '100%', objectFit: 'cover' } as any}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.9)', 'rgba(0,10,30,0.82)', 'rgba(0,10,30,0.82)', 'rgba(0,0,0,0.95)']}
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

      {/* Corner brackets */}
      <View style={styles.cornerTL} pointerEvents="none" />
      <View style={styles.cornerTR} pointerEvents="none" />

      {/* TOP BAR */}
      <View style={styles.topBar}>
        {/* Row 1: Score | Title | Timer */}
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <Text style={styles.hudLabel}>SCORE</Text>
            <Text style={styles.scoreText}>{scoreDisplay}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressWidth}%` as any }]} />
            </View>
            <Text style={styles.hudLabel}>PROGRESS: {Math.round(progressWidth)}%</Text>
            <Text style={[styles.hudLabel, { marginTop: 6 }]}>BONUS XP</Text>
            <Text style={[styles.hudValueSm, { color: '#00ff88' }]}>{timeBonuses}</Text>
          </View>

          <View style={styles.topCenter}>
            <Text style={styles.missionTitle}>◈ CAN BUS INFILTRATION ◈</Text>
            <Text style={styles.questionNum}>Q {questionNum}/{QUESTIONS.length}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>[{question.category.toUpperCase()}]</Text>
            </View>
          </View>

          <View style={styles.topRight}>
            <Text style={styles.hudLabel}>TIME</Text>
            <Animated.Text
              style={[styles.timerText, { color: timerColor, transform: [{ scale: timerAnim }] }]}
            >
              00:{timeDisplay}
            </Animated.Text>
            {timeLeft <= 10 && <Text style={styles.warningText}>!!! ALERT</Text>}
            <Text style={[styles.hudLabel, { marginTop: 6 }]}>Q LEFT</Text>
            <Text style={[styles.hudValueSm, { textAlign: 'right' }]}>{QUESTIONS.length - currentIndex}</Text>
          </View>
        </View>

      </View>

      {/* XP Badge animation */}
      <Animated.View
        style={[
          styles.xpBadge,
          {
            opacity: xpOpacity,
            transform: [{ translateY: xpAnim }],
          },
        ]}
        pointerEvents="none"
      >
        <Text
          style={[
            styles.xpBadgeText,
            { color: answerState === 'correct' ? '#00ff88' : '#ff4444' },
          ]}
        >
          {xpLabel}
        </Text>
      </Animated.View>

      {/* BOTTOM PANEL: Question + Answers */}
      <View style={styles.bottomPanel}>
        <View style={styles.questionPanel}>
          {/* Question */}
          <Animated.View style={{ opacity: questionAnim }}>
            <Text style={styles.questionText}>{question.question_text}</Text>
          </Animated.View>

          {/* Explanation */}
          {showExplanation && (
            <View
              style={[
                styles.explanationBox,
                {
                  borderColor:
                    answerState === 'correct'
                      ? 'rgba(0,255,136,0.4)'
                      : 'rgba(255,68,68,0.4)',
                  backgroundColor:
                    answerState === 'correct'
                      ? 'rgba(0,255,136,0.08)'
                      : 'rgba(255,68,68,0.08)',
                },
              ]}
            >
              <Text
                style={[
                  styles.explanationTitle,
                  {
                    color:
                      answerState === 'correct' ? '#00ff88' : '#ff4444',
                  },
                ]}
              >
                {answerState === 'correct' ? '✓ CORRECT' : '✗ INCORRECT'} — DEBRIEF:
              </Text>
              <Text style={styles.explanationText}>{question.explanation}</Text>
            </View>
          )}

          {/* Answer buttons */}
          <View style={styles.answersGrid}>
            {question.options.map((option, idx) => (
              <TouchableOpacity
                key={idx}
                style={getButtonStyle(option)}
                onPress={() => handleAnswer(option)}
                activeOpacity={0.75}
                disabled={answerState !== 'idle'}
              >
                <Text style={styles.answerBtnLetter}>
                  {String.fromCharCode(65 + idx)}.
                </Text>
                <Text style={getButtonTextStyle(option) as any} numberOfLines={2}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
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
  cornerTL: {
    position: 'absolute',
    top: 15,
    left: 10,
    width: 30,
    height: 30,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(0,229,255,0.4)',
  },
  cornerTR: {
    position: 'absolute',
    top: 15,
    right: 10,
    width: 30,
    height: 30,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(0,229,255,0.4)',
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topLeft: {
    width: '28%',
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topRight: {
    width: '28%',
    alignItems: 'flex-end',
  },
  missionTitle: {
    fontFamily: MONOSPACE,
    fontSize: 11,
    color: 'rgba(0,229,255,0.7)',
    letterSpacing: 3,
  },
  questionNum: {
    fontFamily: MONOSPACE,
    fontSize: 22,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 6,
    textShadowColor: '#00e5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginTop: 2,
  },
  categoryBadge: {
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 4,
    backgroundColor: 'rgba(0,10,30,0.6)',
  },
  categoryText: {
    fontFamily: MONOSPACE,
    fontSize: 8,
    color: 'rgba(0,229,255,0.6)',
    letterSpacing: 2,
  },
  hudLabel: {
    fontFamily: MONOSPACE,
    fontSize: 8,
    color: 'rgba(0,229,255,0.5)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  scoreText: {
    fontFamily: MONOSPACE,
    fontSize: 24,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 4,
    textShadowColor: '#00e5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(0,229,255,0.15)',
    marginVertical: 6,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00e5ff',
    borderRadius: 2,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0,229,255,0.15)',
    marginVertical: 8,
  },
  categoryValueText: {
    fontFamily: MONOSPACE,
    fontSize: 10,
    color: '#00e5ff',
    fontWeight: '900',
    letterSpacing: 1,
  },
  timerText: {
    fontFamily: MONOSPACE,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textShadowColor: '#ff4444',
  },
  warningText: {
    fontFamily: MONOSPACE,
    fontSize: 9,
    color: '#ff4444',
    letterSpacing: 2,
    marginTop: 2,
  },
  hudValueSm: {
    fontFamily: MONOSPACE,
    fontSize: 16,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 2,
  },
  xpBadge: {
    position: 'absolute',
    top: height * 0.38,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  xpBadgeText: {
    fontFamily: MONOSPACE,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: '2%',
    left: '6%',
    right: '6%',
  },
  questionPanel: {
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.4)',
    backgroundColor: 'rgba(0,10,30,0.82)',
    padding: 16,
  },
  questionText: {
    fontFamily: MONOSPACE,
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 22,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  explanationBox: {
    borderWidth: 1,
    borderRadius: 2,
    padding: 10,
    marginBottom: 10,
  },
  explanationTitle: {
    fontFamily: MONOSPACE,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  explanationText: {
    fontFamily: MONOSPACE,
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 16,
  },
  answersGrid: {
    gap: 8,
  },
  answerBtn: {
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.4)',
    backgroundColor: 'rgba(0,10,30,0.7)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  answerCorrect: {
    borderColor: 'rgba(0,255,136,0.7)',
    backgroundColor: 'rgba(0,255,136,0.08)',
  },
  answerWrong: {
    borderColor: 'rgba(255,68,68,0.7)',
    backgroundColor: 'rgba(255,68,68,0.08)',
  },
  answerDim: {
    borderColor: 'rgba(0,229,255,0.1)',
    backgroundColor: 'rgba(0,10,30,0.3)',
  },
  answerBtnLetter: {
    fontFamily: MONOSPACE,
    fontSize: 11,
    color: 'rgba(0,229,255,0.6)',
    fontWeight: '900',
    minWidth: 18,
  },
  answerBtnText: {
    fontFamily: MONOSPACE,
    fontSize: 12,
    color: '#00e5ff',
    flex: 1,
    letterSpacing: 0.5,
  },
});
