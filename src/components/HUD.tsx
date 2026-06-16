import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MED_COLORS } from '../constants';

// ============================================================
// 基础 HUD 组件（红蓝白未来科技风格 — 医疗监测终端）
// ============================================================

/** 视差 3D 倾斜容器 */
export const ParallaxWrapper: React.FC<{ children: React.ReactNode; disabled?: boolean }> = ({ children, disabled = false }) => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (window.innerHeight / 2 - e.clientY) / 100;
    const y = (e.clientX - window.innerWidth / 2) / 200;
    setRotate({ x, y });
  };
  // 禁用时或旋转值为零时不应用 transform，避免 CSS containing block 干扰 Leaflet 地图定位
  const hasTilt = !disabled && (rotate.x !== 0 || rotate.y !== 0);
  const transformStyle = hasTilt
    ? `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`
    : 'none';
  return (
    <div
      onMouseMove={handleMouseMove}
      className="h-full w-full transition-transform duration-300 ease-out"
      style={{ transform: transformStyle }}
    >
      {children}
    </div>
  );
};

/** 光标扫描标签 */
export const CursorScanner: React.FC = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handle = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);
  return (
    <div
      className="fixed pointer-events-none z-[100] mix-blend-screen opacity-30 font-mono text-[8px] overflow-hidden w-28 h-14"
      style={{ left: pos.x + 18, top: pos.y + 18, color: MED_COLORS.BLUE }}
    >
      <div className="animate-pulse">
        PESTIS_{Math.random().toString(16).slice(2, 8).toUpperCase()}<br />
        BIO_HZRD_{Math.floor(Math.random() * 1000)}<br />
        LAT:{pos.y.toFixed(1)} LON:{pos.x.toFixed(1)}
      </div>
    </div>
  );
};

/** 目标锁定框（同心圆环 + 十字准星 — CT 扫描定位风格） */
export const TargetingBox: React.FC<{ active: boolean; onComplete?: () => void }> = ({ active, onComplete }) => {
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => { setLocked(true); onComplete?.(); }, 1500);
      return () => { clearTimeout(timer); setLocked(false); };
    }
  }, [active, onComplete]);
  if (!active) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      {/* 外层收缩圆环 */}
      <div
        className="absolute rounded-full border-2 transition-all duration-[1500ms] ease-in-out"
        style={{
          borderColor: MED_COLORS.BLUE,
          width: locked ? '40px' : '256px',
          height: locked ? '40px' : '256px',
          opacity: locked ? 0 : 0.6,
          boxShadow: locked ? 'none' : `0 0 20px ${MED_COLORS.BLUE}20`,
        }}
      />
      {/* 内层收缩圆环 */}
      <div
        className="absolute rounded-full border transition-all duration-[1500ms] ease-in-out"
        style={{
          borderColor: MED_COLORS.BLUE,
          width: locked ? '20px' : '180px',
          height: locked ? '20px' : '180px',
          opacity: locked ? 0 : 0.4,
        }}
      />
      {/* 十字准星 */}
      <div className="absolute" style={{ opacity: locked ? 1 : 0.3, transition: 'opacity 0.5s' }}>
        <div style={{ width: 50, height: 1.5, backgroundColor: MED_COLORS.BLUE, position: 'absolute', top: -0.75, left: -25, boxShadow: `0 0 4px ${MED_COLORS.BLUE}` }} />
        <div style={{ width: 1.5, height: 50, backgroundColor: MED_COLORS.BLUE, position: 'absolute', top: -25, left: -0.75, boxShadow: `0 0 4px ${MED_COLORS.BLUE}` }} />
      </div>
      {locked && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-1 text-xs font-bold tracking-widest uppercase"
          style={{ backgroundColor: MED_COLORS.RED, color: '#F1F5F9' }}
        >
          [BIOHAZARD CONFIRMED]
        </motion.div>
      )}
    </div>
  );
};

