import React from 'react';
import { CyberpunkPanel } from './HUD';
import { MED_COLORS } from '../constants';

const SPEED_OPTIONS = [1, 2, 4, 8] as const;

interface PlaybackControlsProps {
  isPlaying: boolean;
  speed: number;
  hasReachedEnd: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  onSetSpeed: (speed: number) => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  speed,
  hasReachedEnd,
  onTogglePlay,
  onRestart,
  onSetSpeed,
}) => {
  return (
    <CyberpunkPanel
      title="播放控制"
      color={MED_COLORS.BLUE}
      style={{ bottom: 24, left: '50%', transform: 'translateX(-50%)' }}
      persistent
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: "'JetBrains Mono', 'Consolas', 'SimHei', monospace",
        fontSize: 13,
        userSelect: 'none',
      }}>
        {/* 播放/暂停按钮 */}
        <ControlButton
          onClick={onTogglePlay}
          color={hasReachedEnd ? MED_COLORS.ORANGE : (isPlaying ? MED_COLORS.RED : MED_COLORS.GREEN)}
          label={hasReachedEnd ? '↻ 重播' : (isPlaying ? '■ 暂停' : '▶ 播放')}
        />

        {/* 分隔线 */}
        <div style={{ width: 1, height: 18, backgroundColor: MED_COLORS.GRAY_DARK }} />

        {/* 重播按钮 */}
        <ControlButton
          onClick={onRestart}
          color={MED_COLORS.GRAY_LIGHT}
          label="↺ 重置"
        />

        {/* 分隔线 */}
        <div style={{ width: 1, height: 18, backgroundColor: MED_COLORS.GRAY_DARK }} />

        {/* 速度选择 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: MED_COLORS.GRAY_LIGHT, marginRight: 2 }}>
            SPEED
          </span>
          {SPEED_OPTIONS.map(opt => (
            <SpeedChip
              key={opt}
              speed={opt}
              active={speed === opt}
              onClick={() => onSetSpeed(opt)}
            />
          ))}
        </div>
      </div>
    </CyberpunkPanel>
  );
};

// ---- 按钮子组件 ----
const ControlButton: React.FC<{
  onClick: () => void;
  color: string;
  label: string;
}> = ({ onClick, color, label }) => (
  <div
    onClick={onClick}
    style={{
      padding: '4px 10px',
      cursor: 'pointer',
      border: `1px solid ${color}40`,
      color,
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
      transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', gap: 4,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = `${color}15`;
      e.currentTarget.style.borderColor = color;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.borderColor = `${color}40`;
    }}
  >
    {label}
  </div>
);

// ---- 速度选择芯片 ----
const SpeedChip: React.FC<{
  speed: number;
  active: boolean;
  onClick: () => void;
}> = ({ speed, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: '3px 6px',
      cursor: 'pointer',
      border: `1px solid ${active ? MED_COLORS.BLUE : MED_COLORS.GRAY_MID}`,
      backgroundColor: active ? `${MED_COLORS.BLUE}15` : 'transparent',
      color: active ? MED_COLORS.BLUE : MED_COLORS.GRAY_LIGHT,
      fontWeight: active ? 700 : 400,
      fontSize: 12,
      letterSpacing: '0.05em',
      transition: 'all 0.15s',
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.borderColor = MED_COLORS.BLUE;
        e.currentTarget.style.color = MED_COLORS.BLUE;
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.borderColor = MED_COLORS.GRAY_MID;
        e.currentTarget.style.color = MED_COLORS.GRAY_LIGHT;
      }
    }}
  >
    {speed}x
  </div>
);

export default PlaybackControls;
