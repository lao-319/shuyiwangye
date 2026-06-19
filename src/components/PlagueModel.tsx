import React from 'react';
import { motion } from 'framer-motion';
import { MED_COLORS } from '../constants';

export interface PlagueModelProps {
  size?: number;
  className?: string;
}

/**
 * Y. pestis 鼠疫杆菌科幻风格 SVG 模型
 * 视觉层次：外发光光晕 → 荚膜（虚线旋转）→ 外膜（极染效果渐变）
 * → 周质空间 → 细胞质 → DNA螺旋（绿色发光）→ 质粒环（橙色自转）
 * → 菌毛 → 表面蛋白点 → 两端极染高亮
 */
const PlagueModel: React.FC<PlagueModelProps> = ({ size = 300, className = '' }) => {
  const vbW = 280;
  const vbH = 420;
  const cx = vbW / 2;
  const cy = vbH / 2;
  const rx = 58;
  const ry = 140;

  // 浮动的整体容器
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: size, height: size * (vbH / vbW), pointerEvents: 'none' }}
    >
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        width="100%"
        height="100%"
        style={{ filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.15))' }}
      >
        <defs>
          {/* 蓝色辉光滤镜 */}
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 强辉光滤镜 */}
          <filter id="glow-strong" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 绿色辉光 (DNA) */}
          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 外膜渐变 — 极染效果（两端紫蓝、中间浅蓝） */}
          <linearGradient id="membrane-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={MED_COLORS.VIOLET} stopOpacity="0.9" />
            <stop offset="12%" stopColor={MED_COLORS.BLUE} stopOpacity="0.7" />
            <stop offset="35%" stopColor="#60A5FA" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#93C5FD" stopOpacity="0.2" />
            <stop offset="65%" stopColor="#60A5FA" stopOpacity="0.35" />
            <stop offset="88%" stopColor={MED_COLORS.BLUE} stopOpacity="0.7" />
            <stop offset="100%" stopColor={MED_COLORS.VIOLET} stopOpacity="0.9" />
          </linearGradient>

          {/* 外光晕径向渐变 */}
          <radialGradient id="aura-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={MED_COLORS.BLUE} stopOpacity="0.15" />
            <stop offset="60%" stopColor={MED_COLORS.BLUE} stopOpacity="0.04" />
            <stop offset="100%" stopColor={MED_COLORS.BLUE} stopOpacity="0" />
          </radialGradient>

          {/* 极染端部辉光 */}
          <radialGradient id="pole-grad-top" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={MED_COLORS.VIOLET} stopOpacity="0.7" />
            <stop offset="40%" stopColor={MED_COLORS.BLUE} stopOpacity="0.3" />
            <stop offset="100%" stopColor={MED_COLORS.BLUE} stopOpacity="0" />
          </radialGradient>

          <radialGradient id="pole-grad-bottom" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={MED_COLORS.VIOLET} stopOpacity="0.7" />
            <stop offset="40%" stopColor={MED_COLORS.BLUE} stopOpacity="0.3" />
            <stop offset="100%" stopColor={MED_COLORS.BLUE} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ============================================================ */}
        {/* 第 1 层：外发光光晕（脉冲） */}
        {/* ============================================================ */}
        <ellipse
          cx={cx} cy={cy}
          rx={rx + 28} ry={ry + 28}
          fill="url(#aura-grad)"
        >
          <animate
            attributeName="opacity"
            values="0.4;1;0.4"
            dur="3s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* ============================================================ */}
        {/* 第 2 层：荚膜层（虚线，缓慢旋转） */}
        {/* ============================================================ */}
        <ellipse
          cx={cx} cy={cy}
          rx={rx + 14} ry={ry + 14}
          fill="none"
          stroke={MED_COLORS.BLUE}
          strokeWidth="0.8"
          strokeDasharray="6 5"
          opacity="0.35"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${cx} ${cy}`}
            to={`360 ${cx} ${cy}`}
            dur="50s"
            repeatCount="indefinite"
          />
        </ellipse>

        <ellipse
          cx={cx} cy={cy}
          rx={rx + 20} ry={ry + 20}
          fill="none"
          stroke={MED_COLORS.BLUE}
          strokeWidth="0.5"
          strokeDasharray="10 8"
          opacity="0.2"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`360 ${cx} ${cy}`}
            to={`0 ${cx} ${cy}`}
            dur="35s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* ============================================================ */}
        {/* 第 3 层：外膜（线性渐变 + 极染效果） */}
        {/* ============================================================ */}
        <ellipse
          cx={cx} cy={cy}
          rx={rx} ry={ry}
          fill="url(#membrane-grad)"
          stroke={MED_COLORS.BLUE}
          strokeWidth="2"
          filter="url(#glow-blue)"
          opacity="0.85"
        />

        {/* 外膜内边框双线效果 */}
        <ellipse
          cx={cx} cy={cy}
          rx={rx - 2} ry={ry - 2}
          fill="none"
          stroke={MED_COLORS.BLUE}
          strokeWidth="0.4"
          opacity="0.5"
        />

        {/* ============================================================ */}
        {/* 第 4 层：周质空间（虚线椭圆） */}
        {/* ============================================================ */}
        <ellipse
          cx={cx} cy={cy}
          rx={rx - 12} ry={ry - 12}
          fill="none"
          stroke="#60A5FA"
          strokeWidth="0.6"
          strokeDasharray="3 7"
          opacity="0.4"
        />

        {/* ============================================================ */}
        {/* 第 5 层：细胞质（微弱填充） */}
        {/* ============================================================ */}
        <ellipse
          cx={cx} cy={cy}
          rx={rx - 16} ry={ry - 16}
          fill="rgba(59,130,246,0.06)"
          stroke={MED_COLORS.BLUE}
          strokeWidth="0.4"
          opacity="0.5"
        />

        {/* ============================================================ */}
        {/* 第 6 层：DNA 双螺旋（绿色发光，连续流动） */}
        {/* ============================================================ */}
        <g filter="url(#glow-green)" opacity="0.7">
          {/* 螺旋线 1 */}
          <path
            d={`M${cx - 12},${cy - ry + 50} Q${cx + 30},${cy - ry + 80} ${cx - 12},${cy - ry + 110} Q${cx + 30},${cy - ry + 140} ${cx - 12},${cy - ry + 170} Q${cx + 30},${cy - ry + 200} ${cx - 12},${cy - ry + 230}`}
            fill="none"
            stroke={MED_COLORS.GREEN}
            strokeWidth="1.2"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="100;0"
              dur="2s"
              repeatCount="indefinite"
            />
          </path>
          {/* 螺旋线 2（交错） */}
          <path
            d={`M${cx + 12},${cy - ry + 50} Q${cx - 30},${cy - ry + 80} ${cx + 12},${cy - ry + 110} Q${cx - 30},${cy - ry + 140} ${cx + 12},${cy - ry + 170} Q${cx - 30},${cy - ry + 200} ${cx + 12},${cy - ry + 230}`}
            fill="none"
            stroke={MED_COLORS.GREEN}
            strokeWidth="1.2"
            strokeDasharray="100"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="-100;0"
              dur="2s"
              repeatCount="indefinite"
            />
          </path>
          {/* 连接横档 */}
          {[80, 110, 140, 170, 200, 230].map((yOff, i) => (
            <line
              key={i}
              x1={cx - 12}
              y1={cy - ry + yOff}
              x2={cx + 12}
              y2={cy - ry + yOff}
              stroke={MED_COLORS.GREEN}
              strokeWidth="0.6"
              opacity="0.5"
            />
          ))}
        </g>

        {/* ============================================================ */}
        {/* 第 7 层：质粒环（3 个小圆环，自转） */}
        {/* ============================================================ */}
        {[
          { cx: cx - 18, cy: cy - 45, r: 11, delay: 0 },
          { cx: cx + 16, cy: cy - 10, r: 9, delay: 1.5 },
          { cx: cx - 14, cy: cy + 35, r: 10, delay: 3 },
          { cx: cx + 14, cy: cy + 55, r: 8, delay: 1 },
        ].map((plasmid, i) => (
          <g key={`plasmid-${i}`}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${plasmid.cx} ${plasmid.cy}`}
              to={`360 ${plasmid.cx} ${plasmid.cy}`}
              dur={`${6 + i * 2}s`}
              repeatCount="indefinite"
            />
            <circle
              cx={plasmid.cx}
              cy={plasmid.cy}
              r={plasmid.r}
              fill="none"
              stroke={MED_COLORS.ORANGE}
              strokeWidth="0.8"
              strokeDasharray={`${Math.PI * plasmid.r * 0.7} ${Math.PI * plasmid.r * 0.3}`}
              opacity="0.5"
            />
            <circle
              cx={plasmid.cx}
              cy={plasmid.cy}
              r={1.5}
              fill={MED_COLORS.ORANGE}
              opacity="0.7"
            />
          </g>
        ))}

        {/* ============================================================ */}
        {/* 第 8 层：菌毛（两侧辐射短线条） */}
        {/* ============================================================ */}
        {Array.from({ length: 14 }).map((_, i) => {
          const t = (i / 14) * 0.7 + 0.15; // 0.15 ~ 0.85 沿菌体分布
          const y = cy - ry + t * (2 * ry);
          const isLeft = i % 2 === 0;
          const xBase = isLeft ? cx - rx : cx + rx;
          const xEnd = isLeft ? xBase - 14 - Math.random() * 10 : xBase + 14 + Math.random() * 10;
          const yEnd = y + (Math.random() - 0.5) * 16;
          return (
            <line
              key={`pilus-${i}`}
              x1={xBase}
              y1={y}
              x2={xEnd}
              y2={yEnd}
              stroke={MED_COLORS.BLUE}
              strokeWidth="0.4"
              opacity="0.3"
            />
          );
        })}

        {/* ============================================================ */}
        {/* 第 9 层：表面蛋白点（沿外膜分布） */}
        {/* ============================================================ */}
        {Array.from({ length: 18 }).map((_, i) => {
          const angle = (i / 18) * Math.PI * 2;
          const px = cx + (rx - 2) * Math.cos(angle);
          const py = cy + (ry - 2) * Math.sin(angle);
          const glowing = i % 3 === 0;
          return (
            <circle
              key={`protein-${i}`}
              cx={px}
              cy={py}
              r={glowing ? 1.8 : 1}
              fill={glowing ? MED_COLORS.BLUE : MED_COLORS.GRAY_LIGHT}
              opacity={glowing ? 0.8 : 0.35}
              filter={glowing ? 'url(#glow-blue)' : undefined}
            >
              {glowing && (
                <animate
                  attributeName="opacity"
                  values="0.4;0.9;0.4"
                  dur={`${1.5 + (i % 3) * 0.8}s`}
                  repeatCount="indefinite"
                />
              )}
            </circle>
          );
        })}

        {/* ============================================================ */}
        {/* 第 10 层：两端极染高亮（安全别针形态） */}
        {/* ============================================================ */}
        {/* 顶端 */}
        <ellipse
          cx={cx} cy={cy - ry + 8}
          rx={18} ry={22}
          fill="url(#pole-grad-top)"
          filter="url(#glow-strong)"
        >
          <animate
            attributeName="opacity"
            values="0.4;0.8;0.4"
            dur="2s"
            repeatCount="indefinite"
          />
        </ellipse>
        {/* 底端 */}
        <ellipse
          cx={cx} cy={cy + ry - 8}
          rx={18} ry={22}
          fill="url(#pole-grad-bottom)"
          filter="url(#glow-strong)"
        >
          <animate
            attributeName="opacity"
            values="0.4;0.8;0.4"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* ============================================================ */}
        {/* 标签 */}
        {/* ============================================================ */}
        <text
          x={cx}
          y={cy + ry + 30}
          textAnchor="middle"
          fill={MED_COLORS.GRAY_LIGHT}
          fontSize="10"
          fontFamily="'JetBrains Mono','SimHei',monospace"
          fontWeight="700"
          letterSpacing="0.15em"
          opacity="0.7"
        >
          Y. PESTIS
        </text>
        <text
          x={cx}
          y={cy + ry + 46}
          textAnchor="middle"
          fill={MED_COLORS.GRAY_LIGHT}
          fontSize="7"
          fontFamily="'JetBrains Mono','SimHei',monospace"
          letterSpacing="0.1em"
          opacity="0.4"
        >
          GRAM-NEGATIVE // BACILLUS
        </text>
      </svg>
    </motion.div>
  );
};

export default PlagueModel;
