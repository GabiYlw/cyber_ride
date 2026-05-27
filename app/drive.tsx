import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Platform,
  PanResponder,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const CAR_IMAGES: Record<string, ReturnType<typeof require>> = {
  cla:     require('../assets/cars/cla.png'),
  cls:     require('../assets/cars/cls.png'),
  g_class: require('../assets/cars/g_class.png'),
  gls:     require('../assets/cars/gls.png'),
  sl:      require('../assets/cars/sl.png'),
};

const MONOSPACE = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

const LANES = 3;
const CAR_W = 190;
const OBS_W = 80;
const SPEED = 5;
const TICK = 16;
const GAME_S = 20;
const TOTAL_TICKS = (GAME_S * 1000) / TICK;
const MARK_PERIOD = 120;
const MARK_W = 65;
const CHECKPOINT_AT = 65;

const WW = 4; const WH = 3;
type WinDef = { xf: number; yf: number; lit: boolean };
type BuildingDef = { x: number; w: number; hFrac: number; fill: string; top: string; side: string; winLit: string; antenna?: boolean; wins: WinDef[] };

const BUILDING_DEFS: BuildingDef[] = [
  {
    x: 0, w: 22, hFrac: 0.52, fill: 'rgba(0,6,18,0.97)', top: 'rgba(0,229,255,0.80)', side: 'rgba(0,229,255,0.22)', winLit: 'rgba(0,229,255,0.60)',
    wins: [
      { xf: 0.18, yf: 0.12, lit: true  }, { xf: 0.60, yf: 0.12, lit: false },
      { xf: 0.18, yf: 0.32, lit: true  }, { xf: 0.60, yf: 0.32, lit: true  },
      { xf: 0.18, yf: 0.52, lit: false }, { xf: 0.60, yf: 0.52, lit: true  },
      { xf: 0.18, yf: 0.72, lit: true  }, { xf: 0.60, yf: 0.72, lit: false },
    ],
  },
  {
    x: 25, w: 14, hFrac: 0.33, fill: 'rgba(10,0,22,0.97)', top: 'rgba(200,0,255,0.80)', side: 'rgba(180,0,255,0.18)', winLit: 'rgba(200,0,255,0.55)', antenna: true,
    wins: [
      { xf: 0.28, yf: 0.18, lit: true  },
      { xf: 0.28, yf: 0.48, lit: false },
      { xf: 0.28, yf: 0.73, lit: true  },
    ],
  },
  {
    x: 42, w: 32, hFrac: 0.76, fill: 'rgba(0,6,18,0.97)', top: 'rgba(0,229,255,0.90)', side: 'rgba(0,229,255,0.22)', winLit: 'rgba(0,229,255,0.58)',
    wins: [
      { xf: 0.12, yf: 0.08, lit: false }, { xf: 0.44, yf: 0.08, lit: true  }, { xf: 0.76, yf: 0.08, lit: true  },
      { xf: 0.12, yf: 0.22, lit: true  }, { xf: 0.44, yf: 0.22, lit: false }, { xf: 0.76, yf: 0.22, lit: true  },
      { xf: 0.12, yf: 0.36, lit: true  }, { xf: 0.44, yf: 0.36, lit: true  }, { xf: 0.76, yf: 0.36, lit: false },
      { xf: 0.12, yf: 0.50, lit: false }, { xf: 0.44, yf: 0.50, lit: true  }, { xf: 0.76, yf: 0.50, lit: true  },
      { xf: 0.12, yf: 0.64, lit: true  }, { xf: 0.44, yf: 0.64, lit: false }, { xf: 0.76, yf: 0.64, lit: true  },
      { xf: 0.12, yf: 0.78, lit: true  }, { xf: 0.44, yf: 0.78, lit: true  }, { xf: 0.76, yf: 0.78, lit: false },
    ],
  },
  {
    x: 77, w: 20, hFrac: 0.50, fill: 'rgba(0,5,16,0.97)', top: 'rgba(0,255,170,0.75)', side: 'rgba(0,255,170,0.18)', winLit: 'rgba(0,255,170,0.52)',
    wins: [
      { xf: 0.18, yf: 0.14, lit: true  }, { xf: 0.62, yf: 0.14, lit: false },
      { xf: 0.18, yf: 0.38, lit: false }, { xf: 0.62, yf: 0.38, lit: true  },
      { xf: 0.18, yf: 0.62, lit: true  }, { xf: 0.62, yf: 0.62, lit: true  },
      { xf: 0.18, yf: 0.83, lit: false }, { xf: 0.62, yf: 0.83, lit: true  },
    ],
  },
  {
    x: 100, w: 12, hFrac: 0.40, fill: 'rgba(10,0,22,0.97)', top: 'rgba(200,0,255,0.70)', side: 'rgba(180,0,255,0.15)', winLit: 'rgba(200,0,255,0.50)', antenna: true,
    wins: [
      { xf: 0.32, yf: 0.20, lit: false },
      { xf: 0.32, yf: 0.50, lit: true  },
      { xf: 0.32, yf: 0.75, lit: true  },
    ],
  },
  {
    x: 114, w: 6, hFrac: 0.62, fill: 'rgba(0,5,16,0.97)', top: 'rgba(0,229,255,0.65)', side: 'rgba(0,229,255,0.15)', winLit: 'rgba(0,229,255,0.45)',
    wins: [],
  },
];

// ── MAP THEMES ─────────────────────────────────────────────────────────────
type MapTheme = {
  type: 'city' | 'forest' | 'mountain' | 'desert' | 'circuit';
  bgGradient: readonly [string, string, string];
  skyLabel: string;
  groundBg: string;
  groundGlowColor: string;
  horizonColors: readonly [string, string, string];
  groundLineColors: readonly [string, string, string, string, string];
  groundVTickColor: string;
};

function getMissionTheme(id: string | undefined): MapTheme {
  if (id === 'keyless') return {
    type: 'mountain',
    bgGradient: ['#000614', '#000d26', '#000614'],
    skyLabel: '▸ ▸ ▸  KEYLESS RELAY INTERCEPT  ▸ ▸ ▸',
    groundBg: '#000510',
    groundGlowColor: 'rgba(20,40,100,0.07)',
    horizonColors: ['rgba(0,0,0,0)', 'rgba(5,10,40,0.35)', 'rgba(15,25,70,0.10)'],
    groundLineColors: [
      'rgba(30,50,130,0.18)', 'rgba(25,42,110,0.15)',
      'rgba(20,34,90,0.12)', 'rgba(15,26,70,0.09)', 'rgba(10,18,55,0.06)',
    ],
    groundVTickColor: 'rgba(20,40,110,0.05)',
  };
  if (id === 'ecu_firmware') return {
    type: 'circuit',
    bgGradient: ['#080610', '#0e0a1a', '#080610'],
    skyLabel: '▸ ▸ ▸  ECU FIRMWARE GRAND PRIX  ▸ ▸ ▸',
    groundBg: '#08080c',
    groundGlowColor: 'rgba(255,210,120,0.12)',
    horizonColors: ['rgba(0,0,0,0)', 'rgba(35,18,5,0.40)', 'rgba(220,160,55,0.12)'],
    groundLineColors: [
      'rgba(255,255,255,0.28)', 'rgba(220,230,245,0.22)',
      'rgba(180,195,220,0.16)', 'rgba(140,160,195,0.11)', 'rgba(100,120,170,0.07)',
    ],
    groundVTickColor: 'rgba(200,220,255,0.06)',
  };
  if (id === 'v2x') return {
    type: 'desert',
    bgGradient: ['#030109', '#080316', '#030109'],
    skyLabel: '▸ ▸ ▸  V2X SIGNAL INTERCEPT  ▸ ▸ ▸',
    groundBg: '#0d0401',
    groundGlowColor: 'rgba(100,45,5,0.09)',
    horizonColors: ['rgba(0,0,0,0)', 'rgba(50,18,3,0.32)', 'rgba(90,32,4,0.11)'],
    groundLineColors: [
      'rgba(130,58,8,0.18)', 'rgba(108,48,6,0.15)',
      'rgba(86,38,5,0.12)', 'rgba(65,28,4,0.09)', 'rgba(44,19,3,0.06)',
    ],
    groundVTickColor: 'rgba(90,38,5,0.05)',
  };
  if (id === 'obd2') return {
    type: 'forest',
    bgGradient: ['#000800', '#001005', '#000800'],
    skyLabel: '▸ ▸ ▸  OBD-II FOREST SCAN  ▸ ▸ ▸',
    groundBg: '#010904',
    groundGlowColor: 'rgba(0,100,30,0.07)',
    horizonColors: ['rgba(0,0,0,0)', 'rgba(0,20,8,0.30)', 'rgba(0,70,20,0.09)'],
    groundLineColors: [
      'rgba(0,180,50,0.18)', 'rgba(0,150,42,0.15)',
      'rgba(0,120,34,0.12)', 'rgba(0,100,28,0.09)', 'rgba(0,80,22,0.06)',
    ],
    groundVTickColor: 'rgba(0,150,40,0.05)',
  };
  return {
    type: 'city',
    bgGradient: ['#000408', '#000a1e', '#000408'],
    skyLabel: '▸ ▸ ▸  CAN BUS NETWORK  ▸ ▸ ▸',
    groundBg: '#010409',
    groundGlowColor: 'rgba(0,229,255,0.06)',
    horizonColors: ['rgba(0,0,0,0)', 'rgba(0,20,50,0.35)', 'rgba(0,229,255,0.08)'],
    groundLineColors: [
      'rgba(0,229,255,0.18)', 'rgba(0,229,255,0.15)',
      'rgba(0,229,255,0.12)', 'rgba(0,229,255,0.09)', 'rgba(0,229,255,0.06)',
    ],
    groundVTickColor: 'rgba(0,229,255,0.05)',
  };
}

// ── MOUNTAIN DEFS ───────────────────────────────────────────────────────────
type MountainDef = {
  x: number;        // left offset within the tile
  hFrac: number;    // peak height as fraction of ROAD_TOP
  baseW: number;    // base width in px
  peakX: number;    // x offset of peak from left edge (0..baseW)
  layers: number;   // horizontal band count
  snowFrac: number; // top fraction covered in snow
  fill: string;     // rock color
  snow: string;     // brightest snow color
  edge: string;     // ridge / outline color
  lit: boolean;     // moonlit right-side highlight
};

