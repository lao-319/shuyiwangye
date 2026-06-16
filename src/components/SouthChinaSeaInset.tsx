import React from 'react';
import { MED_COLORS } from '../constants';
import { useMouseTilt } from './HUD';

// ============================================================
// 南海诸岛缩略图
// - 右下角定位，静态 SVG 叠层
// - 切角边框 + 医疗白底
// - 逆变换抵消 ParallaxWrapper 倾斜
// ============================================================

const chamferClip = `polygon(
  6px 0,
  100% 0,
  100% calc(100% - 6px),
  calc(100% - 6px) 100%,
  0 100%,
  0 6px
)`;

const SouthChinaSeaInset: React.FC = () => {
  const tilt = useMouseTilt();
  const inverseTransform = (tilt.x !== 0 || tilt.y !== 0)
    ? `perspective(1000px) rotateX(${-tilt.x}deg) rotateY(${-tilt.y}deg)`
    : 'none';

  return (
    <div
      className="south-china-sea-inset"
      style={{
        position: 'absolute',
        bottom: 100,
        right: 24,
        zIndex: 500,
        width: 170,
        transition: 'transform 0.3s ease-out',
        transform: inverseTransform,
      }}
    >
      {/* 外部光晕 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 5,
          boxShadow: `0 0 12px ${MED_COLORS.BLUE}10, 0 0 24px ${MED_COLORS.BLUE}04`,
          pointerEvents: 'none',
        }}
      />

      {/* 主容器 */}
      <div style={{ position: 'relative', borderRadius: 5, overflow: 'hidden' }}>
        {/* 医疗白底 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(245,247,250,0.94)',
            backdropFilter: 'blur(8px)',
            clipPath: chamferClip,
          }}
        />

        {/* 切角边框 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: chamferClip,
            border: `1px solid ${MED_COLORS.GRAY_MID}`,
            boxShadow: `inset 0 0 0 1px ${MED_COLORS.GRAY_MID}40`,
            borderRadius: 5,
            pointerEvents: 'none',
          }}
        />

        {/* SVG 缩略图 */}
        <div style={{ position: 'relative', zIndex: 1, padding: 5 }}>
          <img
            src="/data/south_china_sea.svg"
            alt="南海诸岛"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />

          {/* 底部标签 */}
          <div
            style={{
              textAlign: 'center',
              fontSize: 7,
              fontWeight: 700,
              color: MED_COLORS.GRAY_LIGHT,
              fontFamily: "'JetBrains Mono', 'Consolas', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginTop: 2,
            }}
          >
            南海诸岛
          </div>
        </div>
      </div>
    </div>
  );
};

export default SouthChinaSeaInset;
