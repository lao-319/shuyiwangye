import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MED_COLORS, SYSTEM_INFO } from '../constants';

interface BootLine {
  id: number;
  text: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'header';
  delay: number;
}

const BOOT_SEQUENCE: BootLine[] = [
  { id: 1,  text: '╔══════════════════════════════════════════════╗', type: 'header', delay: 200 },
  { id: 2,  text: '║   PESTIS TERMINAL — BIOSAFETY LEVEL 4       ║', type: 'header', delay: 400 },
  { id: 3,  text: '║   鼠疫监测系统 v4.1-MEDICAL                  ║', type: 'header', delay: 600 },
  { id: 4,  text: '╚══════════════════════════════════════════════╝', type: 'header', delay: 800 },
  { id: 5,  text: '', type: 'info', delay: 1000 },
  { id: 6,  text: '[BIOS] Initializing YERSINIA Core..............', type: 'info', delay: 1200 },
  { id: 7,  text: '[BIOS] Memory Check: 8192 TB OK', type: 'success', delay: 1600 },
  { id: 8,  text: '[BIOS] Quantum Entanglement: STABLE', type: 'success', delay: 2000 },
  { id: 9,  text: '[BIOS] Temporal Anchor: DETACHED', type: 'success', delay: 2400 },
  { id: 10, text: '', type: 'info', delay: 2800 },
  { id: 11, text: '[KERNEL] Loading Pathogen Database.............', type: 'info', delay: 3000 },
  { id: 12, text: '[KERNEL] Y. pestis strain data: 130 REGIONS', type: 'success', delay: 3500 },
  { id: 13, text: '[KERNEL] European outbreak records: 6,926', type: 'success', delay: 3900 },
  { id: 14, text: '[KERNEL] Mortality data loaded: 56,287 deaths', type: 'warn', delay: 4300 },
  { id: 15, text: '', type: 'info', delay: 4700 },
  { id: 16, text: '[MED-ENG] Initializing Analysis Pipeline.......', type: 'info', delay: 4900 },
  { id: 17, text: '[MED-ENG] GIS Projection: Xian 1980 → WGS84', type: 'info', delay: 5300 },
  { id: 18, text: '[MED-ENG] Map tileserver: ONLINE', type: 'success', delay: 5700 },
  { id: 19, text: '[MED-ENG] Epidemic spread model: LOADED', type: 'success', delay: 6100 },
  { id: 20, text: '', type: 'info', delay: 6500 },
  { id: 21, text: '[SEC] Biosafety Protocol: ACTIVE', type: 'success', delay: 6700 },
  { id: 22, text: '[SEC] Containment field: NOMINAL', type: 'success', delay: 7100 },
  { id: 23, text: '[SEC] Cross-temporal firewall: ENABLED', type: 'success', delay: 7500 },
  { id: 24, text: '', type: 'info', delay: 7900 },
  { id: 25, text: '[SYS] All subsystems ONLINE', type: 'success', delay: 8100 },
  { id: 26, text: '[SYS] Awaiting ADMIN authorization............', type: 'info', delay: 8500 },
];

// ===== ECG 波形路径生成 =====
const generateECGPath = (width: number, height: number, segments: number): string => {
  const midY = height / 2;
  const amp = height * 0.35;
  const segW = width / segments;
  const points: [number, number][] = [];

  for (let i = 0; i <= segments; i++) {
    const x = i * segW;
    const phase = (i % 8) / 8;
    let y: number;

    if (phase < 0.15) {
      y = midY;
    } else if (phase < 0.25) {
      const p = (phase - 0.15) / 0.10;
      y = midY - amp * 0.25 * Math.sin(p * Math.PI);
    } else if (phase < 0.35) {
      y = midY;
    } else if (phase < 0.40) {
      const q = (phase - 0.35) / 0.05;
      y = midY + amp * 0.15 * Math.sin(q * Math.PI / 2);
    } else if (phase < 0.50) {
      const r = (phase - 0.40) / 0.10;
      y = midY - amp * Math.sin(r * Math.PI);
    } else if (phase < 0.55) {
      const s = (phase - 0.50) / 0.05;
      y = midY + amp * 0.5 * Math.sin(s * Math.PI / 2);
    } else if (phase < 0.70) {
      y = midY;
    } else if (phase < 0.90) {
      const t = (phase - 0.70) / 0.20;
      y = midY - amp * 0.35 * Math.sin(t * Math.PI);
    } else {
      y = midY;
    }

    points.push([x, y]);
  }

  if (points.length < 3) return '';
  let path = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const cpx = x1;
    const cpy = y1;
    const endX = (x1 + x2) / 2;
    const endY = (y1 + y2) / 2;
    path += ` Q ${cpx.toFixed(2)} ${cpy.toFixed(2)} ${endX.toFixed(2)} ${endY.toFixed(2)}`;
  }
  const last = points[points.length - 1];
  path += ` L ${last[0].toFixed(2)} ${last[1].toFixed(2)}`;
  return path;
};