const MOUNTAIN_DEFS: MountainDef[] = [
  // Left mountain — taller, moonlit right side
  { x: 0,   hFrac: 0.58, baseW: 92,  peakX: 50, layers: 11, snowFrac: 0.24,
    fill: 'rgba(9,11,26,0.98)',   snow: 'rgba(190,197,220,0.96)',
    edge: 'rgba(78,92,150,0.78)', lit: true  },
  // Right mountain — slightly shorter, left-leaning peak
  { x: 70,  hFrac: 0.50, baseW: 82,  peakX: 30, layers: 10, snowFrac: 0.26,
    fill: 'rgba(10,13,28,0.96)',  snow: 'rgba(184,192,215,0.93)',
    edge: 'rgba(72,85,140,0.70)', lit: false },
];

// ── FOREST TREE DEFS ────────────────────────────────────────────────────────
type TreeDef = { x: number; hFrac: number; trunkW: number; canopyW: number; layers: number; fill: string; edge: string; tip?: boolean };

const TREE_DEFS: TreeDef[] = [
  { x:  3, hFrac: 0.70, trunkW: 5, canopyW: 36, layers: 5, fill: 'rgba(0,12,4,0.97)',  edge: 'rgba(0,200,60,0.80)',  tip: true  },
  { x: 28, hFrac: 0.48, trunkW: 4, canopyW: 24, layers: 4, fill: 'rgba(0,8,2,0.97)',   edge: 'rgba(0,160,45,0.65)'               },
  { x: 50, hFrac: 0.82, trunkW: 6, canopyW: 42, layers: 6, fill: 'rgba(0,14,5,0.97)',  edge: 'rgba(0,220,70,0.85)',  tip: true  },
  { x: 76, hFrac: 0.58, trunkW: 4, canopyW: 28, layers: 4, fill: 'rgba(0,10,3,0.97)',  edge: 'rgba(0,170,50,0.70)'               },
  { x: 92, hFrac: 0.35, trunkW: 3, canopyW: 18, layers: 3, fill: 'rgba(0,6,1,0.97)',   edge: 'rgba(0,130,38,0.55)'               },
];

// ── DESERT CACTUS DEFS ──────────────────────────────────────────────────────
type ArmDef = { side: 'L' | 'R'; yFrac: number; horizW: number; vertH: number };
type CactusDef = { x: number; hFrac: number; trunkW: number; arms: ArmDef[] };

const CACTUS_DEFS: CactusDef[] = [
  { x:  4, hFrac: 0.70, trunkW: 10, arms: [
    { side: 'L', yFrac: 0.45, horizW: 14, vertH: 22 },
    { side: 'R', yFrac: 0.36, horizW: 12, vertH: 18 },
  ]},
  { x: 36, hFrac: 0.38, trunkW: 6, arms: [] },
  { x: 58, hFrac: 0.86, trunkW: 12, arms: [
    { side: 'R', yFrac: 0.42, horizW: 18, vertH: 26 },
    { side: 'L', yFrac: 0.30, horizW: 13, vertH: 17 },
  ]},
  { x: 90, hFrac: 0.56, trunkW: 8, arms: [
    { side: 'L', yFrac: 0.42, horizW: 14, vertH: 20 },
  ]},
  { x: 112, hFrac: 0.24, trunkW: 5, arms: [] },
];

const OBS_DEFS = [
  { label: 'FIREWALL', color: '#ff3333', icon: '◈' },
  { label: 'IDS NODE', color: '#ff6600', icon: '◎' },
  { label: 'HONEYPOT', color: '#ff3333', icon: '◇' },
  { label: 'MONITOR',  color: '#ff9900', icon: '▣' },
  { label: 'PATCH.SYS',color: '#ff3333', icon: '⊕' },
  { label: 'SENSOR',   color: '#ff6600', icon: '◉' },
];

type Obs = { id: number; lane: number; x: number; label: string; color: string; icon: string };
type Phase = 'playing' | 'won' | 'lost';