/** 包围框（医疗传感器校准点风格 — 四角发光圆点 + 标签） */
export const BoundingBox: React.FC<{
  label: string;
  color?: string;
  className?: string;
  subtext?: string;
  style?: React.CSSProperties;
}> = ({ label, color = MED_COLORS.BLUE, className = '', subtext, style }) => (
  <div className={`absolute border flex flex-col ${className}`} style={{ ...style, borderColor: color }}>
    <div
      className="absolute top-0 left-0 p-1 text-[10px] uppercase font-bold flex justify-between items-center gap-2 whitespace-nowrap"
      style={{ backgroundColor: color, color: '#FFFFFF' }}
    >
      <span>{label}</span>
      {subtext && <span className="opacity-60 text-[8px]">{subtext}</span>}
    </div>
    {/* 四角传感器校准点 */}
    <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full pointer-events-none" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />
    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full pointer-events-none" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />
    <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full pointer-events-none" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />
    <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full pointer-events-none" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />
  </div>
);

/** 交互框（45° 切角科技感边框 + 双重线条 + 蓝色发光） */
export const InteractiveBox: React.FC<{
  children: React.ReactNode;
  label: string;
  color?: string;
  active?: boolean;
  className?: string;
}> = ({ children, label, color = MED_COLORS.GRAY_LIGHT, active, className = '' }) => {
  const currentColor = active ? MED_COLORS.BLUE : color;
  // 左上角 + 右下角 6px 45° 斜切
  const chamferClip = `polygon(
    6px 0,
    100% 0,
    100% calc(100% - 6px),
    calc(100% - 6px) 100%,
    0 100%,
    0 6px
  )`;

  return (
    <div className={`relative ${className}`}>
      {/* 切角边框叠加层 — 绝对定位，不干扰子元素 flex 布局 */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-300"
        style={{ borderRadius: '5px' }}
      >
        <div
          className="w-full h-full transition-all duration-300"
          style={{
            clipPath: chamferClip,
            border: `1px solid ${currentColor}`,
            boxShadow: `inset 0 0 0 1px ${currentColor}40`,
            backgroundColor: active ? `${MED_COLORS.BLUE}08` : 'transparent',
          }}
        />
      </div>

      {/* 外部发光层 — 独立 div，box-shadow 不被 clip-path 裁剪 */}
      {active && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            borderRadius: '5px',
            boxShadow: `0 0 12px ${MED_COLORS.BLUE}30, 0 0 24px ${MED_COLORS.BLUE}08`,
          }}
        />
      )}

      {/* 子元素 — 在正常流中渲染，享受 className 中的 flex 布局 */}
      {children}

      {/* 底部标签 — 脉冲圆点 + 文字（label 为空时不渲染） */}
      {label && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1">
          <div
            className="w-1 h-1 rounded-full"
            style={{
              backgroundColor: currentColor,
              boxShadow: active ? `0 0 4px ${currentColor}` : 'none',
              animation: active ? 'pulse-blue 1.5s ease-in-out infinite' : 'none',
            }}
          />
          <span
            className="text-[8px] font-bold uppercase tracking-widest whitespace-nowrap"
            style={{ color: currentColor, opacity: active ? 1 : 0.5 }}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  );
};

/** 语音波形（8 条跳动柱 + 发光） */
export const VoiceWave: React.FC<{ active: boolean; color?: string }> = ({ active, color = MED_COLORS.BLUE }) => (
  <div className={`flex items-center gap-[2px] h-6 ${active ? 'opacity-100' : 'opacity-20'}`}>
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="w-[3px] rounded-full transition-[height] duration-300"
        style={{
          backgroundColor: color,
          height: active ? `${20 + Math.random() * 60}%` : '20%',
          boxShadow: active ? `0 0 4px ${color}` : 'none',
          animationDelay: `${i * 0.1}s`,
        }}
      />
    ))}
  </div>
);

/** 战术覆盖弹窗 */
export const TacticalOverlay: React.FC<{
  title: string;
  objective: string;
  onClose: () => void;
  color?: string;
}> = ({ title, objective, onClose, color = MED_COLORS.BLUE }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 z-50 flex items-center justify-center p-8 m-4"
    style={{
      backgroundColor: 'rgba(245,247,250,0.97)',
      border: `2px solid ${color}`,
      boxShadow: `0 0 60px ${color}15`,
    }}
  >
    <div className="max-w-md w-full space-y-6 relative">
      <div className="font-bold text-2xl tracking-tighter border-b pb-2 uppercase" style={{ color, borderColor: color }}>
        {title}
      </div>
      <div className="text-sm leading-relaxed font-mono uppercase" style={{ color: MED_COLORS.TEXT }}>
        <span className="font-bold block mb-2" style={{ color }}>Objective:</span>
        {objective}
      </div>
      <button
        onClick={onClose}
        className="w-full py-4 font-bold uppercase tracking-widest transition-colors"
        style={{ backgroundColor: color, color: '#000' }}
      >
        Acknowledge & Deploy
      </button>
    </div>
  </motion.div>
);

