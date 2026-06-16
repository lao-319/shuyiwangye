import React, { useState, useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { MED_COLORS } from '../constants';

// ============================================================
// 缩放控制面板
// - 左侧垂直居中定位
// - 切角边框 + 医疗白底 + 蓝色主题
// - +/- 按钮 + 缩放等级指示器
// - 放在 MapContainer 内部，使用 useMap() hook
// ============================================================

// 45° 切角 clipPath（与 CyberpunkPanel 一致）
const chamferClip = `polygon(
  6px 0,
  100% 0,
  100% calc(100% - 6px),
  calc(100% - 6px) 100%,
  0 100%,
  0 6px
)`;

const btnBase: React.CSSProperties = {
  width: 32,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 700,
  fontFamily: "'JetBrains Mono', 'Consolas', monospace",
  color: MED_COLORS.BLUE,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  transition: 'all 0.2s ease',
  userSelect: 'none',
};

const ZoomControl: React.FC = () => {
  const map = useMap();
  const [zoom, setZoom] = useState(() => Math.round(map.getZoom()));

  useEffect(() => {
    const onZoom = () => setZoom(Math.round(map.getZoom()));
    map.on('zoomend', onZoom);
    return () => { map.off('zoomend', onZoom); };
  }, [map]);

  const zoomIn = useCallback(() => {
    if (zoom < (map.getMaxZoom() || 12)) {
      map.zoomIn();
    }
  }, [map, zoom]);

  const zoomOut = useCallback(() => {
    if (zoom > (map.getMinZoom() || 3)) {
      map.zoomOut();
    }
  }, [map, zoom]);

  const maxZoom = map.getMaxZoom() || 12;
  const minZoom = map.getMinZoom() || 3;
  const canZoomIn = zoom < maxZoom;
  const canZoomOut = zoom > minZoom;

  return (
    <div
      className="zoom-control-panel"
      style={{
        position: 'absolute',
        left: 20,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1000,
        width: 42,
      }}
    >
      {/* 外部光晕 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 5,
          boxShadow: `0 0 12px ${MED_COLORS.BLUE}15, 0 0 24px ${MED_COLORS.BLUE}04`,
          pointerEvents: 'none',
        }}
      />

      {/* 主面板 */}
      <div style={{ position: 'relative', borderRadius: 5, overflow: 'hidden' }}>
        {/* 医疗白底 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(245,247,250,0.94)',
            backdropFilter: 'blur(12px)',
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

        {/* 内容区 */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '4px 0',
          }}
        >
          {/* 放大按钮 */}
          <button
            style={{
              ...btnBase,
              opacity: canZoomIn ? 1 : 0.3,
              cursor: canZoomIn ? 'pointer' : 'default',
            }}
            onClick={zoomIn}
            disabled={!canZoomIn}
            onMouseEnter={(e) => {
              if (canZoomIn) e.currentTarget.style.background = `${MED_COLORS.BLUE}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            +
          </button>

          {/* 分隔线 + 缩放等级 */}
          <div
            style={{
              width: '60%',
              height: 1,
              backgroundColor: `${MED_COLORS.GRAY_MID}60`,
              margin: '2px 0',
            }}
          />

          <div
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: MED_COLORS.BLUE,
              fontFamily: "'JetBrains Mono', 'Consolas', monospace",
              letterSpacing: '0.05em',
              padding: '2px 0',
            }}
          >
            {zoom}
          </div>

          {/* 分隔线 */}
          <div
            style={{
              width: '60%',
              height: 1,
              backgroundColor: `${MED_COLORS.GRAY_MID}60`,
              margin: '2px 0',
            }}
          />

          {/* 缩小按钮 */}
          <button
            style={{
              ...btnBase,
              opacity: canZoomOut ? 1 : 0.3,
              cursor: canZoomOut ? 'pointer' : 'default',
            }}
            onClick={zoomOut}
            disabled={!canZoomOut}
            onMouseEnter={(e) => {
              if (canZoomOut) e.currentTarget.style.background = `${MED_COLORS.BLUE}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZoomControl;