export default function DriveScreen() {
  const { width, height } = useWindowDimensions();
  const ROAD_H = Math.max(200, Math.min(height * 0.44, 360));
  const ROAD_TOP = (height - ROAD_H) / 2;
  const LANE_H = ROAD_H / LANES;
  const CAR_H = Math.floor(LANE_H * 0.62);
  const CAR_X = Math.floor(width * 0.10);
  const HIT_L = CAR_X + 45;
  const HIT_R = CAR_X + CAR_W - 10;
  const OBS_H = Math.floor(LANE_H * 0.52);
  const NUM_MARKS = Math.ceil((width + MARK_PERIOD * 2) / MARK_PERIOD) + 2;

  const laneTop = (lane: number, h: number): number =>
    lane * LANE_H + (LANE_H - h) / 2;

  const router = useRouter();
  const { missionId, carId } = useLocalSearchParams<{ missionId?: string; carId?: string }>();
  const carImage = CAR_IMAGES[carId ?? 'cla'] ?? CAR_IMAGES.cla;
  const theme = useMemo(() => getMissionTheme(missionId), [missionId]);
  const [, forceRender] = useState(0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [health, setHealth] = useState(3);
  const [progress, setProgress] = useState(0);
  const [showHint, setShowHint] = useState(true);

  const laneRef      = useRef(1);
  const healthRef    = useRef(3);
  const tickRef      = useRef(0);
  const idRef        = useRef(0);
  const obsRef       = useRef<Obs[]>([]);
  const phaseRef     = useRef<Phase>('playing');
  const cdRef        = useRef(0);
  const roadOffRef   = useRef(0);

  const carY     = useRef(new Animated.Value(laneTop(1, CAR_H))).current;
  const flashVal = useRef(new Animated.Value(0)).current;

  // Fixed star field — only for forest theme, behind the scrolling trees
  const starElems = useMemo(() => {
    if (theme.type === 'city') return null;
    const isMountain = theme.type === 'mountain';
    const isDesert   = theme.type === 'desert';
    const isCircuit  = theme.type === 'circuit';
    const out: React.ReactElement[] = [];
    const count = isMountain ? 90 : isDesert ? 100 : isCircuit ? 40 : 70;
    for (let i = 0; i < count; i++) {
      const rx = Math.abs(Math.sin(i * 127.1 + 311.7));
      const ry = Math.abs(Math.sin(i * 269.5 + 183.3));
      const rs = Math.abs(Math.sin(i * 419.2 + 74.1));
      const ro = Math.abs(Math.sin(i * 531.9 + 229.4));
      const x    = Math.round(rx * width);
      const y    = Math.round(ry * ROAD_TOP * (isMountain ? 0.82 : isCircuit ? 0.55 : 0.85));
      const size = rs < 0.65 ? 1 : rs < 0.88 ? 2 : 3;
      const op   = parseFloat(((isMountain ? 0.45 : isDesert ? 0.50 : isCircuit ? 0.30 : 0.35) + ro * 0.40).toFixed(2));
      const cIdx = Math.floor(rs * 9) % 3;
      const col = isMountain
        ? (cIdx === 0 ? '220,230,255' : cIdx === 1 ? '200,215,255' : '240,245,255')
        : isDesert
          ? (cIdx === 0 ? '255,252,235' : cIdx === 1 ? '240,235,210' : '210,225,255')
          : isCircuit
            ? (cIdx === 0 ? '255,255,255' : cIdx === 1 ? '220,235,255' : '255,240,200')
            : (cIdx === 0 ? '255,255,255' : cIdx === 1 ? '195,215,255' : '255,248,210');
      const glow = op > 0.78 && size >= 2;
      out.push(
        <View key={i} style={{
          position: 'absolute', left: x, top: y,
          width: size, height: size,
          borderRadius: Math.ceil(size / 2),
          backgroundColor: `rgba(${col},${op})`,
          ...(glow ? {
            shadowColor: `rgba(${col},1)`,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9, shadowRadius: size + 1,
          } : {}),
        }} />
      );
    }
    return out;
  }, [theme.type, width, ROAD_TOP]);

  // Arcade pixel-scene mountains — stepped staircase silhouettes, layered parallax
  const mountainElems = useMemo(() => {
    if (theme.type !== 'mountain') return null;
    const MTN_PERIOD = 4 * MARK_PERIOD;
    const numTiles = Math.ceil((width + MTN_PERIOD) / MARK_PERIOD) + 2;
    const out: React.ReactElement[] = [];

    // ── Helper: render a stepped (pixel-staircase) triangle mountain ──
    const renderMountain = (
      keyPrefix: string,
      baseX: number,
      baseW: number,
      peakH: number,
      steps: number,
      topW: number,
      snowSteps: number,
      rockFill: string,
      rockShadow: string,
      rockLit: string,
      snowFill: string,
      snowShade: string,
      snowEdge: string,
    ) => {
      const stepH = Math.ceil(peakH / steps) + 1;
      for (let s = 0; s < steps; s++) {
        const t      = s / steps;
        const tNext  = (s + 1) / steps;
        // Step width measured at top of the step → creates staircase silhouette
        const wTop   = Math.round(baseW - (baseW - topW) * tNext);
        const offX   = Math.round((baseW - wTop) / 2);
        const sx     = baseX + offX;
        const sy     = Math.round(t * peakH);
        const isSnow = s >= steps - snowSteps;
        const isPeak = s === steps - 1;
        const isCap  = s === steps - snowSteps; // first snow step (cap line sits here)

        out.push(
          <View key={`${keyPrefix}-s${s}`} style={{
            position: 'absolute',
            left: sx, bottom: sy,
            width: wTop, height: stepH,
            backgroundColor: isSnow ? snowFill : rockFill,
            overflow: 'hidden',
          }}>
            {/* Left-side shadow (unlit face) */}
            <View style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: Math.max(2, Math.round(wTop * 0.22)),
              backgroundColor: isSnow ? snowShade : rockShadow,
            }} />
            {/* Right-side lit face */}
            <View style={{
              position: 'absolute', right: 0, top: 0, bottom: 0,
              width: Math.max(1, Math.round(wTop * 0.10)),
              backgroundColor: isSnow ? 'rgba(255,255,255,0.55)' : rockLit,
            }} />
            {/* Top-edge highlight on every step (gives the pixel-stair definition) */}
            <View style={{
              position: 'absolute', left: 0, right: 0, top: 0,
              height: isPeak ? 2 : 1,
              backgroundColor: isPeak ? snowEdge
                : isSnow ? 'rgba(255,255,255,0.85)'
                : rockLit,
            }} />
            {/* Snow-cap base line (clear horizontal boundary between rock and snow) */}
            {isCap && (
              <View style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                height: 1, backgroundColor: snowEdge,
              }} />
            )}
          </View>
        );
      }
    };

    // ── BACK LAYER — distant hazy peaks, every tile ──
    // Two profiles alternating every tile (still wraps cleanly within 4-tile period)
    for (let ti = 0; ti < numTiles; ti++) {
      const tileX = ti * MARK_PERIOD;
      const profile = ti % 2 === 0
        ? [
            { x:  -8, w: 70, h: 0.30 },
            { x:  48, w: 58, h: 0.26 },
            { x:  96, w: 38, h: 0.22 },
          ]
        : [
            { x:  -4, w: 50, h: 0.22 },
            { x:  38, w: 78, h: 0.34 },
            { x: 100, w: 42, h: 0.24 },
          ];
      profile.forEach((p, pi) => {
        const peakH = Math.max(15, ROAD_TOP * p.h);
        const steps = 7;
        const topW  = 4;
        const stepH = Math.ceil(peakH / steps) + 1;
        for (let s = 0; s < steps; s++) {
          const t     = s / steps;
          const tNext = (s + 1) / steps;
          const w     = Math.round(p.w - (p.w - topW) * tNext);
          const offX  = Math.round((p.w - w) / 2);
          const sy    = Math.round(t * peakH);
          out.push(
            <View key={`fm${ti}-${pi}-${s}`} style={{
              position: 'absolute',
              left: tileX + p.x + offX, bottom: sy,
              width: w, height: stepH,
              backgroundColor: 'rgba(30,42,78,0.55)',
            }}>
              {/* subtle top-edge highlight for staircase definition */}
              <View style={{
                position: 'absolute', left: 0, right: 0, top: 0,
                height: 1, backgroundColor: 'rgba(55,72,118,0.75)',
              }} />
            </View>
          );
        }
      });
    }

    // ── MID LAYER — medium dark peaks, every tile (one per tile, offset) ──
    for (let ti = 0; ti < numTiles; ti++) {
      const tileX = ti * MARK_PERIOD;
      const midOffset = (ti % 2 === 0) ? 16 : 60;
      const midBaseW = 78;
      const midHFrac = (ti % 2 === 0) ? 0.40 : 0.44;
      const peakH    = Math.max(20, ROAD_TOP * midHFrac);
      const steps    = 8;
      const topW     = 6;
      const stepH    = Math.ceil(peakH / steps) + 1;
      for (let s = 0; s < steps; s++) {
        const t     = s / steps;
        const tNext = (s + 1) / steps;
        const w     = Math.round(midBaseW - (midBaseW - topW) * tNext);
        const offX  = Math.round((midBaseW - w) / 2);
        const sy    = Math.round(t * peakH);
        out.push(
          <View key={`mm${ti}-${s}`} style={{
            position: 'absolute',
            left: tileX + midOffset + offX, bottom: sy,
            width: w, height: stepH,
            backgroundColor: 'rgba(18,24,52,0.85)',
            overflow: 'hidden',
          }}>
            <View style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: Math.max(1, Math.round(w * 0.18)),
              backgroundColor: 'rgba(0,0,0,0.35)',
            }} />
            <View style={{
              position: 'absolute', left: 0, right: 0, top: 0,
              height: 1, backgroundColor: 'rgba(60,78,130,0.75)',
            }} />
          </View>
        );
      }
    }

    // ── FRONT LAYER — alternating big/small with snow caps (ti % 4 pattern) ──
    for (let ti = 0; ti < numTiles; ti++) {
      const pat = ti % 4;
      if (pat === 2 || pat === 3) continue;

      const isBig     = pat === 0;
      const baseW     = isBig ? 124 : 96;
      const hFrac     = isBig ? 0.66 : 0.50;
      const steps     = isBig ? 12 : 10;
      const topW      = isBig ? 14 : 12;
      const snowSteps = isBig ? 4 : 3;
      const peakH     = Math.max(20, ROAD_TOP * hFrac);
      const tileX     = ti * MARK_PERIOD;
      const baseX     = tileX + Math.round((MARK_PERIOD - baseW) / 2);

      renderMountain(
        `m${ti}`,
        baseX, baseW, peakH, steps, topW, snowSteps,
        'rgba(11,15,32,0.98)',   // rockFill — very dark navy
        'rgba(0,0,2,0.45)',      // rockShadow — left-face shadow
        'rgba(54,72,128,0.55)',  // rockLit — right-face moonlit
        'rgba(228,234,245,0.98)',// snowFill — bright snow
        'rgba(140,160,200,0.55)',// snowShade — blue shadow on snow left
        'rgba(255,255,255,0.95)' // snowEdge — crisp white outline
      );
    }

    return out;
  }, [theme.type, width, ROAD_TOP]);

  // ─── Race circuit scenery — pit garages, stadium lights, billboards, bleachers ───
  const circuitElems = useMemo(() => {
    if (theme.type !== 'circuit') return null;
    const CIRC_PERIOD = 4 * MARK_PERIOD;
    const numTiles = Math.ceil((width + CIRC_PERIOD) / MARK_PERIOD) + 2;
    const out: React.ReactElement[] = [];

    // ── Layer 1: continuous grandstand bleachers (every tile) ──
    const blBot = Math.round(ROAD_TOP * 0.18);
    const blHt  = Math.round(ROAD_TOP * 0.22);
    for (let ti = 0; ti < numTiles; ti++) {
      const tileX = ti * MARK_PERIOD;
      // bleacher base
      out.push(
        <View key={`bl${ti}`} style={{
          position: 'absolute',
          left: tileX, bottom: blBot,
          width: MARK_PERIOD + 1, height: blHt,
          backgroundColor: 'rgba(18,20,32,0.90)',
          overflow: 'hidden',
        }}>
          {/* horizontal seat rows */}
          {[0.20, 0.40, 0.60, 0.80].map((yf, ri) => (
            <View key={`r${ri}`} style={{
              position: 'absolute',
              left: 0, right: 0, top: Math.round(yf * blHt),
              height: 1, backgroundColor: 'rgba(58,65,92,0.85)',
            }} />
          ))}
          {/* roof rail at top */}
          <View style={{
            position: 'absolute', left: 0, right: 0, top: 0,
            height: 2, backgroundColor: 'rgba(95,108,148,0.85)',
          }} />
          {/* crowd dots — sin-seeded warm flesh tones */}
          {Array.from({ length: 36 }).map((_, di) => {
            const cx = Math.abs(Math.sin(ti * 73.7 + di * 17.3));
            const cy = Math.abs(Math.sin(ti * 31.2 + di * 41.9));
            const cc = Math.floor(Math.abs(Math.sin(ti * 11.1 + di * 7.4)) * 4) % 4;
            const palette = ['215,195,165', '180,150,130', '200,165,140', '160,135,115'];
            return (
              <View key={`d${di}`} style={{
                position: 'absolute',
                left: Math.round(cx * (MARK_PERIOD - 1)),
                top: Math.round(cy * (blHt - 3)) + 2,
                width: 1, height: 1,
                backgroundColor: `rgba(${palette[cc]},0.85)`,
              }} />
            );
          })}
        </View>
      );
      // bleacher support struts (vertical posts under bleacher)
      [0.20, 0.60].forEach((xf, si) => {
        out.push(
          <View key={`bs${ti}-${si}`} style={{
            position: 'absolute',
            left: tileX + Math.round(xf * MARK_PERIOD), bottom: 0,
            width: 2, height: blBot,
            backgroundColor: 'rgba(28,30,42,0.85)',
          }} />
        );
      });
    }

    // ── Layer 2: tire wall + red/white safety kerb (continuous, bottom strip) ──
    const twH = Math.round(ROAD_TOP * 0.07);
    for (let ti = 0; ti < numTiles; ti++) {
      const tileX = ti * MARK_PERIOD;
      // red/white kerb stripe just above tire wall
      const kerbY = twH;
      const segW  = 14;
      for (let sx = 0; sx < MARK_PERIOD; sx += segW) {
        const isRed = Math.floor(sx / segW) % 2 === 0;
        out.push(
          <View key={`kb${ti}-${sx}`} style={{
            position: 'absolute',
            left: tileX + sx, bottom: kerbY,
            width: Math.min(segW, MARK_PERIOD - sx), height: 3,
            backgroundColor: isRed ? 'rgba(210,35,28,0.90)' : 'rgba(245,245,250,0.92)',
          }} />
        );
      }
      // tire wall
      out.push(
        <View key={`tw${ti}`} style={{
          position: 'absolute',
          left: tileX, bottom: 0,
          width: MARK_PERIOD + 1, height: twH,
          backgroundColor: 'rgba(6,6,10,0.97)',
        }} />
      );
      // individual tire silhouettes (small rounded shapes)
      const tireW = 9;
      const tireCount = Math.floor(MARK_PERIOD / (tireW + 1));
      for (let tc = 0; tc < tireCount; tc++) {
        out.push(
          <View key={`tr${ti}-${tc}`} style={{
            position: 'absolute',
            left: tileX + tc * (tireW + 1) + 1,
            bottom: 1,
            width: tireW, height: twH - 2,
            backgroundColor: 'rgba(10,10,14,0.98)',
            borderRadius: 4,
            borderTopWidth: 1, borderTopColor: 'rgba(48,42,42,0.85)',
            borderLeftWidth: 1, borderLeftColor: 'rgba(30,28,30,0.75)',
            borderRightWidth: 1, borderRightColor: 'rgba(30,28,30,0.75)',
          }} />
        );
      }
    }

    // ── Layer 3: per-tile pattern features (ti % 4) ──
    for (let ti = 0; ti < numTiles; ti++) {
      const pat = ti % 4;
      const tileX = ti * MARK_PERIOD;

      if (pat === 0) {
        // ◈ STADIUM LIGHT TOWER ◈
        const towerH = Math.round(ROAD_TOP * 0.92);
        const towerX = tileX + 55;
        const poleW  = 4;
        out.push(
          <View key={`st${ti}-pole`} style={{
            position: 'absolute',
            left: towerX, bottom: 0,
            width: poleW, height: towerH,
            backgroundColor: 'rgba(35,38,52,0.96)',
          }}>
            <View style={{
              position: 'absolute', right: 0, top: 0, bottom: 0,
              width: 1, backgroundColor: 'rgba(95,108,138,0.85)',
            }} />
          </View>
        );
        // cross-bracing
        [0.30, 0.50, 0.70].forEach((yf, bi) => {
          out.push(
            <View key={`st${ti}-x${bi}`} style={{
              position: 'absolute',
              left: towerX - 4, bottom: Math.round(yf * towerH),
              width: poleW + 8, height: 1,
              backgroundColor: 'rgba(70,78,105,0.78)',
            }} />
          );
        });
        // light head with lamp array
        const headW = 24;
        const headH = 11;
        const headX = towerX + Math.round(poleW / 2 - headW / 2);
        const headBot = towerH - headH;
        // big outer halo
        out.push(
          <View key={`st${ti}-glow1`} style={{
            position: 'absolute',
            left: headX - 20, bottom: headBot - 10,
            width: headW + 40, height: headH + 30,
            backgroundColor: 'rgba(255,235,150,0.08)',
            borderRadius: 30,
          }} />
        );
        // inner brighter halo
        out.push(
          <View key={`st${ti}-glow2`} style={{
            position: 'absolute',
            left: headX - 8, bottom: headBot - 4,
            width: headW + 16, height: headH + 12,
            backgroundColor: 'rgba(255,245,180,0.18)',
            borderRadius: 14,
          }} />
        );
        // housing
        out.push(
          <View key={`st${ti}-head`} style={{
            position: 'absolute',
            left: headX, bottom: headBot,
            width: headW, height: headH,
            backgroundColor: 'rgba(22,24,34,0.96)',
            borderTopWidth: 1, borderTopColor: 'rgba(110,125,165,0.85)',
            borderLeftWidth: 1, borderLeftColor: 'rgba(60,68,90,0.75)',
            borderRightWidth: 1, borderRightColor: 'rgba(60,68,90,0.75)',
            overflow: 'hidden',
          }}>
            {/* 5 lamp dots in a row */}
            {[0.10, 0.30, 0.50, 0.70, 0.90].map((xf, li) => (
              <View key={`l${li}`} style={{
                position: 'absolute',
                left: Math.round(xf * headW - 2), top: 2,
                width: 4, height: 4,
                backgroundColor: 'rgba(255,250,210,0.98)',
                shadowColor: '#fff8b0',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1, shadowRadius: 5,
              }} />
            ))}
          </View>
        );
        // small red aircraft warning light on the very top
        out.push(
          <View key={`st${ti}-warn`} style={{
            position: 'absolute',
            left: towerX, bottom: towerH,
            width: poleW, height: 2,
            backgroundColor: 'rgba(255,40,30,0.95)',
            shadowColor: '#ff2820',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1, shadowRadius: 4,
          }} />
        );
      }

      else if (pat === 1) {
        // ◈ PIT GARAGE ◈
        const gH = Math.round(ROAD_TOP * 0.44);
        const gBot = Math.round(ROAD_TOP * 0.07);
        const gX = tileX + 12;
        const gW = 96;
        // garage body
        out.push(
          <View key={`g${ti}-body`} style={{
            position: 'absolute',
            left: gX, bottom: gBot,
            width: gW, height: gH,
            backgroundColor: 'rgba(18,20,30,0.97)',
            borderTopWidth: 2, borderTopColor: 'rgba(95,108,148,0.85)',
            borderLeftWidth: 1, borderLeftColor: 'rgba(50,58,80,0.70)',
            borderRightWidth: 1, borderRightColor: 'rgba(50,58,80,0.70)',
            overflow: 'hidden',
          }}>
            {/* roof fascia */}
            <View style={{
              position: 'absolute', left: 0, right: 0, top: 2,
              height: 3, backgroundColor: 'rgba(32,38,55,0.95)',
            }} />
            {/* team neon stripe under roof */}
            <View style={{
              position: 'absolute', left: 4, right: 4, top: 7,
              height: 2, backgroundColor: 'rgba(0,229,255,0.95)',
              shadowColor: '#00e5ff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1, shadowRadius: 4,
            }} />
            {/* garage door */}
            <View style={{
              position: 'absolute',
              left: 10, right: 10, top: 14, bottom: 4,
              backgroundColor: 'rgba(34,38,55,0.96)',
              borderTopWidth: 1, borderTopColor: 'rgba(80,92,125,0.85)',
              borderLeftWidth: 1, borderLeftColor: 'rgba(52,60,82,0.80)',
              borderRightWidth: 1, borderRightColor: 'rgba(52,60,82,0.80)',
            }}>
              {/* panel lines */}
              {[6, 12, 18, 24].map((y, pli) => (
                <View key={`pl${pli}`} style={{
                  position: 'absolute',
                  left: 2, right: 2, top: y,
                  height: 1, backgroundColor: 'rgba(12,14,22,0.85)',
                }} />
              ))}
              {/* handle */}
              <View style={{
                position: 'absolute',
                left: '45%', right: '45%', bottom: 2,
                height: 2, backgroundColor: 'rgba(180,190,215,0.75)',
              }} />
            </View>
            {/* pit number lit panel — left of door */}
            <View style={{
              position: 'absolute', left: 3, top: 4, width: 5, height: 6,
              backgroundColor: 'rgba(255,80,180,0.94)',
              shadowColor: '#ff50b4',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1, shadowRadius: 5,
            }} />
            {/* sponsor sign right of door */}
            <View style={{
              position: 'absolute', right: 3, top: 4, width: 5, height: 6,
              backgroundColor: 'rgba(80,255,140,0.92)',
              shadowColor: '#50ff8c',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1, shadowRadius: 4,
            }} />
          </View>
        );
      }

      else if (pat === 2) {
        // ◈ NEON BILLBOARD ◈
        const bbH = Math.round(ROAD_TOP * 0.28);
        const bbW = 92;
        const bbBot = Math.round(ROAD_TOP * 0.32);
        const bbX = tileX + 14;
        // posts
        [4, bbW - 7].forEach((px, pi) => {
          out.push(
            <View key={`bb${ti}-post${pi}`} style={{
              position: 'absolute',
              left: bbX + px, bottom: 0,
              width: 3, height: bbBot + 8,
              backgroundColor: 'rgba(34,38,52,0.94)',
            }} />
          );
        });
        // ambient halo
        out.push(
          <View key={`bb${ti}-glow`} style={{
            position: 'absolute',
            left: bbX - 12, bottom: bbBot - 6,
            width: bbW + 24, height: bbH + 14,
            backgroundColor: 'rgba(0,229,255,0.05)',
            borderRadius: 10,
          }} />
        );
        // billboard panel
        out.push(
          <View key={`bb${ti}-panel`} style={{
            position: 'absolute',
            left: bbX, bottom: bbBot,
            width: bbW, height: bbH,
            backgroundColor: 'rgba(8,10,18,0.97)',
            borderWidth: 2,
            borderColor: 'rgba(95,108,148,0.85)',
            overflow: 'hidden',
          }}>
            {/* neon bars suggesting logo + text */}
            <View style={{
              position: 'absolute', left: 6, top: 4, width: 18, height: 4,
              backgroundColor: 'rgba(0,229,255,0.95)',
              shadowColor: '#00e5ff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1, shadowRadius: 6,
            }} />
            <View style={{
              position: 'absolute', left: 28, top: 4, width: 14, height: 4,
              backgroundColor: 'rgba(255,80,180,0.95)',
              shadowColor: '#ff50b4',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1, shadowRadius: 6,
            }} />
            <View style={{
              position: 'absolute', left: 46, top: 4, width: 8, height: 4,
              backgroundColor: 'rgba(255,200,50,0.94)',
              shadowColor: '#ffc832',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1, shadowRadius: 5,
            }} />
            <View style={{
              position: 'absolute', left: 6, top: 14, width: 70, height: 2,
              backgroundColor: 'rgba(80,255,140,0.90)',
              shadowColor: '#50ff8c',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1, shadowRadius: 5,
            }} />
            <View style={{
              position: 'absolute', left: 6, top: 19, width: 42, height: 2,
              backgroundColor: 'rgba(0,229,255,0.85)',
              shadowColor: '#00e5ff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1, shadowRadius: 4,
            }} />
            {/* bottom warning trim */}
            <View style={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              height: 1, backgroundColor: 'rgba(0,229,255,0.55)',
            }} />
          </View>
        );
      }

      else {
        // ◈ TIRE STACKS + SMALL FLOODLIGHT ◈
        const tsBot = twH + 1;
        const tsX = tileX + 8;
        const tsRows = 3;
        for (let row = 0; row < tsRows; row++) {
          const rowY = row * 4;
          const offsetX = (row % 2) * 2;
          for (let col = 0; col < 9; col++) {
            const cx = col * 11 + offsetX;
            out.push(
              <View key={`ts${ti}-${row}-${col}`} style={{
                position: 'absolute',
                left: tsX + cx, bottom: tsBot + rowY,
                width: 9, height: 5,
                backgroundColor: 'rgba(10,10,14,0.97)',
                borderRadius: 3,
                borderTopWidth: 1, borderTopColor: 'rgba(50,46,46,0.85)',
              }} />
            );
          }
        }
        // small floodlight pole behind tire stacks
        const fpH = Math.round(ROAD_TOP * 0.60);
        const fpX = tileX + 92;
        out.push(
          <View key={`fp${ti}-pole`} style={{
            position: 'absolute',
            left: fpX, bottom: 0,
            width: 3, height: fpH,
            backgroundColor: 'rgba(34,38,52,0.92)',
          }} />
        );
        out.push(
          <View key={`fp${ti}-glow`} style={{
            position: 'absolute',
            left: fpX - 12, bottom: fpH - 14,
            width: 27, height: 22,
            backgroundColor: 'rgba(255,235,150,0.10)',
            borderRadius: 14,
          }} />
        );
        out.push(
          <View key={`fp${ti}-head`} style={{
            position: 'absolute',
            left: fpX - 4, bottom: fpH - 5,
            width: 11, height: 6,
            backgroundColor: 'rgba(255,250,200,0.97)',
            shadowColor: '#ffeba0',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1, shadowRadius: 7,
            borderTopWidth: 1, borderTopColor: 'rgba(120,135,170,0.85)',
          }} />
        );
        // checkered flag stand at left of tile
        const flagX = tileX + 6;
        const flagH = Math.round(ROAD_TOP * 0.34);
        out.push(
          <View key={`fl${ti}-pole`} style={{
            position: 'absolute',
            left: flagX, bottom: 0,
            width: 2, height: flagH,
            backgroundColor: 'rgba(60,68,92,0.92)',
          }} />
        );
        // checker flag (mini pattern)
        const flagBot = flagH - 14;
        for (let cr = 0; cr < 4; cr++) {
          for (let cc = 0; cc < 6; cc++) {
            const isWhite = (cr + cc) % 2 === 0;
            out.push(
              <View key={`fl${ti}-c${cr}-${cc}`} style={{
                position: 'absolute',
                left: flagX + 2 + cc * 2, bottom: flagBot + cr * 3,
                width: 2, height: 3,
                backgroundColor: isWhite ? 'rgba(245,245,250,0.92)' : 'rgba(8,8,12,0.92)',
              }} />
            );
          }
        }
      }
    }

    return out;
  }, [theme.type, width, ROAD_TOP]);

  // Desert rock formations — parallax background layer
  const desertElems = useMemo(() => {
    if (theme.type !== 'desert') return null;
    const MTN_PERIOD = 4 * MARK_PERIOD;
    const numTiles = Math.ceil((width + MTN_PERIOD) / MARK_PERIOD) + 2;
    return Array.from({ length: numTiles }).flatMap((_, ti) => {
      const pat = ti % 4;
      if (pat === 2 || pat === 3) return [];

      const isMesa = pat === 0;
      const baseW  = isMesa ? 130 : 58;
      const hFrac  = isMesa ? 0.56 : 0.50;
      const layers = isMesa ? 12 : 10;
      const dFill  = 'rgba(20,6,2,0.97)';
      const dEdge  = isMesa ? 'rgba(72,25,7,0.82)' : 'rgba(88,32,9,0.85)';
      const dTop   = isMesa ? 'rgba(52,18,4,0.92)' : 'rgba(68,23,6,0.92)';

      const peakH = Math.max(20, ROAD_TOP * hFrac);
      const tileX = ti * MARK_PERIOD;
      const baseX = tileX + Math.round((MARK_PERIOD - baseW) / 2);
      const key   = `de${ti}`;
      const elems: React.ReactElement[] = [];

      // Halo behind formation
      elems.push(
        <View key={`${key}-halo`} style={{
          position: 'absolute',
          left: baseX - 12, bottom: 0,
          width: baseW + 24, height: peakH,
          backgroundColor: 'rgba(50,18,4,0.04)',
          borderRadius: Math.round((baseW + 24) / 4),
        }} />
      );

      for (let li = 0; li < layers; li++) {
        const t     = li / layers;
        const tNext = (li + 1) / layers;
        const botY  = Math.round(t * peakH);
        const bandH = Math.max(3, Math.round((tNext - t) * peakH) + 2);
        const isTop = li === layers - 1;

        let leftX: number, rightX: number;
        if (isMesa) {
          // Flat-top butte: vertical sides, angular only in top 25%
          const insetFrac = Math.max(0, (t - 0.75) / 0.25);
          const inset = Math.round((baseW / 2) * insetFrac);
          leftX  = baseX + inset;
          rightX = baseX + baseW - inset;
        } else {
          // Rock spire: concave narrowing sides
          const tf = Math.pow(1 - t, 0.42);
          leftX  = baseX + Math.round((baseW / 2) * (1 - tf));
          rightX = baseX + Math.round((baseW / 2) * (1 + tf));
        }
        const bandW = Math.max(2, rightX - leftX);

        elems.push(
          <View key={`${key}-b${li}`} style={{
            position: 'absolute',
            left: leftX, bottom: botY,
            width: bandW, height: bandH,
            backgroundColor: dFill,
            borderTopWidth: isTop ? 2 : 1,
            borderTopColor: isTop ? dTop : dEdge,
            overflow: 'hidden',
          }}>
            {bandH > 5 && (
              <View style={{
                position: 'absolute', left: 0, right: 0,
                top: Math.round(bandH * 0.60), height: 1,
                backgroundColor: 'rgba(0,0,0,0.35)',
              }} />
            )}
            {bandW > 8 && (
              <View style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: Math.max(2, Math.round(bandW * 0.12)),
                backgroundColor: 'rgba(0,0,0,0.42)',
              }} />
            )}
            {bandW > 8 && (
              <View style={{
                position: 'absolute', right: 0, top: 0, bottom: 0,
                width: Math.max(2, Math.round(bandW * 0.08)),
                backgroundColor: 'rgba(95,38,9,0.20)',
              }} />
            )}
          </View>
        );
      }

      return elems;
    });
  }, [theme.type, width, ROAD_TOP]);

  // Memoized so the scenery Views aren't re-created on every game tick
  const sceneryElems = useMemo(() => {
    if (theme.type === 'forest') {
      return Array.from({ length: NUM_MARKS + 2 }).flatMap((_, ti) =>
        TREE_DEFS.flatMap((t, tri) => {
          const treeH   = Math.max(10, ROAD_TOP * t.hFrac);
          const trunkH  = Math.max(6, Math.floor(treeH * 0.15));
          const canopyH = treeH - trunkH;
          const layerH  = Math.round(canopyH / t.layers);
          const tileX   = ti * MARK_PERIOD;
          const baseX   = tileX + t.x;
          const trunkX  = baseX + Math.round((t.canopyW - t.trunkW) / 2);
          const cx      = baseX + Math.round(t.canopyW / 2);
          const key     = `f${ti}-${tri}`;
          const elems: React.ReactElement[] = [];

          // Ambient halo behind whole tree
          elems.push(
            <View key={`${key}-halo`} style={{
              position: 'absolute',
              left: baseX - 10, bottom: 0,
              width: t.canopyW + 20, height: treeH,
              backgroundColor: 'rgba(0,60,15,0.07)',
              borderRadius: Math.round((t.canopyW + 20) / 3),
            }} />
          );

          // Trunk with bark texture
          elems.push(
            <View key={`${key}-tr`} style={{
              position: 'absolute', left: trunkX, bottom: 0,
              width: t.trunkW, height: trunkH + 2,
              backgroundColor: 'rgba(20,9,4,0.98)',
              borderLeftWidth: 1, borderRightWidth: 1, borderColor: t.edge,
              overflow: 'hidden',
            }}>
              {/* Center highlight */}
              <View style={{ position: 'absolute', left: Math.floor(t.trunkW / 2) - 1, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(0,70,20,0.25)' }} />
              {/* Bark lines */}
              <View style={{ position: 'absolute', left: 0, right: 0, top: Math.round(trunkH * 0.30), height: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
              <View style={{ position: 'absolute', left: 0, right: 0, top: Math.round(trunkH * 0.60), height: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
              <View style={{ position: 'absolute', left: 0, right: 0, top: Math.round(trunkH * 0.82), height: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} />
            </View>
          );

          // Root flare at base
          elems.push(
            <View key={`${key}-root`} style={{
              position: 'absolute',
              left: trunkX - 2, bottom: 0,
              width: t.trunkW + 4,
              height: Math.max(3, Math.floor(trunkH * 0.30)),
              backgroundColor: 'rgba(18,8,3,0.98)',
              borderTopWidth: 1, borderColor: t.edge,
            }} />
          );

          // Canopy layers — 0 = widest at bottom, layers-1 = narrowest at top
          for (let li = 0; li < t.layers; li++) {
            const w      = Math.max(t.trunkW + 6, Math.round(t.canopyW * (1 - li / t.layers)));
            const bot    = trunkH + li * layerH;
            const layerX = baseX + Math.round((t.canopyW - w) / 2);
            const isTop  = li === t.layers - 1;
            // Bottom layers catch more ambient light — slightly lighter fill
            const g      = Math.round(28 - (li / (t.layers - 1 || 1)) * 10);
            const fill   = `rgba(0,${g},${Math.round(g * 0.42)},0.97)`;

            elems.push(
              <View key={`${key}-c${li}`} style={{
                position: 'absolute',
                left: layerX, bottom: bot, width: w, height: layerH + 4,
                backgroundColor: fill,
                borderTopWidth: isTop ? 2 : 1, borderTopColor: t.edge,
                borderLeftWidth: 1, borderLeftColor: t.edge,
                borderRightWidth: 1, borderRightColor: t.edge,
                overflow: 'hidden',
              }}>
                {/* Central light band — suggests volume */}
                <View style={{ position: 'absolute', left: Math.round(w * 0.35), top: 0, bottom: 0, width: Math.round(w * 0.30), backgroundColor: 'rgba(0,90,28,0.14)' }} />
                {/* Branch gap shadows */}
                <View style={{ position: 'absolute', left: Math.round(w * 0.27), top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
                <View style={{ position: 'absolute', left: Math.round(w * 0.73), top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
                {/* Horizontal needle bands */}
                <View style={{ position: 'absolute', left: 2, right: 2, top: Math.round((layerH + 4) * 0.35), height: 1, backgroundColor: 'rgba(0,55,16,0.40)' }} />
                <View style={{ position: 'absolute', left: 2, right: 2, top: Math.round((layerH + 4) * 0.68), height: 1, backgroundColor: 'rgba(0,45,13,0.30)' }} />
                {/* Darker bottom edge — shadow from layer above */}
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.max(2, Math.round((layerH + 4) * 0.20)), backgroundColor: 'rgba(0,0,0,0.22)' }} />
              </View>
            );

            // Side branch stubs on lower canopy layers
            if (li < Math.ceil(t.layers / 2)) {
              const stubW = Math.max(3, Math.round(w * 0.10));
              const stubH = Math.max(2, Math.round(layerH * 0.38));
              const stubY = bot + Math.round(layerH * 0.42);
              elems.push(
                <View key={`${key}-sl${li}`} style={{
                  position: 'absolute', left: layerX - stubW, bottom: stubY,
                  width: stubW, height: stubH, backgroundColor: fill,
                  borderTopWidth: 1, borderTopColor: t.edge,
                  borderLeftWidth: 1, borderLeftColor: t.edge,
                }} />
              );
              elems.push(
                <View key={`${key}-sr${li}`} style={{
                  position: 'absolute', left: layerX + w, bottom: stubY,
                  width: stubW, height: stubH, backgroundColor: fill,
                  borderTopWidth: 1, borderTopColor: t.edge,
                  borderRightWidth: 1, borderRightColor: t.edge,
                }} />
              );
            }
          }

          // Bioluminescent spots (every other tree type)
          if (tri % 2 === 0) {
            const spots = [
              { lf: 0.25, xf: 0.38, s: 3 },
              { lf: 0.55, xf: 0.64, s: 2 },
            ];
            spots.forEach((sp, si) => {
              const sl  = Math.min(Math.round(sp.lf * t.layers), t.layers - 1);
              const sw  = Math.max(t.trunkW + 6, Math.round(t.canopyW * (1 - sl / t.layers)));
              const slx = baseX + Math.round((t.canopyW - sw) / 2);
              elems.push(
                <View key={`${key}-bio${si}`} style={{
                  position: 'absolute',
                  left: slx + Math.round(sw * sp.xf),
                  bottom: trunkH + sl * layerH + Math.round(layerH * 0.45),
                  width: sp.s, height: sp.s,
                  backgroundColor: 'rgba(120,255,90,0.80)',
                  shadowColor: '#78ff5a',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1, shadowRadius: 4,
                }} />
              );
            });
          }

          // Glowing tip
          if (t.tip) {
            elems.push(
              <View key={`${key}-tip`} style={{
                position: 'absolute', left: cx - 2,
                bottom: trunkH + canopyH - 2,
                width: 4, height: 8,
                backgroundColor: t.edge,
                shadowColor: t.edge, shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1, shadowRadius: 8,
              }} />
            );
          }

          return elems;
        })
      );
    }

    if (theme.type === 'mountain') return [];
    if (theme.type === 'circuit') return [];

    if (theme.type === 'desert') {
      return Array.from({ length: NUM_MARKS + 2 }).flatMap((_, ti) =>
        CACTUS_DEFS.flatMap((c, ci) => {
          const trunkH = Math.max(10, ROAD_TOP * c.hFrac);
          const trunkX = ti * MARK_PERIOD + c.x;
          // Cactus palette — dark olive-brown silhouette with warm lit edge
          const fill   = 'rgba(10,7,3,0.98)';
          const litCol = 'rgba(110,62,20,0.62)';
          const darkCol = 'rgba(0,0,0,0.55)';
          const groove = 'rgba(0,0,0,0.50)';
          const ridge  = 'rgba(52,32,14,0.85)';
          const spine  = 'rgba(220,180,110,0.85)';
          const armThick = Math.max(4, c.trunkW - 2);
          const trunkR   = Math.max(2, Math.floor(c.trunkW * 0.5));
          const armR     = Math.max(2, Math.floor(armThick * 0.5));
          const key      = `ca${ti}-${ci}`;
          const elems: React.ReactElement[] = [];

          // ── Helper: render a vertical cactus segment (trunk or arm spire) with detail
          const renderSpire = (
            sKey: string, sx: number, sBot: number, sw: number, sh: number, radius: number,
          ): React.ReactElement => {
            const ribCount = sw >= 9 ? 3 : sw >= 6 ? 2 : sw >= 4 ? 1 : 0;
            const ribs: React.ReactElement[] = [];
            for (let r = 0; r < ribCount; r++) {
              const xf = (r + 1) / (ribCount + 1);
              const gx = Math.round(xf * sw);
              // groove (dark thin line)
              ribs.push(
                <View key={`g${r}`} style={{
                  position: 'absolute',
                  left: gx, top: radius,
                  width: 1, bottom: 0,
                  backgroundColor: groove,
                }} />
              );
              // adjacent ridge highlight (1px to the right of groove)
              if (sw >= 6) {
                ribs.push(
                  <View key={`rg${r}`} style={{
                    position: 'absolute',
                    left: gx + 1, top: radius,
                    width: 1, bottom: 0,
                    backgroundColor: ridge,
                    opacity: 0.35,
                  }} />
                );
              }
            }
            // areole spines along the height
            const spineCount = Math.max(2, Math.floor(sh / 12));
            const spines: React.ReactElement[] = [];
            for (let s = 0; s < spineCount; s++) {
              const yf  = (s + 0.65) / spineCount;
              const rnd = Math.abs(Math.sin(s * 37.1 + sx * 0.13 + sBot * 0.09));
              const xp  = Math.max(1, Math.round(rnd * (sw - 2)));
              spines.push(
                <View key={`sp${s}`} style={{
                  position: 'absolute',
                  left: xp, top: Math.round(yf * sh),
                  width: 1, height: 1,
                  backgroundColor: spine,
                }} />
              );
            }
            return (
              <View key={sKey} style={{
                position: 'absolute',
                left: sx, bottom: sBot,
                width: sw, height: sh,
                backgroundColor: fill,
                borderTopLeftRadius: radius,
                borderTopRightRadius: radius,
                overflow: 'hidden',
              }}>
                {/* Dark left edge shadow */}
                <View style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: 1, backgroundColor: darkCol,
                }} />
                {/* Warm lit right edge */}
                <View style={{
                  position: 'absolute', right: 0, top: Math.round(radius * 0.5), bottom: 0,
                  width: Math.max(1, Math.floor(sw * 0.16)),
                  backgroundColor: litCol,
                }} />
                {/* Highlight stripe just inside the lit edge */}
                {sw >= 7 && (
                  <View style={{
                    position: 'absolute',
                    right: Math.max(1, Math.floor(sw * 0.16)) + 1,
                    top: radius, bottom: 0,
                    width: 1, backgroundColor: ridge,
                  }} />
                )}
                {/* Top dome shading — slightly darker crown */}
                <View style={{
                  position: 'absolute', left: 1, right: 1, top: 0,
                  height: Math.max(1, Math.floor(radius * 0.6)),
                  backgroundColor: 'rgba(0,0,0,0.30)',
                  borderTopLeftRadius: Math.max(1, radius - 1),
                  borderTopRightRadius: Math.max(1, radius - 1),
                }} />
                {ribs}
                {spines}
              </View>
            );
          };

          // ── Trunk ──
          elems.push(renderSpire(`${key}-t`, trunkX, 0, c.trunkW, trunkH, trunkR));

          // ── Arms ──
          c.arms.forEach((arm, ai) => {
            const armBottom = Math.round(trunkH * arm.yFrac);
            const horizThick = armThick;
            const horizCornerR = Math.max(1, Math.floor(horizThick * 0.45));

            if (arm.side === 'R') {
              // Horizontal section
              elems.push(
                <View key={`${key}-ah${ai}`} style={{
                  position: 'absolute',
                  left: trunkX + c.trunkW - 1, bottom: armBottom,
                  width: arm.horizW + 1, height: horizThick,
                  backgroundColor: fill,
                  borderTopLeftRadius: horizCornerR,
                  overflow: 'hidden',
                }}>
                  <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: litCol }} />
                  <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} />
                  {/* Subtle horizontal ridge */}
                  {horizThick >= 5 && (
                    <View style={{
                      position: 'absolute', left: 1, right: 1,
                      top: Math.round(horizThick * 0.5), height: 1,
                      backgroundColor: ridge, opacity: 0.45,
                    }} />
                  )}
                </View>
              );
              // Vertical spire above the elbow
              const vLeft = trunkX + c.trunkW + arm.horizW - armThick;
              elems.push(renderSpire(`${key}-av${ai}`, vLeft, armBottom, armThick, arm.vertH + horizThick, armR));
            } else {
              elems.push(
                <View key={`${key}-ah${ai}`} style={{
                  position: 'absolute',
                  left: trunkX - arm.horizW, bottom: armBottom,
                  width: arm.horizW + 1, height: horizThick,
                  backgroundColor: fill,
                  borderTopRightRadius: horizCornerR,
                  overflow: 'hidden',
                }}>
                  <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: litCol, opacity: 0.85 }} />
                  <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} />
                  {horizThick >= 5 && (
                    <View style={{
                      position: 'absolute', left: 1, right: 1,
                      top: Math.round(horizThick * 0.5), height: 1,
                      backgroundColor: ridge, opacity: 0.45,
                    }} />
                  )}
                </View>
              );
              elems.push(renderSpire(`${key}-av${ai}`, trunkX - arm.horizW, armBottom, armThick, arm.vertH + horizThick, armR));
            }
          });

          // ── Ground shadow ──
          elems.push(
            <View key={`${key}-sh`} style={{
              position: 'absolute',
              left: trunkX - 5, bottom: 0,
              width: c.trunkW + 10, height: 2,
              backgroundColor: 'rgba(0,0,0,0.35)',
              borderRadius: 2,
            }} />
          );

          return elems;
        })
      );
    }

    // City buildings (default)
    return Array.from({ length: NUM_MARKS + 2 }).flatMap((_, ti) =>
      BUILDING_DEFS.flatMap((b, bi) => {
        const bH = Math.max(12, ROAD_TOP * b.hFrac);
        const elems: React.ReactElement[] = [
          <View key={`b${ti}-${bi}`} style={{
            position: 'absolute',
            left: ti * MARK_PERIOD + b.x,
            bottom: 0,
            width: b.w,
            height: bH,
            backgroundColor: b.fill,
            borderTopWidth: 2,
            borderTopColor: b.top,
            borderLeftWidth: 1, borderLeftColor: b.side,
            borderRightWidth: 1, borderRightColor: b.side,
            overflow: 'hidden',
          }}>
            {b.wins.map((w, wi) => (
              <View key={wi} style={{
                position: 'absolute',
                left: Math.round(w.xf * (b.w - WW)),
                top: Math.round(w.yf * bH),
                width: WW, height: WH,
                backgroundColor: w.lit ? b.winLit : 'rgba(0,4,12,0.85)',
              }} />
            ))}
          </View>,
        ];
        if (b.antenna) {
          elems.push(
            <View key={`a${ti}-${bi}`} style={{
              position: 'absolute',
              left: ti * MARK_PERIOD + b.x + Math.floor(b.w / 2) - 1,
              bottom: bH,
              width: 2,
              height: 14,
              backgroundColor: b.top,
            }} />
          );
        }
        return elems;
      })
    );
  }, [ROAD_TOP, NUM_MARKS, theme.type]);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3500);
    return () => clearTimeout(t);
  }, []);

  const moveLane = useCallback((dir: -1 | 1) => {
    if (phaseRef.current !== 'playing') return;
    const next = Math.max(0, Math.min(LANES - 1, laneRef.current + dir));
    if (next === laneRef.current) return;
    laneRef.current = next;
    Animated.timing(carY, {
      toValue: laneTop(next, CAR_H),
      duration: 140,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp')   moveLane(-1);
      else if (e.key === 'ArrowDown') moveLane(1);
    };
    (window as any).addEventListener('keydown', onKey);
    return () => (window as any).removeEventListener('keydown', onKey);
  }, [moveLane]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, g) => {
        if (Math.abs(g.dy) > 15) moveLane(g.dy < 0 ? -1 : 1);
        else moveLane(evt.nativeEvent.pageY < height / 2 ? -1 : 1);
      },
    })
  ).current;

  // Game loop — drives road scroll, obstacles, collision, progress
  useEffect(() => {
    const id = setInterval(() => {
      if (phaseRef.current !== 'playing') return;
      const t = ++tickRef.current;

      // Road offset — driven by tick, no separate animation
      roadOffRef.current = -((t * SPEED) % MARK_PERIOD);

      // Spawn obstacle
      if (t > 50 && t % 80 === 0) {
        const def = OBS_DEFS[Math.floor(Math.random() * OBS_DEFS.length)];
        obsRef.current.push({
          id: idRef.current++,
          lane: Math.floor(Math.random() * LANES),
          x: width + 60,
          label: def.label,
          color: def.color,
          icon: def.icon,
        });
      }

      // Move obstacles
      obsRef.current = obsRef.current
        .map(o => ({ ...o, x: o.x - SPEED }))
        .filter(o => o.x > -OBS_W - 20);

      // Collision
      if (cdRef.current > 0) {
        cdRef.current--;
      } else {
        for (const o of obsRef.current) {
          if (o.lane === laneRef.current && o.x < HIT_R && o.x + OBS_W > HIT_L) {
            cdRef.current = 55;
            const nh = Math.max(0, healthRef.current - 1);
            healthRef.current = nh;
            setHealth(nh);
            flashVal.setValue(1);
            Animated.timing(flashVal, { toValue: 0, duration: 500, useNativeDriver: false }).start();
            if (nh <= 0) { phaseRef.current = 'lost'; setPhase('lost'); }
            break;
          }
        }
      }

      const p = Math.min(100, (t / TOTAL_TICKS) * 100);
      setProgress(p);
      forceRender(t);

      if (p >= 100 && phaseRef.current === 'playing') {
        phaseRef.current = 'won';
        setPhase('won');
        setTimeout(() => router.push({ pathname: '/quiz', params: { missionId: missionId ?? 'can_bus' } }), 2500);
      }
    }, TICK);

    return () => clearInterval(id);
  }, []);

  const flashBg = flashVal.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,0,0,0)', 'rgba(255,0,0,0.35)'],
  });

  // Checkpoint travels from off-screen right → past the car (car visually crosses it at 100%)
  const cpFrac = Math.max(0, Math.min(1, (progress - CHECKPOINT_AT) / (100 - CHECKPOINT_AT)));
  const checkpointX = (width + 80) - cpFrac * (width + 80 - (CAR_X - 20));

  return (
    <View style={styles.root} {...pan.panHandlers}>
      <LinearGradient colors={theme.bgGradient} style={StyleSheet.absoluteFill} />

      {/* Scrolling scenery above road */}
      <View style={{ position: 'absolute', top: 0, height: ROAD_TOP, left: 0, right: 0, overflow: 'hidden' }}>
        {/* Horizon glow at the base of the skyline */}
        <LinearGradient
          colors={theme.horizonColors}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: Math.round(ROAD_TOP * 0.4) }}
        />
        {/* Fixed stars — trees scroll in front creating parallax depth */}
        {starElems}
        {/* Mountain backdrop — parallax at 25% road speed */}
        {mountainElems && (
          <View style={{
            position: 'absolute', top: 0, bottom: 0, left: 0,
            width: (Math.ceil((width + 4 * MARK_PERIOD) / MARK_PERIOD) + 2) * MARK_PERIOD,
            transform: [{ translateX: -((tickRef.current * SPEED * 0.25) % (4 * MARK_PERIOD)) }],
          }}>
            {mountainElems}
          </View>
        )}
        {/* Desert rock formations — parallax at 25% road speed */}
        {desertElems && (
          <View style={{
            position: 'absolute', top: 0, bottom: 0, left: 0,
            width: (Math.ceil((width + 4 * MARK_PERIOD) / MARK_PERIOD) + 2) * MARK_PERIOD,
            transform: [{ translateX: -((tickRef.current * SPEED * 0.25) % (4 * MARK_PERIOD)) }],
          }}>
            {desertElems}
          </View>
        )}
        {/* Race circuit scenery — full road speed, 4-tile pattern */}
        {circuitElems && (
          <View style={{
            position: 'absolute', top: 0, bottom: 0, left: 0,
            width: (Math.ceil((width + 4 * MARK_PERIOD) / MARK_PERIOD) + 2) * MARK_PERIOD,
            transform: [{ translateX: -((tickRef.current * SPEED) % (4 * MARK_PERIOD)) }],
          }}>
            {circuitElems}
          </View>
        )}
        <View style={{
          position: 'absolute', top: 0, bottom: 0, left: 0,
          width: (NUM_MARKS + 2) * MARK_PERIOD,
          transform: [{ translateX: roadOffRef.current }],
        }}>
          {sceneryElems}
        </View>
      </View>

      {/* Scrolling ground below road */}
      <View style={{ position: 'absolute', top: ROAD_TOP + ROAD_H, left: 0, right: 0, bottom: 0, backgroundColor: theme.groundBg, overflow: 'hidden' }}>
        {/* Glow cast from road edge */}
        <LinearGradient
          colors={[theme.groundGlowColor, 'rgba(0,0,0,0)']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 55 }}
        />
        <View style={{
          position: 'absolute', top: 0, bottom: 0, left: 0,
          width: (NUM_MARKS + 2) * MARK_PERIOD,
          transform: [{ translateX: roadOffRef.current }],
        }}>
          {/* Horizontal dash rows — denser near road, sparser toward bottom */}
          {[5, 13, 23, 35, 50].map((yOff, ri) =>
            Array.from({ length: NUM_MARKS + 2 }).map((_, i) => (
              <View key={`h${ri}-${i}`} style={{
                position: 'absolute',
                left: i * MARK_PERIOD,
                top: yOff,
                width: MARK_W,
                height: 1,
                backgroundColor: theme.groundLineColors[ri],
              }} />
            ))
          )}
          {/* Vertical tick marks at dash intersections */}
          {Array.from({ length: NUM_MARKS + 2 }).map((_, i) => (
            <View key={`vt${i}`} style={{
              position: 'absolute',
              left: i * MARK_PERIOD + Math.floor(MARK_W / 2),
              top: 0,
              width: 1,
              height: 55,
              backgroundColor: theme.groundVTickColor,
            }} />
          ))}
        </View>
      </View>

      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: flashBg, zIndex: 50 }]} pointerEvents="none" />

      <View style={styles.scanlines} pointerEvents="none">
        {Array.from({ length: 25 }).map((_, i) => (
          <View key={i} style={[styles.scanline, { top: (i / 25) * height }]} />
        ))}
      </View>

      {/* HUD — below road */}
      <View style={[styles.hud, { top: ROAD_TOP + ROAD_H + 10 }]}>
        <Text style={styles.hudTitle}>◈ NETWORK INFILTRATION ◈</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          <Text style={styles.flagIcon}>🏁</Text>
        </View>
        <View style={styles.hudMeta}>
          <Text style={styles.hudMetaText}>{Math.round(progress)}% COMPLETE</Text>
          <View style={styles.shields}>
            {[0, 1, 2].map(i => (
              <Text key={i} style={{ color: i < health ? '#00e5ff' : '#1a2035', fontSize: 16, marginLeft: 5 }}>◆</Text>
            ))}
            <Text style={styles.shieldLabel}>SHIELDS</Text>
          </View>
        </View>
      </View>

      {/* Mission label — bottom of screen */}
      <View style={styles.skyLine}>
        <Text style={styles.skyLineText}>{theme.skyLabel}</Text>
      </View>

      {/* ── ROAD ── */}
      <View style={[styles.road, { top: ROAD_TOP, height: ROAD_H }]}>
        <LinearGradient colors={['#06060f', '#0b0b1c', '#06060f']} style={StyleSheet.absoluteFill} />

        {/* Road edges */}
        <View style={[styles.roadEdge, { top: 0 }]} />
        <View style={[styles.roadEdge, { bottom: 0 }]} />

        {/* Scrolling lane marks — driven by game tick, no Animated.loop */}
        <View
          style={{
            position: 'absolute', top: 0, bottom: 0, left: 0,
            width: NUM_MARKS * MARK_PERIOD + MARK_PERIOD,
            transform: [{ translateX: roadOffRef.current }],
          }}
        >
          {Array.from({ length: NUM_MARKS }).map((_, i) => (
            <React.Fragment key={i}>
              <View style={{ position: 'absolute', left: i * MARK_PERIOD, top: LANE_H - 1.5, width: MARK_W, height: 3, backgroundColor: 'rgba(0,229,255,0.2)' }} />
              <View style={{ position: 'absolute', left: i * MARK_PERIOD, top: LANE_H * 2 - 1.5, width: MARK_W, height: 3, backgroundColor: 'rgba(0,229,255,0.2)' }} />
            </React.Fragment>
          ))}
        </View>

        {/* ── FINISH GATE ── */}
        {progress >= CHECKPOINT_AT && (() => {
          const scan1 = (tickRef.current * 2.2) % ROAD_H;
          const scan2 = (tickRef.current * 2.2 + ROAD_H * 0.55) % ROAD_H;
          const glow  = 0.04 + 0.03 * Math.sin(tickRef.current * 0.07);
          return (
            <View style={{ position: 'absolute', left: checkpointX, top: 0, width: 48, height: ROAD_H, overflow: 'hidden' }}>
              {/* Gate fill + pulsing glow */}
              <View style={{ position: 'absolute', left: 4, right: 4, top: 0, bottom: 0, backgroundColor: `rgba(0,255,136,${glow})` }} />
              {/* Scan line 1 */}
              <View style={{ position: 'absolute', left: 4, right: 4, top: scan1, height: 4, backgroundColor: 'rgba(0,255,136,0.35)' }} />
              <View style={{ position: 'absolute', left: 4, right: 4, top: scan1 - 10, height: 2, backgroundColor: 'rgba(0,255,136,0.10)' }} />
              {/* Scan line 2 */}
              <View style={{ position: 'absolute', left: 4, right: 4, top: scan2, height: 4, backgroundColor: 'rgba(0,255,136,0.25)' }} />
              <View style={{ position: 'absolute', left: 4, right: 4, top: scan2 - 10, height: 2, backgroundColor: 'rgba(0,255,136,0.08)' }} />
              {/* Left post */}
              <View style={{ position: 'absolute', left: 0, top: 0, width: 4, height: ROAD_H, backgroundColor: '#00ff88', shadowColor: '#00ff88', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 14 }} />
              {/* Right post */}
              <View style={{ position: 'absolute', right: 0, top: 0, width: 4, height: ROAD_H, backgroundColor: '#00ff88', shadowColor: '#00ff88', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 14 }} />
              {/* Top beam */}
              <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 4, backgroundColor: '#00ff88', shadowColor: '#00ff88', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10 }} />
              {/* Post notches */}
              {[0.2, 0.4, 0.6, 0.8].map(f => (
                <React.Fragment key={f}>
                  <View style={{ position: 'absolute', left: 4, top: ROAD_H * f - 1, width: 8, height: 2, backgroundColor: '#00ff88', opacity: 0.55 }} />
                  <View style={{ position: 'absolute', right: 4, top: ROAD_H * f - 1, width: 8, height: 2, backgroundColor: '#00ff88', opacity: 0.55 }} />
                </React.Fragment>
              ))}
              {/* Label */}
              <View style={{ position: 'absolute', left: -32, right: -32, top: ROAD_H * 0.40, alignItems: 'center' }}>
                <Text style={{ fontFamily: MONOSPACE, fontSize: 8, fontWeight: '900', color: '#00ff88', letterSpacing: 2, textShadowColor: '#00ff88', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }}>◈ SECURE</Text>
                <Text style={{ fontFamily: MONOSPACE, fontSize: 8, fontWeight: '900', color: '#00ff88', letterSpacing: 2, textShadowColor: '#00ff88', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }}>  ZONE ◈</Text>
              </View>
            </View>
          );
        })()}

        {/* Obstacles */}
        {obsRef.current.map(obs => {
          const pulse = 0.65 + 0.35 * Math.sin((tickRef.current + obs.id * 17) * 0.10);
          const dotActive = (Math.floor(tickRef.current / 9) + obs.id) % 3;
          return (
            <View key={obs.id} style={{
              position: 'absolute', left: obs.x, top: laneTop(obs.lane, OBS_H),
              width: OBS_W, height: OBS_H,
              backgroundColor: `${obs.color}0e`,
              borderWidth: 1, borderColor: `${obs.color}80`,
            }}>
              {/* Top bar — pulses */}
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: obs.color, opacity: pulse }} />
              {/* Corner accents */}
              <View style={{ position: 'absolute', top: -1, left: -1, width: 9, height: 9, borderTopWidth: 2, borderLeftWidth: 2, borderColor: obs.color }} />
              <View style={{ position: 'absolute', top: -1, right: -1, width: 9, height: 9, borderTopWidth: 2, borderRightWidth: 2, borderColor: obs.color }} />
              <View style={{ position: 'absolute', bottom: -1, left: -1, width: 9, height: 9, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: obs.color }} />
              <View style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderBottomWidth: 2, borderRightWidth: 2, borderColor: obs.color }} />
              {/* Horizontal data lines */}
              <View style={{ position: 'absolute', left: 6, right: 6, top: Math.round(OBS_H * 0.40), height: 1, backgroundColor: `${obs.color}40` }} />
              <View style={{ position: 'absolute', left: 6, right: 6, top: Math.round(OBS_H * 0.65), height: 1, backgroundColor: `${obs.color}28` }} />
              {/* Icon + label */}
              <View style={{ position: 'absolute', top: 3, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontFamily: MONOSPACE, fontSize: 17, color: obs.color, opacity: 0.85 + 0.15 * pulse }}>{obs.icon}</Text>
                <Text style={{ fontFamily: MONOSPACE, fontSize: 7, fontWeight: '900', color: obs.color, letterSpacing: 1, marginTop: 3 }}>{obs.label}</Text>
              </View>
              {/* Bottom dots — cycle one at a time */}
              <View style={{ position: 'absolute', bottom: 5, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={{ width: 4, height: 4, backgroundColor: obs.color, opacity: i === dotActive ? 1 : 0.2 }} />
                ))}
              </View>
            </View>
          );
        })}

        {/* ── CAR ── */}
        <Animated.View style={{
          position: 'absolute', left: CAR_X, top: carY,
          width: CAR_W, height: CAR_H,
        }}>
          <Image source={carImage} style={{ width: CAR_W, height: CAR_H }} resizeMode="contain" />
        </Animated.View>
      </View>


      {/* Controls hint */}
      {showHint && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>{Platform.OS === 'web' ? '↑  ↓   arrow keys' : 'swipe  ↑  ↓'}</Text>
        </View>
      )}

      {/* Win */}
      {phase === 'won' && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <Text style={styles.overlayTitle}>✓ CHECKPOINT REACHED</Text>
            <Text style={styles.overlaySub}>INITIATING DEBRIEF PROTOCOL...</Text>
          </View>
        </View>
      )}

      {/* Lost */}
      {phase === 'lost' && (
        <View style={styles.overlay}>
          <View style={[styles.overlayBox, { borderColor: '#ff3333' }]}>
            <Text style={[styles.overlayTitle, { color: '#ff3333', textShadowColor: '#ff3333' }]}>✗ INTRUSION DETECTED</Text>
            <Text style={styles.overlaySub}>ALL SHIELDS DEPLETED — MISSION FAILED</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => router.replace({ pathname: '/drive', params: { missionId: missionId ?? 'can_bus', carId: carId ?? 'cla' } })}
            >
              <Text style={styles.retryTxt}>↩ RETRY MISSION</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exitLostBtn}
              onPress={() => router.replace('/')}
            >
              <Text style={styles.exitLostTxt}>✕ EXIT</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  scanlines: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  scanline: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.12)' },
  hud: { position: 'absolute', left: 18, right: 18, zIndex: 10 },
  hudTitle: { fontFamily: MONOSPACE, fontSize: 10, color: 'rgba(0,229,255,0.55)', letterSpacing: 3, textAlign: 'center', marginBottom: 8 },
  progressBar: { height: 7, backgroundColor: 'rgba(0,229,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.22)', borderRadius: 4, overflow: 'visible', marginBottom: 5 },
  progressFill: { height: '100%', backgroundColor: '#00e5ff', borderRadius: 3, shadowColor: '#00e5ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 },
  flagIcon: { position: 'absolute', right: -4, top: -5, fontSize: 14 },
  hudMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  hudMetaText: { fontFamily: MONOSPACE, fontSize: 8, color: 'rgba(0,229,255,0.45)', letterSpacing: 1 },
  shields: { flexDirection: 'row', alignItems: 'center' },
  shieldLabel: { fontFamily: MONOSPACE, fontSize: 8, color: 'rgba(0,229,255,0.45)', letterSpacing: 1, marginLeft: 4 },
  skyLine: { position: 'absolute', bottom: 8, left: 0, right: 0, alignItems: 'center' },
  skyLineText: { fontFamily: MONOSPACE, fontSize: 9, color: 'rgba(0,229,255,0.35)', letterSpacing: 4 },
  road: { position: 'absolute', left: 0, right: 0, overflow: 'hidden' },
  roadEdge: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: 'rgba(0,229,255,0.55)', shadowColor: '#00e5ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 5, zIndex: 2 },
  hint: { position: 'absolute', bottom: 36, left: 0, right: 0, alignItems: 'center' },
  hintText: { fontFamily: MONOSPACE, fontSize: 11, color: 'rgba(0,229,255,0.4)', letterSpacing: 3, borderWidth: 1, borderColor: 'rgba(0,229,255,0.18)', paddingHorizontal: 18, paddingVertical: 7 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200 },
  overlayBox: { borderWidth: 2, borderColor: '#00e5ff', backgroundColor: 'rgba(0,8,25,0.97)', padding: 32, alignItems: 'center', gap: 14, maxWidth: 380, width: '85%' },
  overlayTitle: { fontFamily: MONOSPACE, fontSize: 20, fontWeight: '900', color: '#00e5ff', letterSpacing: 2, textShadowColor: '#00e5ff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10, textAlign: 'center' },
  overlaySub: { fontFamily: MONOSPACE, fontSize: 10, color: 'rgba(0,229,255,0.55)', letterSpacing: 2, textAlign: 'center' },
  retryBtn: { marginTop: 8, borderWidth: 1, borderColor: '#ff3333', paddingHorizontal: 22, paddingVertical: 11, backgroundColor: 'rgba(255,50,50,0.08)' },
  retryTxt: { fontFamily: MONOSPACE, fontSize: 13, color: '#ff3333', letterSpacing: 2 },
  exitLostBtn: { marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 22, paddingVertical: 11, backgroundColor: 'rgba(255,255,255,0.04)' },
  exitLostTxt: { fontFamily: MONOSPACE, fontSize: 13, color: 'rgba(255,255,255,0.55)', letterSpacing: 2 },
});