/** 威胁/严重度计量器 */
export const SeverityMeter: React.FC<{
  level: number;
  label?: string;
}> = ({ level, label = 'OUTBREAK LEVEL' }) => {
  const color = level > 70 ? MED_COLORS.RED : level > 30 ? MED_COLORS.ORANGE : level > 10 ? MED_COLORS.BLUE : MED_COLORS.GREEN;
  return (
    <div className="flex flex-col gap-1 w-36">
      <div className="flex justify-between text-[10px] uppercase font-bold" style={{ color }}>
        <span>{label}</span>
        <span>{level}%</span>
      </div>
      <div className="h-2 flex rounded-sm overflow-hidden" style={{ backgroundColor: MED_COLORS.GRAY_DARK, border: `1px solid ${MED_COLORS.GRAY_MID}` }}>
        <motion.div
          className="h-full"
          animate={{ width: `${level}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}
        />
      </div>
    </div>
  );
};

/** 打字机效果 */
export const Typewriter: React.FC<{
  text: string;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}> = ({ text, delay = 20, className = '', onComplete }) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(prev => prev + text.charAt(i));
      i++;
      if (i >= text.length) { clearInterval(timer); onComplete?.(); }
    }, delay);
    return () => clearInterval(timer);
  }, [text, delay]);
  return <span className={className}>{displayed}<span className="animate-pulse opacity-70">█</span></span>;
};

/** 状态指示灯 */
export const StatusIndicator: React.FC<{
  label: string;
  active?: boolean;
  color?: string;
}> = ({ label, active, color = MED_COLORS.GREEN }) => (
  <div className="flex items-center gap-2 text-[10px] opacity-80 uppercase tracking-tighter border-l-2 pl-2" style={{ borderColor: MED_COLORS.GRAY_LIGHT }}>
    <div
      className={`w-1.5 h-1.5 rounded-full ${active ? '' : 'animate-pulse'}`}
      style={{
        backgroundColor: active ? color : MED_COLORS.RED,
        boxShadow: active ? `0 0 5px ${color}` : 'none',
      }}
    />
    <span style={{ color: active ? MED_COLORS.TEXT : MED_COLORS.GRAY_LIGHT }}>{label}</span>
  </div>
);

/** 背景数据流 — 医疗数据关键词滚动 */
const MED_DATA_PATTERNS = [
  'Y.PESTIS', 'NODE_ID', 'PNEUMONIC', 'BUBONIC', 'SEPTICEMIC',
  'HARBIN_10', 'MANCHURIA', 'MARSEILLE', 'LONDON_65', 'VENICE_48',
  'BIO_LVL4', 'STRAIN_D', 'CFU_10K+', 'MORTALTY', 'SYS:NOM',
  'T_CELL', 'MACROPHG', 'LYMPH_N', 'TOXIN_Y', 'CAPSULE',
  'PULMONIS', 'INGUINAL', 'AXILLARY', 'CERVICAL', 'FLEA_VEC',
];

export const DataFlow: React.FC<{ color?: string }> = ({ color = MED_COLORS.BLUE }) => {
  const rows = Array.from({ length: 40 }, (_, i) => MED_DATA_PATTERNS[i % MED_DATA_PATTERNS.length]);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden font-mono text-[8px] flex justify-around p-4 select-none z-0" style={{ opacity: 0.04 }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1 data-stream" style={{ animationDelay: `${i * -2.5}s`, opacity: 0.3 + (i % 5) * 0.15 }}>
          {rows.map((text, j) => (
            <div key={j} style={{ color: j % 7 === 0 ? color : undefined }}>
              {text}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// ============================================================
// 医学风定制 HUD 组件（新增）
// ============================================================

/** 心电图式波动线 */
export const ECGLine: React.FC<{
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}> = ({ width = 200, height = 60, color = MED_COLORS.BLUE, className = '' }) => {
  const generatePath = () => {
    const points: string[] = [];
    const segW = width / 12;
    for (let i = 0; i <= 12; i++) {
      const x = i * segW;
      let y: number;
      if (i % 3 === 0) {
        y = Math.random() * height * 0.6 + height * 0.1;
      } else if (i % 3 === 1) {
        y = height * 0.9;
      } else {
        y = height * 0.15;
      }
      points.push(`${x},${y}`);
    }
    return `M${points.join(' L')}`;
  };
  return (
    <svg width={width} height={height} className={`${className} overflow-visible`}>
      <motion.path
        d={generatePath()}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.8 }}
        transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  );
};

/** 生命体征式数据面板 */
export const VitalSigns: React.FC<{
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  pulse?: boolean;
}> = ({ label, value, unit = '', color = MED_COLORS.BLUE, pulse = false }) => (
  <div className="flex flex-col items-center p-2 border" style={{ minWidth: 80, borderColor: MED_COLORS.GRAY_MID }}>
    <span className="text-[8px] uppercase tracking-wider opacity-50 mb-1" style={{ color: MED_COLORS.GRAY_LIGHT }}>{label}</span>
    <motion.span
      className="text-lg font-bold font-mono"
      style={{ color }}
      animate={pulse ? { opacity: [0.7, 1, 0.7] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {typeof value === 'number' ? value.toLocaleString() : value}
      <span className="text-[10px] ml-0.5 opacity-60">{unit}</span>
    </motion.span>
  </div>
);

/** 扫描分析进度条（CT 扫描线风格） */
export const ScanProgress: React.FC<{
  progress: number; // 0-100
  label?: string;
  color?: string;
}> = ({ progress, label = 'ANALYZING BIOSAMPLE', color = MED_COLORS.BLUE }) => (
  <div className="w-full space-y-2">
    <div className="flex justify-between text-[9px] uppercase font-bold" style={{ color }}>
      <span>{label}</span>
      <span>{Math.round(progress)}%</span>
    </div>
    <div className="relative h-3 overflow-hidden rounded-sm" style={{ backgroundColor: MED_COLORS.GRAY_DARK, border: `1px solid ${MED_COLORS.GRAY_MID}` }}>
      <motion.div
        className="h-full"
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'linear' }}
        style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}40` }}
      />
      {/* 扫描线 */}
      <motion.div
        className="absolute top-0 w-1 h-full"
        animate={{ left: ['0%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        style={{ backgroundColor: '#fff', opacity: 0.6 }}
      />
    </div>
  </div>
);

/** 顶部警报横幅 */
export const AlertBanner: React.FC<{
  message: string;
  level?: 'WARNING' | 'CRITICAL' | 'INFO';
  visible: boolean;
}> = ({ message, level = 'WARNING', visible }) => {
  const color = level === 'CRITICAL' ? MED_COLORS.RED : level === 'WARNING' ? MED_COLORS.ORANGE : MED_COLORS.BLUE;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden border-b text-center py-2 px-4 font-mono text-[10px] uppercase font-bold tracking-widest"
          style={{ backgroundColor: `${color}15`, borderColor: color, color }}
        >
          <span className="animate-pulse mr-2">⚠</span>
          [{level}] {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/** 报告分段渲染 */
export const ReportSection: React.FC<{
  title: string;
  children: React.ReactNode;
  delay?: number;
  color?: string;
}> = ({ title, children, delay = 0, color = MED_COLORS.BLUE }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="border-l-2 pl-4 py-2 mb-4"
    style={{ borderColor: color }}
  >
    <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>{title}</h3>
    <div className="text-xs leading-relaxed" style={{ color: MED_COLORS.TEXT }}>{children}</div>
  </motion.div>
);

/** 时间轴标记点 */
export const TimelineMarker: React.FC<{
  date: string;
  label: string;
  active?: boolean;
  color?: string;
  onClick?: () => void;
}> = ({ date, label, active, color = MED_COLORS.BLUE, onClick }) => (
  <div
    className="flex items-center gap-3 py-1.5 px-2 cursor-pointer transition-all duration-300 hover:bg-white/5"
    onClick={onClick}
  >
    <div
      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all ${active ? 'scale-125' : ''}`}
      style={{
        backgroundColor: active ? color : 'transparent',
        border: `2px solid ${active ? color : MED_COLORS.GRAY_LIGHT}`,
        boxShadow: active ? `0 0 8px ${color}` : 'none',
      }}
    />
    <span className="text-[9px] font-mono opacity-50 w-16 flex-shrink-0" style={{ color: MED_COLORS.GRAY_LIGHT }}>{date}</span>
    <span
      className="text-[9px] uppercase tracking-wider font-bold truncate"
      style={{ color: active ? color : MED_COLORS.GRAY_LIGHT }}
    >
      {label}
    </span>
  </div>
);

/** 页面过渡容器 */
export const PageTransition: React.FC<{
  children: React.ReactNode;
  keyValue: string;
}> = ({ children, keyValue }) => (
  <motion.div
    key={keyValue}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="h-full w-full"
  >
    {children}
  </motion.div>
);

/** 统计卡片 */
export const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
}> = ({ title, value, subtitle, color = MED_COLORS.BLUE, icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="border p-4 relative overflow-hidden group"
    style={{ borderColor: `${color}30`, backgroundColor: '#FFFFFF' }}
  >
    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color }} />
    <div className="flex items-center gap-2 mb-2">
      {/* 极简几何图标 */}
      {icon && <span style={{ color }}>{icon}</span>}
      <span className="text-[9px] uppercase tracking-wider opacity-60" style={{ color: MED_COLORS.GRAY_LIGHT }}>{title}</span>
    </div>
    <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
    {subtitle && (
      <div className="text-[9px] mt-1 opacity-40" style={{ color: MED_COLORS.GRAY_LIGHT }}>{subtitle}</div>
    )}
  </motion.div>
);

// ============================================================
// 赛博朋克可折叠标题 — 随机汉字闪烁 + 展开/收回动画
// ============================================================
const CYBER_CHARS = '鼠疫肺东北监测系统病毒死感染扩散传播数据医分析报告安全警报危机关联网节点省市区县控防治隔离消杀疫苗';

const getRandomCyberChar = () => CYBER_CHARS[Math.floor(Math.random() * CYBER_CHARS.length)];

export const CyberpunkTitle: React.FC<{
  text: string;
  subtext?: string;
  color?: string;
  className?: string;
}> = ({ text, subtext, color = MED_COLORS.BLUE, className = '' }) => {
  const chars = [...text]; // 逐字拆分（含中文、空格、数字等）
  const [phase, setPhase] = useState<'collapsed' | 'expanding' | 'glitching' | 'displayed' | 'deleting'>('collapsed');
  const [displayMap, setDisplayMap] = useState<Record<number, string>>({}); // index → current char
  const [visibleCount, setVisibleCount] = useState(0); // 当前可见字符数
  const [isHovered, setIsHovered] = useState(false);
  const hoverRef = useRef(false);
  const timersRef = useRef<Array<() => void>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullWidthRef = useRef(320);

  // 测量完整宽度
  useEffect(() => {
    // 用临时不可见元素测量
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.visibility = 'hidden';
    el.style.whiteSpace = 'nowrap';
    el.style.fontSize = '13px';
    el.style.fontWeight = '700';
    el.style.fontFamily = "'JetBrains Mono','SimHei',monospace";
    el.style.letterSpacing = '0.05em';
    el.style.textTransform = 'uppercase';
    el.textContent = text;
    document.body.appendChild(el);
    fullWidthRef.current = Math.ceil(el.offsetWidth) + 28; // padding
    if (subtext) {
      const el2 = document.createElement('div');
      el2.style.position = 'absolute';
      el2.style.visibility = 'hidden';
      el2.style.fontSize = '8px';
      el2.style.fontFamily = "'JetBrains Mono','SimHei',monospace";
      el2.style.textTransform = 'uppercase';
      el2.textContent = subtext;
      document.body.appendChild(el2);
      fullWidthRef.current = Math.max(fullWidthRef.current, Math.ceil(el2.offsetWidth) + 28);
      document.body.removeChild(el2);
    }
    document.body.removeChild(el);
  }, [text, subtext]);

  // 清理所有计时器
  const clearAllTimers = () => {
    timersRef.current.forEach(fn => fn());
    timersRef.current = [];
  };

  // 设置超时（自动追踪）
  const setTimer = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(() => clearTimeout(t));
    return t;
  };

  // 展开：边框从左往右展开
  const doExpand = () => {
    clearAllTimers();
    setPhase('expanding');
    setVisibleCount(0);
    setDisplayMap({});
    // expanding 阶段 350ms 后开始逐字浮现
    setTimer(() => doGlitch(0), 350);
  };

  // 逐字浮现（随机汉字闪烁）
  const doGlitch = (idx: number) => {
    if (idx >= chars.length) {
      setPhase('displayed');
      // 如果鼠标不在上面，开始倒计时收回
      if (!hoverRef.current) {
        setTimer(() => {
          if (!hoverRef.current) doDelete();
        }, 4000);
      }
      return;
    }
    setPhase('glitching');
    setVisibleCount(idx + 1);

    // 随机闪烁 2-3 次后定格
    let flashes = 0;
    const maxFlashes = 2 + Math.floor(Math.random() * 2);
    const flashInterval = setInterval(() => {
      setDisplayMap(prev => ({ ...prev, [idx]: getRandomCyberChar() }));
      flashes++;
      if (flashes >= maxFlashes) {
        clearInterval(flashInterval);
        setDisplayMap(prev => ({ ...prev, [idx]: chars[idx] }));
        setTimer(() => doGlitch(idx + 1), 40 + Math.random() * 50);
      }
    }, 60);
    timersRef.current.push(() => clearInterval(flashInterval));
  };

  // 收回：从右往左逐字删除
  const doDelete = () => {
    clearAllTimers();
    setPhase('deleting');
    let count = chars.length;
    const deleteInterval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(deleteInterval);
        setVisibleCount(0);
        setDisplayMap({});
        setPhase('collapsed');
      } else {
        // 删除前简短闪烁
        setDisplayMap(prev => ({ ...prev, [count]: getRandomCyberChar() }));
        setTimeout(() => {
          setDisplayMap(prev => {
            const next = { ...prev };
            delete next[count];
            return next;
          });
          setVisibleCount(count);
        }, 40);
      }
    }, 70);
    timersRef.current.push(() => clearInterval(deleteInterval));
  };

  // 初始自动展开
  useEffect(() => {
    setTimer(() => doExpand(), 600);
    return () => clearAllTimers();
  }, []);

  // 鼠标事件
  const handleMouseEnter = () => {
    hoverRef.current = true;
    setIsHovered(true);
    if (phase === 'collapsed') {
      doExpand();
    } else if (phase === 'deleting') {
      // 正在删除中被打断，重新展开
      clearAllTimers();
      doExpand();
    }
  };

  const handleMouseLeave = () => {
    hoverRef.current = false;
    setIsHovered(false);
    if (phase === 'displayed') {
      setTimer(() => {
        if (!hoverRef.current) doDelete();
      }, 2500);
    }
  };

  // 切角边框 clipPath（左上 + 右下 6px 45° 斜切）
  const chamferClip = `polygon(
    6px 0,
    100% 0,
    100% calc(100% - 6px),
    calc(100% - 6px) 100%,
    0 100%,
    0 6px
  )`;

  // 折叠/展开宽度
  const collapsedW = 36;
  const expandedW = fullWidthRef.current;
  const currentW = phase === 'collapsed' ? collapsedW : expandedW;

  return (
    <div
      ref={containerRef}
      className={`absolute z-[1000] ${className}`}
      style={{ top: 24, left: 24 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 外部发光层（展开时） */}
      {(phase === 'expanding' || phase === 'glitching' || phase === 'displayed' || phase === 'deleting') && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: '5px',
            boxShadow: `0 0 12px ${color}30, 0 0 24px ${color}08`,
            opacity: phase === 'displayed' ? 1 : 0.5,
            transition: 'opacity 0.3s',
          }}
        />
      )}

      {/* 切角边框容器 */}
      <div
        className="relative overflow-hidden"
        style={{
          width: currentW,
          borderRadius: '5px',
          transition: 'width 0.35s cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
      >
        {/* 背景 */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(245,247,250,0.94)',
            backdropFilter: 'blur(12px)',
            clipPath: chamferClip,
          }}
        />

        {/* 切角边框线 + 内层双线 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            clipPath: chamferClip,
            border: `1px solid ${phase === 'collapsed' ? MED_COLORS.GRAY_LIGHT : color}`,
            boxShadow: `inset 0 0 0 1px ${phase === 'collapsed' ? MED_COLORS.GRAY_LIGHT : color}40`,
            borderRadius: '5px',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
        />

        {/* 折叠状态小蓝点 */}
        {phase === 'collapsed' && (
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: 6, height: 6,
              backgroundColor: color,
              borderRadius: '50%',
              boxShadow: `0 0 6px ${color}`,
              animation: 'pulse-blue 1.5s ease-in-out infinite',
            }}
          />
        )}

        {/* 文字内容 */}
        <div
          className="relative py-[5px] px-[14px] whitespace-nowrap select-none"
          style={{ minWidth: expandedW }}
        >
          {/* 主标题 */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.05em',
              fontFamily: "'JetBrains Mono','SimHei',monospace",
            }}
          >
            {phase === 'collapsed'
              ? ''
              : chars.map((ch, i) => {
                  if (i >= visibleCount) return null;
                  const displayed = displayMap[i] ?? ch;
                  const isGlitch = displayed !== ch;
                  return (
                    <span
                      key={i}
                      style={{
                        opacity: isGlitch ? 0.6 : 1,
                        transition: 'opacity 0.05s',
                      }}
                    >
                      {displayed}
                    </span>
                  );
                })}
          </div>

          {/* 副标题（展开时显示） */}
          {subtext && visibleCount >= chars.length && phase === 'displayed' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 0.3 }}
              style={{
                fontSize: 8,
                color: MED_COLORS.GRAY_LIGHT,
                textTransform: 'uppercase' as const,
                marginTop: 2,
              }}
            >
              {subtext}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 赛博朋克可折叠面板 — 与 CyberpunkTitle 统一视觉语言
// 医疗白底 + 蓝灰配色 + 切角边框 + 微弱光晕
// 鼠标悬浮 → 面板展开，标题逐字打出（随机字符闪烁后定格，同 Title）
// 鼠标离开 → 标题逐字删除（每字删前短暂闪烁为随机汉字）→ 面板收起
// ============================================================
export const CyberpunkPanel: React.FC<{
  title: string;
  color?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  /** 始终展开，不自动折叠 */
  persistent?: boolean;
  /** 折叠时显示的内容（替换默认脉冲点） */
  collapsedContent?: React.ReactNode;
}> = ({ title, color = MED_COLORS.BLUE, children, style, persistent = false, collapsedContent }) => {
  const chars = [...title];
  const [phase, setPhase] = useState<'collapsed' | 'expanding' | 'glitching' | 'displayed' | 'deleting'>(
    persistent ? 'displayed' : 'collapsed'
  );
  const [displayMap, setDisplayMap] = useState<Record<number, string>>({});
  const [visibleCount, setVisibleCount] = useState(
    persistent ? chars.length : 0
  );
  const hoverRef = useRef(false);
  const timersRef = useRef<Array<() => void>>([]);

  const isExpanded = persistent || phase !== 'collapsed';
  const contentVisible = persistent || phase === 'displayed';

  const clearAllTimers = () => { timersRef.current.forEach(fn => fn()); timersRef.current = []; };
  const setTimer = (fn: () => void, ms: number) => { const t = setTimeout(fn, ms); timersRef.current.push(() => clearTimeout(t)); return t; };

  // 逐字浮现 — 每字先闪烁为随机汉字 2~3 次后定格
  const doGlitch = (idx: number) => {
    if (idx >= chars.length) {
      setPhase('displayed');
      // 初始自动展开后，若鼠标不在面板上则定时收回
      if (!persistent && !hoverRef.current) {
        setTimer(() => { if (!hoverRef.current) doDelete(); }, 3000);
      }
      return;
    }
    setPhase('glitching');
    setVisibleCount(idx + 1);
    let flashes = 0;
    const maxFlashes = 2 + Math.floor(Math.random() * 2);
    const flashInterval = setInterval(() => {
      setDisplayMap(prev => ({ ...prev, [idx]: getRandomCyberChar() }));
      flashes++;
      if (flashes >= maxFlashes) {
        clearInterval(flashInterval);
        setDisplayMap(prev => ({ ...prev, [idx]: chars[idx] }));
        setTimer(() => doGlitch(idx + 1), 40 + Math.random() * 50);
      }
    }, 60);
    timersRef.current.push(() => clearInterval(flashInterval));
  };

  const doExpand = () => {
    clearAllTimers();
    setPhase('expanding');
    setVisibleCount(0);
    setDisplayMap({});
    setTimer(() => doGlitch(0), 350);
  };

  // 逐字删除 — 每字删前短暂闪烁为随机汉字（快速删除）
  const doDelete = () => {
    if (persistent) return;
    clearAllTimers();
    setPhase('deleting');
    let count = chars.length;
    const deleteInterval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(deleteInterval);
        setVisibleCount(0);
        setDisplayMap({});
        setPhase('collapsed');
      } else {
        setDisplayMap(prev => ({ ...prev, [count]: getRandomCyberChar() }));
        setTimeout(() => {
          setDisplayMap(prev => { const next = { ...prev }; delete next[count]; return next; });
          setVisibleCount(count);
        }, 30);
      }
    }, 40);
    timersRef.current.push(() => clearInterval(deleteInterval));
  };

  // 初始自动展开
  useEffect(() => {
    if (!persistent) {
      setTimer(() => doExpand(), 400);
    }
    return () => clearAllTimers();
  }, []);

  const handleMouseEnter = () => {
    hoverRef.current = true;
    if (phase === 'collapsed') doExpand();
    else if (phase === 'deleting') { clearAllTimers(); doExpand(); }
  };

  const handleMouseLeave = () => {
    hoverRef.current = false;
    if (phase === 'displayed' || phase === 'glitching') {
      setTimer(() => { if (!hoverRef.current) doDelete(); }, 800);
    }
  };

  const chamferClip = `polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)`;

  return (
    <div
      style={{ ...style, position: 'absolute', zIndex: 1000 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 外部光晕层（展开时）— 与 CyberpunkTitle 相同 */}
      {(phase === 'expanding' || phase === 'glitching' || phase === 'displayed' || phase === 'deleting') && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: '5px',
            boxShadow: `0 0 12px ${color}30, 0 0 24px ${color}08`,
            opacity: phase === 'displayed' ? 1 : 0.5,
            transition: 'opacity 0.3s',
          }}
        />
      )}

      <div className="relative" style={{ borderRadius: '5px', overflow: 'hidden' }}>
        {/* 医疗白底 — 与 CyberpunkTitle 完全相同 */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(245,247,250,0.94)',
            backdropFilter: 'blur(12px)',
            clipPath: chamferClip,
          }}
        />

        {/* 切角双线边框 — 与 CyberpunkTitle 完全相同 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            clipPath: chamferClip,
            border: `1px solid ${phase === 'collapsed' ? MED_COLORS.GRAY_LIGHT : color}`,
            boxShadow: `inset 0 0 0 1px ${phase === 'collapsed' ? MED_COLORS.GRAY_LIGHT : color}40`,
            borderRadius: '5px',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
        />

        {/* 折叠态：自定义内容 或 脉冲小圆点 */}
        {phase === 'collapsed' && (
          collapsedContent ? (
            <div style={{ padding: '5px 10px' }}>
              {collapsedContent}
            </div>
          ) : (
            <div className="flex items-center justify-center" style={{ width: 32, height: 32 }}>
              <div style={{
                width: 6, height: 6,
                backgroundColor: color,
                borderRadius: '50%',
                boxShadow: `0 0 6px ${color}`,
                animation: 'pulse-blue 1.5s ease-in-out infinite',
              }} />
            </div>
          )
        )}

        {/* 展开态：标题 + 内容 — position:relative 确保在绝对定位背景之上 */}
        {isExpanded && (
          <div style={{ position: 'relative', zIndex: 1, padding: '8px 12px', minWidth: 160 }}>
            {/* 标题 — 逐字 glitch 闪烁（与 CyberpunkTitle 完全一致） */}
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
              fontFamily: "'JetBrains Mono','SimHei',monospace",
              marginBottom: contentVisible ? 8 : 0,
            }}>
              {chars.map((ch, i) => {
                if (i >= visibleCount) return null;
                const displayed = displayMap[i] ?? ch;
                return (
                  <span key={i} style={{
                    opacity: displayed !== ch ? 0.55 : 1,
                    transition: 'opacity 0.04s',
                  }}>
                    {displayed}
                  </span>
                );
              })}
            </div>

            {/* 内容区 — 标题完全露出后淡入 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: contentVisible ? 1 : 0 }}
              transition={{ duration: 0.35 }}
              style={{ pointerEvents: contentVisible ? 'auto' : 'none' }}
            >
              {children}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};