/** 医疗白色调 */
const DANGER_RED = '#DC2626';
const DANGER_RED_DARK = '#991B1B';
const ECG_BLUE = '#3B82F6';

// ===== 红色警告行（精简为一条核心警告） =====
const RED_WARNINGS = [
  '⚠ BIOHAZARD ALERT — YERSINIA PESTIS DETECTED',
];

// ===== 赛博朋克故障风闪烁文字组件 =====
const GlitchText: React.FC<{
  text: string;
  active: boolean;
  color: string;
  className?: string;
  fontSize?: string;
}> = ({ text, active, color, className = '', fontSize }) => {
  return (
    <span
      className={`relative inline-block ${className}`}
      style={{
        fontSize,
        fontFamily: "'JetBrains Mono', 'SimHei', monospace",
        animation: active ? 'glitch-skew 0.15s ease-in-out infinite' : 'none',
      }}
    >
      {/* 主文字 */}
      <span
        className="relative"
        style={{
          color,
          animation: active ? 'glitch-opacity 0.2s steps(1) infinite' : 'none',
        }}
      >
        {text}
      </span>

      {/* 红色残影 — 向左偏移，被 clip 切条 */}
      {active && (
        <>
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              color: DANGER_RED,
              left: '-3px',
              textShadow: `2px 0 ${DANGER_RED}`,
              animation: 'glitch-clip-1 0.3s steps(1) infinite',
              clipPath: 'inset(0 0 0 0)',
            }}
          >
            {text}
          </span>
          {/* 蓝色残影 — 向右偏移 */}
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              color: ECG_BLUE,
              left: '3px',
              textShadow: `-2px 0 ${ECG_BLUE}`,
              animation: 'glitch-clip-2 0.3s steps(1) infinite',
              clipPath: 'inset(0 0 0 0)',
            }}
          >
            {text}
          </span>
        </>
      )}
    </span>
  );
};

