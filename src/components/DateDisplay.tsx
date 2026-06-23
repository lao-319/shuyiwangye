import React, { useMemo } from 'react';
import { CyberpunkPanel } from './HUD';
import { MED_COLORS } from '../constants';
import { formatDateDisplay, formatDateEn, dateToEpoch } from '../utils/dateUtils';
import type { FeatureCollection } from 'geojson';
import type { RegionProperties } from '../constants';

interface DateDisplayProps {
  currentDate: string;        // M.DD 格式
  frameIndex: number;
  totalFrames: number;
  progress: number;
  isPlaying: boolean;
  hasReachedEnd: boolean;
  regions: FeatureCollection | null;
  visibleEpochs: Set<number>;
}

const DateDisplay: React.FC<DateDisplayProps> = ({
  currentDate,
  frameIndex,
  totalFrames,
  progress,
  isPlaying,
  hasReachedEnd,
  regions,
  visibleEpochs,
}) => {
  // 动态统计
  const stats = useMemo(() => {
    if (!regions) return { affectedCount: 0, cumulativeDeaths: 0 };
    let affectedCount = 0;
    let cumulativeDeaths = 0;
    for (const feature of regions.features) {
      const props = feature.properties as RegionProperties | undefined;
      const raw = props?.first_date;
      let epoch: number | null = null;
      if (raw && raw.trim() !== '') {
        epoch = dateToEpoch(raw);
      }
      if (epoch === null || visibleEpochs.has(epoch)) {
        affectedCount++;
        cumulativeDeaths += (props?.deaths ?? 0);
      }
    }
    return { affectedCount, cumulativeDeaths };
  }, [regions, visibleEpochs]);

  const cnDate = formatDateDisplay(currentDate);
  const enDate = formatDateEn(currentDate);

  // 折叠态：脉冲点 + 时间文字（中英文双行，始终可见）
  const collapsedContent = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontFamily: "'JetBrains Mono','SimHei',monospace",
    }}>
      {/* 红色脉冲指示灯 */}
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        backgroundColor: MED_COLORS.RED,
        boxShadow: `0 0 5px ${MED_COLORS.RED}`,
        animation: 'pulse-red 1s ease-in-out infinite',
        flexShrink: 0,
      }} />
      {/* 时间文字：英文日期 + 中文日期 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <span style={{
          fontSize: 14, fontWeight: 700, color: MED_COLORS.RED,
          letterSpacing: '0.05em', whiteSpace: 'nowrap', lineHeight: 1.2,
        }}>
          {enDate || '--- -- ----'}
        </span>
        <span style={{
          fontSize: 12, color: MED_COLORS.GRAY_LIGHT,
          letterSpacing: '0.03em', whiteSpace: 'nowrap', lineHeight: 1.2,
        }}>
          {cnDate || '----年-月-日'}
        </span>
      </div>
    </div>
  );

  return (
    <CyberpunkPanel
      title="瘟疫扩散时间轴"
      color={MED_COLORS.RED}
      style={{ bottom: 24, right: 24 }}
      collapsedContent={collapsedContent}
    >
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        fontFamily: "'JetBrains Mono', 'Consolas', 'SimHei', monospace",
        minWidth: 200,
      }}>
        {/* 日期显示 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 15, fontWeight: 700, color: MED_COLORS.RED,
            letterSpacing: '0.03em', lineHeight: 1.3,
          }}>
            {cnDate || '----年-月-日'}
          </div>
          <div style={{
            fontSize: 12, color: MED_COLORS.GRAY_LIGHT,
            letterSpacing: '0.08em', marginTop: 1,
          }}>
            {enDate || '--- -- ----'}
          </div>
        </div>

        {/* 进度条 */}
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 11, color: MED_COLORS.GRAY_LIGHT, marginBottom: 3,
          }}>
            <span>PROGRESS</span>
            <span>{frameIndex + 1} / {totalFrames}</span>
          </div>
          <div style={{
            width: '100%', height: 3,
            backgroundColor: MED_COLORS.GRAY_DARK,
            borderRadius: 0,
          }}>
            <div style={{
              width: `${progress * 100}%`, height: '100%',
              backgroundColor: MED_COLORS.RED,
              transition: 'width 0.15s linear',
              boxShadow: `0 0 6px ${MED_COLORS.RED}60`,
            }} />
          </div>
        </div>

        {/* 统计 — 字体与 StatsOverlay 一致 */}
        <div style={{ borderTop: `1px solid ${MED_COLORS.GRAY_DARK}`, paddingTop: 5 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <StatLine label="已扩散疫区" value={`${stats.affectedCount}`} color={MED_COLORS.ORANGE} />
            <StatLine label="累计死亡" value={stats.cumulativeDeaths.toLocaleString()} color={MED_COLORS.RED} />
          </div>
        </div>

        {/* LIVE 指示器 / 扩散完成 */}
        <div style={{ borderTop: `1px solid ${MED_COLORS.GRAY_DARK}`, paddingTop: 5 }}>
          {isPlaying && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                backgroundColor: MED_COLORS.RED,
                boxShadow: `0 0 5px ${MED_COLORS.RED}`,
                animation: 'pulse-red 1s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 12, color: MED_COLORS.RED, fontWeight: 700, letterSpacing: '0.1em' }}>
                LIVE
              </span>
            </div>
          )}
          {hasReachedEnd && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, color: MED_COLORS.GRAY_LIGHT, fontWeight: 700, letterSpacing: '0.1em' }}>
                ▣ 扩散完成
              </span>
            </div>
          )}
          {!isPlaying && !hasReachedEnd && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, color: MED_COLORS.GRAY_LIGHT, letterSpacing: '0.1em' }}>
                ⏸ 已暂停
              </span>
            </div>
          )}
        </div>
      </div>
    </CyberpunkPanel>
  );
};

// 与 StatsOverlay 中的 StatLine 字体大小一致：label=12, value=13
const StatLine: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: 12, color: MED_COLORS.GRAY_LIGHT, textTransform: 'uppercase' }}>
      {label}
    </span>
    <span style={{ fontSize: 13, color, fontWeight: 700 }}>{value}</span>
  </div>
);

export default DateDisplay;