export const BootScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [showButton, setShowButton] = useState(false);
  const [phase, setPhase] = useState<'loading' | 'glitch' | 'warning' | 'ready'>('loading');
  const [bgColor, setBgColor] = useState('#E8ECF0');
  const [ecgColor, setEcgColor] = useState(ECG_BLUE);
  const [glitchActive, setGlitchActive] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [visibleWarnings, setVisibleWarnings] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [svgSize, setSvgSize] = useState({ width: 800, height: 120 });
  const [pathLen, setPathLen] = useState(1600);

  // 响应式 SVG 尺寸
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth - 80;
        setSvgSize({ width: Math.max(w, 400), height: 120 });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const ecgPath = generateECGPath(svgSize.width, svgSize.height, 64);

  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      if (len > 0) setPathLen(len);
    }
  }, [ecgPath]);

  // 后台启动文本逐行显示
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_SEQUENCE.forEach((line) => {
      const t = setTimeout(() => {
        setVisibleLines(prev => [...prev, line.id]);
      }, line.delay);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  // 进度条动画（ECG 描边 + 百分比）
  useEffect(() => {
    const totalDuration = 9000;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const p = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(p);

      if (p < 100) {
        requestAnimationFrame(tick);
      } else {
        // ===== 进度完成 → 赛博朋克故障闪烁 → 红色警告 =====
        setPhase('glitch');
        setEcgColor(DANGER_RED);
        setScreenShake(true);

        // 故障闪烁节奏：4 轮 burst，每轮亮→灭
        const glitchBursts = [
          { start: 0,    duration: 300 },
          { start: 500,  duration: 200 },
          { start: 850,  duration: 350 },
          { start: 1350, duration: 250 },
        ];

        glitchBursts.forEach(({ start, duration }) => {
          setTimeout(() => {
            setGlitchActive(true);
            setTimeout(() => setGlitchActive(false), duration);
          }, start);
        });

        // 最后一轮故障结束后 → 显示红色警告
        const glitchEnd = 1350 + 250 + 200; // ~1800ms
        setTimeout(() => {
          setGlitchActive(false);
          setScreenShake(false);
          setPhase('warning');

          // 红色警告逐行出现
          RED_WARNINGS.forEach((_, i) => {
            setTimeout(() => {
              setVisibleWarnings(prev => [...prev, i]);
            }, i * 350);
          });

          // 警告显示完毕后 → ready（精简后单条警告缩短停留时间）
          const warningDuration = RED_WARNINGS.length * 350 + 400;
          setTimeout(() => {
            setPhase('ready');
            setTimeout(() => setShowButton(true), 250);
          }, warningDuration);
        }, glitchEnd);
      }
    };

    requestAnimationFrame(tick);
  }, []);

  const lineColor = (type: BootLine['type']) => {
    switch (type) {
      case 'success': return '#94A3B8';
      case 'warn':    return '#A1A1AA';
      case 'error':   return '#DC2626';
      case 'header':  return '#6B7280';
      default:        return '#B0B7C3';
    }
  };

  const isDangerPhase = phase === 'glitch' || phase === 'warning' || phase === 'ready';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundColor: bgColor,
        animation: screenShake ? 'screen-shake 0.2s ease-in-out infinite' : 'none',
      }}
    >
      {/* ===== 屏幕四周虚化暗角（进度100%时移除） ===== */}
      {progress < 100 && (
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            background: 'radial-gradient(ellipse 60% 70% at center, transparent 30%, rgba(60,70,85,0.70) 100%)',
          }}
        />
      )}

      {/* ===== 医疗白背景网格 ===== */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundSize: '20px 20px',
          backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
          opacity: 0.5,
        }}
      />

      {/* ===== 故障闪烁时的扫描线叠加（赛博朋克感） ===== */}
      {glitchActive && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(220,38,38,0.03) 2px,
              rgba(220,38,38,0.03) 4px
            )`,
          }}
        />
      )}

      {/* ===== 主视觉区：ECG 心电图进度条 ===== */}
      <div className="relative z-20 flex flex-col items-center gap-8 w-full max-w-4xl px-10">
        {/* 标题 — 故障闪烁 */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-2xl font-bold tracking-[0.3em] uppercase mb-2">
            <GlitchText
              text={SYSTEM_INFO.NAME}
              active={glitchActive}
              color={isDangerPhase ? DANGER_RED : '#1E293B'}
              className="text-2xl font-bold tracking-[0.3em] uppercase"
            />
          </h1>
          <p
            className="text-[10px] tracking-[0.2em] uppercase"
            style={{
              color: isDangerPhase ? `${DANGER_RED}99` : '#94A3B8',
              transition: 'color 0.25s ease-out',
            }}
          >
            <GlitchText
              text={SYSTEM_INFO.BUILD}
              active={glitchActive}
              color={isDangerPhase ? `${DANGER_RED}99` : '#94A3B8'}
              className="text-[10px] tracking-[0.2em] uppercase"
            />
          </p>
        </motion.div>

        {/* ECG 波形图 */}
        <div className="relative w-full">
          <svg
            width={svgSize.width}
            height={svgSize.height}
            viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
            className="w-full"
            style={{ filter: `drop-shadow(0 0 6px ${ecgColor}40)` }}
          >
            {/* 背景网格线 */}
            {Array.from({ length: 5 }).map((_, i) => (
              <line
                key={i}
                x1={0}
                y1={(svgSize.height / 5) * i}
                x2={svgSize.width}
                y2={(svgSize.height / 5) * i}
                stroke={'#CBD5E1'}
                strokeWidth={0.5}
                strokeDasharray="4 4"
              />
            ))}

            {/* ECG 波形路径 */}
            <path
              ref={pathRef}
              d={ecgPath}
              fill="none"
              stroke={ecgColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLen}
              strokeDashoffset={pathLen * (1 - progress / 100)}
              style={{ transition: 'stroke 0.25s ease-out' }}
            />

            {/* ECG 发光轨迹 */}
            <path
              d={ecgPath}
              fill="none"
              stroke={ecgColor}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.25}
              strokeDasharray={pathLen}
              strokeDashoffset={pathLen * (1 - progress / 100)}
              style={{ filter: 'blur(3px)', transition: 'stroke 0.25s ease-out' }}
            />
          </svg>

          {/* 进度百分比 */}
          <div className="absolute right-0 -bottom-8 flex items-center gap-2">
            <span
              className="text-sm font-mono font-bold tabular-nums"
              style={{
                color: isDangerPhase ? DANGER_RED : '#64748B',
                transition: 'color 0.25s ease-out',
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* ===== 红色警告文字 — 故障闪烁结束后，标题下方逐行浮现 ===== */}
        <div className="flex flex-col items-center gap-2 mt-2" style={{ minHeight: 72 }}>
          <AnimatePresence>
            {visibleWarnings.map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex items-center gap-2"
              >
                {/* 红色闪烁指示灯 */}
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: DANGER_RED,
                    boxShadow: `0 0 6px ${DANGER_RED}, 0 0 12px ${DANGER_RED}50`,
                    animation: 'pulse-red 1s ease-in-out infinite',
                  }}
                />
                <span
                  className="text-[10px] font-mono font-bold tracking-wider"
                  style={{
                    color: DANGER_RED,
                    textShadow: `0 0 8px ${DANGER_RED}40`,
                  }}
                >
                  {RED_WARNINGS[i]}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 状态标签 + 进入按钮 */}
        <div className="flex flex-col items-center gap-3 mt-2" style={{ minHeight: 56 }}>
          {/* 阶段一：加载中指示器 */}
          {phase === 'loading' && (
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ECG_BLUE,
                  boxShadow: `0 0 8px ${ECG_BLUE}80`,
                  animation: 'pulse-blue 2s ease-in-out infinite',
                }}
              />
              <span
                className="text-[11px] uppercase font-bold tracking-[0.15em] font-mono whitespace-nowrap"
                style={{ color: '#64748B' }}
              >
                MONITORING BIOSIGNAL...
              </span>
            </div>
          )}

          {/* 阶段二/三：故障闪烁时 / 警告显示时 — 红色状态指示 */}
          {(phase === 'glitch' || phase === 'warning') && (
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: DANGER_RED,
                  boxShadow: `0 0 10px ${DANGER_RED}, 0 0 20px ${DANGER_RED}60`,
                  animation: 'pulse-red 0.8s ease-in-out infinite',
                }}
              />
              <span
                className="text-[11px] uppercase font-bold tracking-[0.15em] font-mono whitespace-nowrap"
                style={{ color: DANGER_RED }}
              >
                {phase === 'glitch' && '⚠ BIOHAZARD DETECTED ⚠'}
                {phase === 'warning' && '⚠ CONTAINMENT BREACH ⚠'}
              </span>
            </div>
          )}

          {/* 进入按钮 */}
          <div className="relative" style={{ width: 240, height: 52 }}>
            <AnimatePresence>
              {showButton && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  onClick={onComplete}
                  className="absolute inset-0 border-2 font-bold uppercase tracking-[0.2em] text-sm transition-all hover:scale-105 active:scale-95"
                  style={{
                    borderColor: DANGER_RED,
                    color: DANGER_RED,
                    backgroundColor: `${DANGER_RED}08`,
                    boxShadow: `0 0 40px ${DANGER_RED}20`,
                  }}
                >
                  Enter PESTIS Terminal
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ===== 底部信息 ===== */}
      <div
        className="absolute bottom-6 z-10 font-mono text-[9px] tracking-wider uppercase"
        style={{
          color: isDangerPhase ? `${DANGER_RED}50` : '#94A3B8',
          opacity: 0.4,
          transition: 'color 0.25s ease-out',
        }}
      >
        BIOSAFETY LEVEL 4 &nbsp;|&nbsp; YERSINIA CORE &nbsp;|&nbsp; TEMPORAL ANCHOR
      </div>
    </div>
  );
};
