import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MED_COLORS, GeoIcons } from '../constants';
import type { PlagueData, PlagueRegion, CityOutbreak } from '../types';
import { PageTransition } from './HUD';
import PlagueModel from './PlagueModel';
import PaginatedDoc from './analysis/PaginatedDoc';

// ============================================================
// 类型定义
// ============================================================
type IntroPhase = 'title' | 'fading' | 'content';

interface PointConfig {
  id: string;
  label: string;
  angle: number;       // 角度 (度), 0=顶部, 顺时针
  color: string;
  icon: React.ReactNode;
}

// 面板锚点方向
type PanelDir = 'left' | 'right' | 'up' | 'down';

// ============================================================
// 8 个交互点配置 — 均匀分布在病株模型周围
// ============================================================
const POINTS_CONFIG: PointConfig[] = [
  { id: 'pathogen',   label: '病原特征',   angle: 0,   color: MED_COLORS.VIOLET, icon: <GeoIcons.Biohazard /> },
  { id: 'transmit',   label: '传播路径',   angle: 45,  color: MED_COLORS.BLUE,   icon: <GeoIcons.Chart /> },
  { id: 'mortality',  label: '死亡分析',   angle: 90,  color: MED_COLORS.RED,    icon: <GeoIcons.Biohazard /> },
  { id: 'timeline',   label: '时间线',     angle: 135, color: MED_COLORS.BLUE,   icon: <GeoIcons.Chart /> },
  { id: 'geography',  label: '地理分布',   angle: 180, color: MED_COLORS.ORANGE, icon: <GeoIcons.Globe /> },
  { id: 'highrisk',   label: '高危区域',   angle: 225, color: MED_COLORS.RED,    icon: <GeoIcons.MapPin /> },
  { id: 'population', label: '人口影响',   angle: 270, color: MED_COLORS.ORANGE, icon: <GeoIcons.Chart /> },
  { id: 'trend',      label: '疫情趋势',   angle: 315, color: MED_COLORS.VIOLET, icon: <GeoIcons.Report /> },
];

// ============================================================
// 面板方向推断
// ============================================================
const getPanelDir = (angle: number): PanelDir => {
  const a = ((angle % 360) + 360) % 360;
  if (a >= 45 && a < 135) return 'right';
  if (a >= 135 && a < 225) return 'down';
  if (a >= 225 && a < 315) return 'left';
  return 'up';
};

// ============================================================
// 统计用辅助
// ============================================================
interface PointData {
  chinaRegions: PlagueRegion[];
  chinaStats: {
    total_regions: number;
    total_deaths: number;
    max_death_region: string;
    max_death_count: number;
    date_range: string;
  } | null;
  europeCities: CityOutbreak[];
  europeStats: {
    total_records: number;
    total_cities: number;
    year_range: string;
  } | null;
  centuryStats: Record<string, number>;
}

// ============================================================
// 信息面板组件
// ============================================================
const AnalysisPanel: React.FC<{
  category: PointConfig;
  data: PointData;
  style: React.CSSProperties;
  panelDir: PanelDir;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}> = ({ category, data, style, panelDir, onMouseEnter, onMouseLeave }) => {
  // 切角边框 clipPath
  const chamferClip = `polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)`;

  // 根据面板方向确定动画起始偏移
  const getInitial = () => {
    switch (panelDir) {
      case 'right': return { opacity: 0, x: -20, scale: 0.9 };
      case 'left':  return { opacity: 0, x: 20, scale: 0.9 };
      case 'up':    return { opacity: 0, y: 20, scale: 0.9 };
      case 'down':  return { opacity: 0, y: -20, scale: 0.9 };
    }
  };

  const renderContent = () => {
    const { chinaRegions, chinaStats, europeCities, europeStats, centuryStats } = data;

    switch (category.id) {
      // ============================================================
      // 病原特征
      // ============================================================
      case 'pathogen':
        return (
          <div className="space-y-3">
            <div className="text-[9px] leading-relaxed" style={{ color: MED_COLORS.TEXT }}>
              <span className="font-bold" style={{ color: MED_COLORS.VIOLET }}>Yersinia pestis</span>
              {' '}— 革兰氏阴性球杆菌，属于肠杆菌科耶尔森菌属。1894年由亚历山大·耶尔森在香港首次分离。
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InfoChip label="菌形" value="杆状/球杆状" />
              <InfoChip label="染色" value="革兰氏阴性" />
              <InfoChip label="大小" value="0.5×1-2 μm" />
              <InfoChip label="芽孢" value="不形成" />
              <InfoChip label="荚膜" value="F1 抗原" />
              <InfoChip label="毒力" value="III 型分泌系统" />
            </div>
            <div className="border-t pt-2" style={{ borderColor: MED_COLORS.GRAY_DARK }}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: MED_COLORS.VIOLET }}>临床分型</div>
              <div className="grid grid-cols-3 gap-1 text-[9px]">
                <TypeBadge label="腺鼠疫" sub="BUBONIC" color={MED_COLORS.ORANGE} active />
                <TypeBadge label="肺鼠疫" sub="PNEUMONIC" color={MED_COLORS.RED} active />
                <TypeBadge label="败血型" sub="SEPTICEMIC" color={MED_COLORS.BLUE} />
              </div>
            </div>
          </div>
        );

      // ============================================================
      // 传播路径
      // ============================================================
      case 'transmit':
        return (
          <div className="space-y-3">
            <div className="text-[9px] leading-relaxed" style={{ color: MED_COLORS.TEXT }}>
              <span className="font-bold" style={{ color: MED_COLORS.BLUE }}>传播方式：</span>
              鼠疫耶尔森菌主要通过<span style={{ color: MED_COLORS.ORANGE }}>跳蚤叮咬</span>在啮齿动物间传播，也可通过<span style={{ color: MED_COLORS.RED }}>飞沫</span>在人与人之间传播（肺鼠疫）。
            </div>
            {chinaRegions.length > 0 && (
              <div>
                <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color: MED_COLORS.BLUE }}>东北肺鼠疫 传播速度</div>
                <div className="space-y-1.5">
                  <StatBar
                    label="最快传播"
                    value={`${chinaRegions.reduce((max, r) => Math.max(max, r.speed_km_day ?? 0), 0).toFixed(1)} km/d`}
                    pct={Math.min(100, (chinaRegions.reduce((max, r) => Math.max(max, r.speed_km_day ?? 0), 0) / 50) * 100)}
                    color={MED_COLORS.RED}
                  />
                  <StatBar
                    label="最高节点度"
                    value={`${chinaRegions.reduce((max, r) => Math.max(max, r.node_degree ?? 0), 0)}`}
                    pct={Math.min(100, (chinaRegions.reduce((max, r) => Math.max(max, r.node_degree ?? 0), 0) / 30) * 100)}
                    color={MED_COLORS.ORANGE}
                  />
                  <StatBar
                    label="平均传播速度"
                    value={`${(chinaRegions.reduce((s, r) => s + (r.speed_km_day ?? 0), 0) / chinaRegions.filter(r => r.speed_km_day).length).toFixed(1)} km/d`}
                    pct={50}
                    color={MED_COLORS.BLUE}
                  />
                </div>
              </div>
            )}
            <div className="text-[9px] opacity-50" style={{ color: MED_COLORS.GRAY_LIGHT }}>
              欧洲腺鼠疫主要依赖鼠-蚤-人传播链，传播速度较肺鼠疫慢但持续数百年
            </div>
          </div>
        );

      // ============================================================
      // 死亡分析
      // ============================================================
      case 'mortality':
        return (
          <div className="space-y-3">
            {chinaStats && (
              <div>
                <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color: MED_COLORS.RED }}>东北肺鼠疫 1910-1911</div>
                <div className="grid grid-cols-2 gap-2">
                  <VitalBlock label="总死亡人数" value={chinaStats.total_deaths.toLocaleString()} color={MED_COLORS.RED} />
                  <VitalBlock label="疫区数量" value={`${chinaStats.total_regions}`} color={MED_COLORS.BLUE} />
                </div>
                <div className="mt-2 text-[9px]" style={{ color: MED_COLORS.GRAY_LIGHT }}>
                  最严重疫区：<span style={{ color: MED_COLORS.RED }}>{chinaStats.max_death_region}</span>
                  {' '}({chinaStats.max_death_count.toLocaleString()} 人死亡)
                </div>
                <div className="text-[9px] mt-0.5" style={{ color: MED_COLORS.GRAY_LIGHT }}>
                  日均死亡率最高：{
                    chinaRegions.reduce((max, r) =>
                      (r.mortality_daily ?? 0) > (max.mortality_daily ?? 0) ? r : max
                    ).name_cn
                  } ({(chinaRegions.reduce((max, r) =>
                    (r.mortality_daily ?? 0) > (max.mortality_daily ?? 0) ? r : max
                  ).mortality_daily ?? 0).toFixed(1)} 人/日)
                </div>
              </div>
            )}
            <div className="border-t pt-2" style={{ borderColor: MED_COLORS.GRAY_DARK }}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: MED_COLORS.ORANGE }}>欧洲腺鼠疫 1347-1900</div>
              <div className="grid grid-cols-2 gap-2">
                <VitalBlock label="总爆发记录" value={europeStats?.total_records.toLocaleString() ?? '--'} color={MED_COLORS.ORANGE} />
                <VitalBlock label="涉及城市" value={`${europeStats?.total_cities ?? '--'}`} color={MED_COLORS.VIOLET} />
              </div>
              <div className="text-[9px] mt-1.5" style={{ color: MED_COLORS.GRAY_LIGHT }}>
                黑死病时期（1347-1351）欧洲人口减少约 30-60%，是人类历史上最具破坏性的流行病之一
              </div>
            </div>
          </div>
        );

      // ============================================================
      // 时间线
      // ============================================================
      case 'timeline':
        return (
          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: MED_COLORS.BLUE }}>关键时间节点</div>
            <div className="space-y-2">
              <TimelineItem date="1910.10.25" label="东北鼠疫首发" sub="胪滨府（今满洲里）报告首例" color={MED_COLORS.BLUE} />
              <TimelineItem date="1910.11-12" label="疫情快速扩散" sub="沿中东铁路蔓延至哈尔滨等地" color={MED_COLORS.ORANGE} />
              <TimelineItem date="1911.01" label="伍连德抵哈" sub="实施隔离、火化、口罩等措施" color={MED_COLORS.VIOLET} />
              <TimelineItem date="1911.03-04" label="疫情终结" sub="肺鼠疫被完全控制" color={MED_COLORS.GREEN} />
            </div>
            <div className="border-t pt-2" style={{ borderColor: MED_COLORS.GRAY_DARK }}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: MED_COLORS.ORANGE }}>欧洲鼠疫世纪分布</div>
              <div className="space-y-1">
                {Object.entries(centuryStats)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .slice(0, 6)
                  .map(([century, count]) => {
                    const centuryNames: Record<string, string> = {
                      '1300': '14 世纪', '1400': '15 世纪', '1500': '16 世纪',
                      '1600': '17 世纪', '1700': '18 世纪', '1800': '19 世纪',
                    };
                    const centuryColors: Record<string, string> = {
                      '1300': MED_COLORS.RED, '1400': MED_COLORS.ORANGE, '1500': '#EAB308',
                      '1600': MED_COLORS.GREEN, '1700': '#06B6D4', '1800': MED_COLORS.VIOLET,
                    };
                    return (
                      <div key={century} className="flex items-center justify-between text-[9px]">
                        <span style={{ color: centuryColors[century] || MED_COLORS.GRAY_LIGHT }}>
                          {centuryNames[century] || `${century}s`}
                        </span>
                        <span className="font-mono" style={{ color: MED_COLORS.TEXT }}>{count} 疫点</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        );

      // ============================================================
      // 地理分布
      // ============================================================
      case 'geography':
        return (
          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: MED_COLORS.ORANGE }}>东北鼠疫 省份分布</div>
            {data.chinaStats && (
              <div className="space-y-1.5">
                {['黑龙江', '吉林', '奉天', '直隶', '山东'].map(prov => {
                  const regions = chinaRegions.filter(r =>
                    r.name_cn.includes(prov) || r.name_cn.includes(prov.replace('奉天', '奉').replace('直隶', '直'))
                  );
                  // 简单统计：按省份名匹配
                  const provinceKey = prov;
                  const counts = chinaRegions.filter(r => {
                    if (provinceKey === '黑龙江') return r.name_cn.includes('龙江') || r.name_cn.includes('呼伦') || r.name_cn.includes('胪滨') || r.name_cn.includes('黑');
                    if (provinceKey === '吉林') return r.name_cn.includes('吉林') || r.name_cn.includes('长春') || r.name_cn.includes('宾州');
                    if (provinceKey === '奉天') return r.name_cn.includes('奉') || r.name_cn.includes('锦');
                    if (provinceKey === '直隶') return r.name_cn.includes('直') || r.name_cn.includes('天津') || r.name_cn.includes('京师');
                    if (provinceKey === '山东') return r.name_cn.includes('山东') || r.name_cn.includes('济南');
                    return false;
                  }).length;
                  const deaths = chinaRegions
                    .filter(r => {
                      if (provinceKey === '黑龙江') return r.name_cn.includes('龙江') || r.name_cn.includes('呼伦') || r.name_cn.includes('胪滨') || r.name_cn.includes('黑');
                      if (provinceKey === '吉林') return r.name_cn.includes('吉林') || r.name_cn.includes('长春') || r.name_cn.includes('宾州');
                      if (provinceKey === '奉天') return r.name_cn.includes('奉') || r.name_cn.includes('锦');
                      if (provinceKey === '直隶') return r.name_cn.includes('直') || r.name_cn.includes('天津') || r.name_cn.includes('京师');
                      if (provinceKey === '山东') return r.name_cn.includes('山东') || r.name_cn.includes('济南');
                      return false;
                    })
                    .reduce((s, r) => s + (r.deaths ?? 0), 0);
                  const provColors: Record<string, string> = {
                    '黑龙江': MED_COLORS.RED, '吉林': MED_COLORS.GREEN,
                    '奉天': MED_COLORS.ORANGE, '直隶': MED_COLORS.VIOLET, '山东': MED_COLORS.BLUE,
                  };
                  return (
                    <StatBar
                      key={prov}
                      label={prov}
                      value={`${counts} 疫区 · ${deaths} 人死亡`}
                      pct={Math.min(100, (deaths / (chinaStats?.total_deaths || 1)) * 100)}
                      color={provColors[prov] || MED_COLORS.BLUE}
                    />
                  );
                })}
              </div>
            )}
            <div className="border-t pt-2" style={{ borderColor: MED_COLORS.GRAY_DARK }}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: MED_COLORS.VIOLET }}>欧洲鼠疫 重灾区 TOP 5</div>
              <div className="space-y-1">
                {europeCities.slice(0, 5).map((city, i) => (
                  <div key={i} className="flex items-center justify-between text-[9px]">
                    <span style={{ color: MED_COLORS.TEXT }}>{city.Location}</span>
                    <span className="font-mono" style={{ color: i === 0 ? MED_COLORS.RED : MED_COLORS.GRAY_LIGHT }}>
                      {city.outbreak_count} 次爆发
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // ============================================================
      // 高危区域
      // ============================================================
      case 'highrisk':
        return (
          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: MED_COLORS.RED }}>东北鼠疫 最高风险区 TOP 5</div>
            <div className="space-y-1.5">
              {[...chinaRegions]
                .sort((a, b) => (b.deaths ?? 0) - (a.deaths ?? 0))
                .slice(0, 5)
                .map((r, i) => (
                  <StatBar
                    key={i}
                    label={r.name_cn}
                    value={`${r.deaths?.toLocaleString() ?? '--'} 人`}
                    pct={chinaStats ? Math.min(100, ((r.deaths ?? 0) / chinaStats.total_deaths) * 100) : 0}
                    color={i === 0 ? MED_COLORS.RED : i === 1 ? MED_COLORS.ORANGE : MED_COLORS.BLUE}
                  />
                ))}
            </div>
            <div className="border-t pt-2" style={{ borderColor: MED_COLORS.GRAY_DARK }}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: MED_COLORS.ORANGE }}>欧洲鼠疫 最高频发区 TOP 5</div>
              <div className="space-y-1.5">
                {[...europeCities]
                  .sort((a, b) => b.outbreak_count - a.outbreak_count)
                  .slice(0, 5)
                  .map((c, i) => (
                    <StatBar
                      key={i}
                      label={c.Location}
                      value={`${c.outbreak_count} 次`}
                      pct={Math.min(100, (c.outbreak_count / (europeCities[0]?.outbreak_count || 1)) * 100)}
                      color={i === 0 ? MED_COLORS.RED : i === 1 ? MED_COLORS.ORANGE : MED_COLORS.BLUE}
                    />
                  ))}
              </div>
            </div>
          </div>
        );

      // ============================================================
      // 人口影响
      // ============================================================
      case 'population':
        return (
          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: MED_COLORS.ORANGE }}>东北鼠疫 人口统计</div>
            <div className="grid grid-cols-2 gap-2">
              <VitalBlock label="总涉及人口" value={
                `${chinaRegions.reduce((s, r) => s + (r.population ?? 0), 0).toFixed(0)} 万`} color={MED_COLORS.BLUE} />
              <VitalBlock label="人均死亡率" value={
                chinaRegions.length > 0
                  ? `${(chinaRegions.reduce((s, r) => s + (r.mortality_per_capita ?? 0), 0) / chinaRegions.filter(r => r.mortality_per_capita).length).toFixed(0)} /10万`
                  : '--'
              } color={MED_COLORS.RED} />
            </div>
            {chinaStats && (
              <div className="text-[9px]" style={{ color: MED_COLORS.GRAY_LIGHT }}>
                综合死亡强度最高：{
                  chinaRegions.reduce((max, r) =>
                    (r.mortality_intensity ?? 0) > (max.mortality_intensity ?? 0) ? r : max
                  ).name_cn
                }
              </div>
            )}
            <div className="border-t pt-2" style={{ borderColor: MED_COLORS.GRAY_DARK }}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: MED_COLORS.VIOLET }}>欧洲鼠疫 社会影响</div>
              <div className="grid grid-cols-2 gap-2">
                <VitalBlock label="爆发跨度" value={europeStats?.year_range ?? '--'} color={MED_COLORS.ORANGE} />
                <VitalBlock label="城市总数" value={`${europeStats?.total_cities ?? '--'}`} color={MED_COLORS.VIOLET} />
              </div>
              <div className="text-[9px] mt-1.5" style={{ color: MED_COLORS.GRAY_LIGHT }}>
                14 世纪黑死病造成约 7500 万-2 亿人死亡，深刻改变欧洲社会结构、经济和宗教
              </div>
            </div>
          </div>
        );

      // ============================================================
      // 疫情趋势
      // ============================================================
      case 'trend':
        return (
          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: MED_COLORS.VIOLET }}>东北鼠疫 传播速度分析</div>
            <div className="space-y-1.5">
              {[
                { label: '极高速 (>20km/d)', count: chinaRegions.filter(r => (r.speed_km_day ?? 0) > 20).length, color: '#991B1B' },
                { label: '高速 (10-20)', count: chinaRegions.filter(r => (r.speed_km_day ?? 0) > 10 && (r.speed_km_day ?? 0) <= 20).length, color: MED_COLORS.RED },
                { label: '中速 (5-10)', count: chinaRegions.filter(r => (r.speed_km_day ?? 0) > 5 && (r.speed_km_day ?? 0) <= 10).length, color: MED_COLORS.ORANGE },
                { label: '低速 (2-5)', count: chinaRegions.filter(r => (r.speed_km_day ?? 0) > 2 && (r.speed_km_day ?? 0) <= 5).length, color: MED_COLORS.BLUE },
                { label: '极低速 (<2)', count: chinaRegions.filter(r => (r.speed_km_day ?? 0) <= 2).length, color: MED_COLORS.GREEN },
              ].map((item, i) => (
                <StatBar
                  key={i}
                  label={item.label}
                  value={`${item.count} 疫区`}
                  pct={chinaRegions.length > 0 ? (item.count / chinaRegions.length) * 100 : 0}
                  color={item.color}
                />
              ))}
            </div>
            <div className="border-t pt-2" style={{ borderColor: MED_COLORS.GRAY_DARK }}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: MED_COLORS.ORANGE }}>欧洲鼠疫 持续时间</div>
              <div className="text-[9px]" style={{ color: MED_COLORS.TEXT }}>
                欧洲鼠疫从 1347 年持续至 1900 年，跨越 <span style={{ color: MED_COLORS.ORANGE, fontWeight: 'bold' }}>553 年</span>，
                期间经历多次大流行。14 世纪（黑死病）为最高峰，17 世纪后逐渐消退。
              </div>
              <div className="text-[9px] mt-1" style={{ color: MED_COLORS.GRAY_LIGHT }}>
                最后一次欧洲大爆发：1720-1722 年马赛大瘟疫（约 10 万人死亡）
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={getInitial()}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={getInitial()}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="absolute z-[200]"
      style={{ ...style, width: 280, maxHeight: 420, overflowY: 'auto' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 光晕层 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: '5px',
          boxShadow: `0 0 18px ${category.color}25, 0 0 40px ${category.color}08`,
        }}
      />
      {/* 背景 + 切角边框 */}
      <div className="relative" style={{ borderRadius: '5px', overflow: 'hidden' }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(245,247,250,0.96)',
            backdropFilter: 'blur(16px)',
            clipPath: chamferClip,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            clipPath: chamferClip,
            border: `1px solid ${category.color}`,
            boxShadow: `inset 0 0 0 1px ${category.color}30`,
            borderRadius: '5px',
          }}
        />
        {/* 内容 */}
        <div className="relative z-10 p-3">
          {/* 标题栏 */}
          <div className="flex items-center gap-2 mb-2 pb-2 border-b" style={{ borderColor: MED_COLORS.GRAY_DARK }}>
            <span style={{ color: category.color }}>{category.icon}</span>
            <span
              className="text-[9px] font-bold uppercase tracking-wider"
              style={{ color: category.color, fontFamily: "'JetBrains Mono','SimHei',monospace" }}
            >
              {category.label}
            </span>
          </div>
          {/* 内容体 */}
          <div className="text-[9px]" style={{ fontFamily: "'JetBrains Mono','SimHei',monospace" }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================
// 面板内小组件
// ============================================================

const InfoChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="border p-1.5 rounded" style={{ borderColor: MED_COLORS.GRAY_MID }}>
    <div className="text-[7px] uppercase opacity-50" style={{ color: MED_COLORS.GRAY_LIGHT }}>{label}</div>
    <div className="text-[9px] font-bold" style={{ color: MED_COLORS.TEXT }}>{value}</div>
  </div>
);

const TypeBadge: React.FC<{ label: string; sub: string; color: string; active?: boolean }> = ({ label, sub, color, active }) => (
  <div
    className="text-center py-1.5 rounded border"
    style={{
      borderColor: active ? color : MED_COLORS.GRAY_MID,
      backgroundColor: active ? `${color}08` : 'transparent',
    }}
  >
    <div className="text-[9px] font-bold" style={{ color: active ? color : MED_COLORS.GRAY_LIGHT }}>{label}</div>
    <div className="text-[6px] uppercase opacity-50" style={{ color: MED_COLORS.GRAY_LIGHT }}>{sub}</div>
  </div>
);

const VitalBlock: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="border p-2" style={{ borderColor: `${color}30` }}>
    <div className="text-[7px] uppercase tracking-wider opacity-50 mb-0.5" style={{ color: MED_COLORS.GRAY_LIGHT }}>{label}</div>
    <div className="text-sm font-bold font-mono" style={{ color }}>{value}</div>
  </div>
);

const StatBar: React.FC<{ label: string; value: string; pct: number; color: string }> = ({ label, value, pct, color }) => (
  <div>
    <div className="flex justify-between text-[9px] mb-0.5">
      <span style={{ color: MED_COLORS.TEXT }}>{label}</span>
      <span className="font-mono opacity-60" style={{ color }}>{value}</span>
    </div>
    <div className="h-1 rounded-sm overflow-hidden" style={{ backgroundColor: MED_COLORS.GRAY_DARK }}>
      <motion.div
        className="h-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(3, pct)}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}40` }}
      />
    </div>
  </div>
);

const TimelineItem: React.FC<{ date: string; label: string; sub: string; color: string }> = ({ date, label, sub, color }) => (
  <div className="flex gap-2">
    <div className="flex flex-col items-center flex-shrink-0">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />
      <div className="w-px flex-1 mt-0.5" style={{ backgroundColor: MED_COLORS.GRAY_MID }} />
    </div>
    <div className="pb-2">
      <div className="text-[9px] font-mono opacity-50" style={{ color: MED_COLORS.GRAY_LIGHT }}>{date}</div>
      <div className="text-[9px] font-bold" style={{ color: color }}>{label}</div>
      <div className="text-[9px] opacity-60" style={{ color: MED_COLORS.GRAY_LIGHT }}>{sub}</div>
    </div>
  </div>
);

// ============================================================
// 主分析视图组件
// ============================================================
const AnalysisView: React.FC<{ keyValue: string }> = ({ keyValue }) => {
  // 入场动画
  const [introPhase, setIntroPhase] = useState<IntroPhase>('title');
  const introTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 数据
  const [plagueData, setPlagueData] = useState<PlagueData | null>(null);
  const [loading, setLoading] = useState(true);

  // 交互状态
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePointIdx, setActivePointIdx] = useState<number | null>(null);
  const [lockedPointIdx, setLockedPointIdx] = useState<number | null>(null);
  const panelHoverRef = useRef(false);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
  const [showDoc, setShowDoc] = useState(false);

  // ============================================================
  // 加载数据
  // ============================================================
  useEffect(() => {
    fetch('/data/plague_data.json')
      .then(r => r.json())
      .then(json => {
        setPlagueData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ============================================================
  // 入场动画时序
  // ============================================================
  useEffect(() => {
    return () => introTimersRef.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (introPhase !== 'title') return;
    const minDisplayMs = loading ? 2000 : 800;
    const t1 = setTimeout(() => setIntroPhase('fading'), minDisplayMs);
    introTimersRef.current.push(t1);
    return () => clearTimeout(t1);
  }, [introPhase, loading]);

  useEffect(() => {
    if (introPhase !== 'fading') return;
    const t2 = setTimeout(() => setIntroPhase('content'), 700);
    introTimersRef.current.push(t2);
    return () => clearTimeout(t2);
  }, [introPhase]);

  // ============================================================
  // 容器尺寸跟踪
  // ============================================================
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ w: rect.width, h: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [introPhase]);

  // ============================================================
  // 计算点位置
  // ============================================================
  const centerX = containerSize.w / 2;
  const centerY = containerSize.h / 2;
  const orbitRadius = Math.min(containerSize.w, containerSize.h) * 0.38;

  const pointPositions = useMemo(() => {
    return POINTS_CONFIG.map(pt => {
      const rad = ((pt.angle - 90) * Math.PI) / 180; // 0=top, convert to standard math
      return {
        x: centerX + orbitRadius * Math.cos(rad),
        y: centerY + orbitRadius * Math.sin(rad),
      };
    });
  }, [centerX, centerY, orbitRadius]);

  // ============================================================
  // 鼠标追踪
  // ============================================================
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || introPhase !== 'content') return;

    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // 如果面板锁定了且鼠标在面板区域，不切换
    if (lockedPointIdx !== null && panelHoverRef.current) return;

    // 计算最近的点
    const threshold = 80;
    let closestIdx: number | null = null;
    let closestDist = threshold;

    pointPositions.forEach((pos, i) => {
      const dist = Math.sqrt((mx - pos.x) ** 2 + (my - pos.y) ** 2);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });

    if (closestIdx !== activePointIdx) {
      setActivePointIdx(closestIdx);
    }
  }, [activePointIdx, lockedPointIdx, pointPositions, introPhase]);

  const handleMouseLeave = useCallback(() => {
    if (!panelHoverRef.current) {
      setActivePointIdx(null);
      setLockedPointIdx(null);
    }
  }, []);

  // ============================================================
  // 构建面板数据
  // ============================================================
  const panelData: PointData = useMemo(() => {
    const chinaRegions = plagueData?.plague_ne_china ?? [];
    const chinaStats = plagueData?.plague_ne_stats ?? null;
    const europeCities = plagueData?.plague_europe?.top_cities ?? [];
    const europeStats = plagueData?.plague_europe ? {
      total_records: plagueData.plague_europe.total_records,
      total_cities: plagueData.plague_europe.total_cities,
      year_range: plagueData.plague_europe.year_range,
    } : null;
    const centuryStats = plagueData?.plague_europe?.century_stats ?? {};
    return { chinaRegions, chinaStats, europeCities, europeStats, centuryStats };
  }, [plagueData]);

  // ============================================================
  // 计算面板位置
  // ============================================================
  const getPanelPosition = (idx: number): { style: React.CSSProperties; panelDir: PanelDir } => {
    const pt = pointPositions[idx];
    const cfg = POINTS_CONFIG[idx];
    const dir = getPanelDir(cfg.angle);
    const panelW = 280;
    const panelH = 380;
    const gap = 30;
    const lineLen = 60;

    let panelX: number;
    let panelY: number;
    let anchorX: number;
    let anchorY: number;

    switch (dir) {
      case 'right':
        anchorX = pt.x + lineLen;
        anchorY = pt.y;
        panelX = anchorX;
        panelY = anchorY - panelH / 2;
        break;
      case 'left':
        anchorX = pt.x - lineLen;
        anchorY = pt.y;
        panelX = anchorX - panelW;
        panelY = anchorY - panelH / 2;
        break;
      case 'up':
        anchorX = pt.x;
        anchorY = pt.y - lineLen;
        panelX = anchorX - panelW / 2;
        panelY = anchorY - panelH;
        break;
      case 'down':
        anchorX = pt.x;
        anchorY = pt.y + lineLen;
        panelX = anchorX - panelW / 2;
        panelY = anchorY;
        break;
    }

    // 限制在容器内
    panelX = Math.max(8, Math.min(containerSize.w - panelW - 8, panelX));
    panelY = Math.max(8, Math.min(containerSize.h - panelH - 8, panelY));

    return {
      style: { left: panelX, top: panelY },
      panelDir: dir,
    };
  };

  // ============================================================
  // 渲染：入场动画
  // ============================================================
  if (introPhase !== 'content') {
    const isFading = introPhase === 'fading';
    return (
      <PageTransition keyValue={keyValue}>
        <div className="h-full flex items-center justify-center" style={{ backgroundColor: MED_COLORS.BG }}>
          <motion.div
            className="text-center space-y-5"
            initial={{ opacity: 1 }}
            animate={{ opacity: isFading ? 0 : 1 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
          >
            {/* 顶部小字 — 稳定不闪烁 */}
            <div
              className="text-xs uppercase tracking-[0.2em]"
              style={{ color: MED_COLORS.BLUE, opacity: isFading ? 0 : 0.4 }}
            >
              INITIALIZING PATHOGEN ANALYSIS
            </div>

            {/* 主标题 — 闪烁 */}
            <h2
              className="text-2xl font-bold tracking-tighter uppercase"
              style={{
                color: MED_COLORS.GRAY_LIGHT,
                animation: isFading ? 'none' : 'title-flicker 0.15s infinite',
              }}
            >
              鼠疫 · 综合病原分析
            </h2>

            {/* 副标题 — 闪烁 */}
            <p
              className="text-[9px] uppercase tracking-wider"
              style={{
                color: MED_COLORS.GRAY_LIGHT,
                opacity: isFading ? 0 : 0.3,
                animation: isFading ? 'none' : 'title-flicker 0.2s infinite',
              }}
            >
              Y. PESTIS // BIOSAFETY LEVEL 4
            </p>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  // ============================================================
  // 渲染：主内容
  // ============================================================
  return (
    <PageTransition keyValue={keyValue}>
      <div
        ref={containerRef}
        className="h-full w-full relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ backgroundColor: MED_COLORS.BG }}
      >
        {/* ============================================================ */}
        {/* 扫描环装饰 */}
        {/* ============================================================ */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={containerSize.w}
          height={containerSize.h}
        >
          {/* 外扫描环 */}
          <circle
            cx={centerX} cy={centerY}
            r={orbitRadius + 40}
            fill="none"
            stroke={MED_COLORS.BLUE}
            strokeWidth="0.5"
            strokeDasharray="4 12"
            opacity="0.15"
          />
          <circle
            cx={centerX} cy={centerY}
            r={orbitRadius + 60}
            fill="none"
            stroke={MED_COLORS.BLUE}
            strokeWidth="0.3"
            strokeDasharray="2 18"
            opacity="0.1"
          />
          {/* 旋转扫描弧线 */}
          <motion.circle
            cx={centerX} cy={centerY}
            r={orbitRadius + 50}
            fill="none"
            stroke={MED_COLORS.BLUE}
            strokeWidth="0.6"
            strokeDasharray={`${Math.PI * (orbitRadius + 50) * 0.25} ${Math.PI * (orbitRadius + 50) * 0.75}`}
            opacity="0.2"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
          />

          {/* 交互点连接线 */}
          {activePointIdx !== null && pointPositions[activePointIdx] && (
            <motion.line
              x1={pointPositions[activePointIdx].x}
              y1={pointPositions[activePointIdx].y}
              x2={(() => {
                const dir = getPanelDir(POINTS_CONFIG[activePointIdx].angle);
                const pt = pointPositions[activePointIdx];
                switch (dir) {
                  case 'right': return pt.x + 60;
                  case 'left': return pt.x - 60;
                  default: return pt.x;
                }
              })()}
              y2={(() => {
                const dir = getPanelDir(POINTS_CONFIG[activePointIdx].angle);
                const pt = pointPositions[activePointIdx];
                switch (dir) {
                  case 'up': return pt.y - 60;
                  case 'down': return pt.y + 60;
                  default: return pt.y;
                }
              })()}
              stroke={POINTS_CONFIG[activePointIdx].color}
              strokeWidth="1.2"
              opacity="0.7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              exit={{ pathLength: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 4px ${POINTS_CONFIG[activePointIdx].color}60)` }}
            />
          )}
        </svg>

        {/* ============================================================ */}
        {/* 网格背景 */}
        {/* ============================================================ */}
        <div className="absolute inset-0 med-dot-grid opacity-30 pointer-events-none" />

        {/* ============================================================ */}
        {/* 中央病株模型 (pointer-events-none 确保鼠标事件穿透到容器) */}
        {/* ============================================================ */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        >
          <PlagueModel size={Math.min(containerSize.w, containerSize.h) * 0.42} />
        </motion.div>

        {/* ============================================================ */}
        {/* 交互点 */}
        {/* ============================================================ */}
        {POINTS_CONFIG.map((pt, i) => {
          const pos = pointPositions[i];
          if (!pos) return null;
          const isActive = activePointIdx === i;

          return (
            <motion.div
              key={pt.id}
              className="absolute z-[100]"
              style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: isActive ? 1.25 : 1,
              }}
              transition={{
                delay: 0.4 + i * 0.08,
                duration: 0.4,
                scale: { duration: 0.2 },
              }}
            >
              {/* 外环脉冲 */}
              {isActive && (
                <motion.div
                  className="absolute rounded-full border"
                  style={{
                    width: 36, height: 36,
                    left: -18, top: -18,
                    borderColor: pt.color,
                  }}
                  animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
              {/* 点主体 */}
              <div
                className="relative rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  width: isActive ? 16 : 11,
                  height: isActive ? 16 : 11,
                  backgroundColor: pt.color,
                  boxShadow: isActive
                    ? `0 0 14px ${pt.color}, 0 0 28px ${pt.color}40`
                    : `0 0 6px ${pt.color}60`,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* 内部亮点 */}
                <div
                  className="rounded-full"
                  style={{
                    width: isActive ? 5 : 3,
                    height: isActive ? 5 : 3,
                    backgroundColor: '#FFFFFF',
                    opacity: 0.8,
                  }}
                />
              </div>
              {/* 标签 */}
              <div
                className="absolute text-center whitespace-nowrap"
                style={{
                  top: isActive ? 16 : 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  opacity: isActive ? 0.9 : 0.5,
                  transition: 'all 0.2s ease',
                }}
              >
                <span
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    color: isActive ? pt.color : MED_COLORS.GRAY_LIGHT,
                    fontFamily: "'JetBrains Mono','SimHei',monospace",
                  }}
                >
                  {pt.label}
                </span>
              </div>
            </motion.div>
          );
        })}

        {/* ============================================================ */}
        {/* 信息面板 */}
        {/* ============================================================ */}
        <AnimatePresence>
          {activePointIdx !== null && pointPositions[activePointIdx] && (
            <AnalysisPanel
              key={POINTS_CONFIG[activePointIdx].id}
              category={POINTS_CONFIG[activePointIdx]}
              data={panelData}
              {...getPanelPosition(activePointIdx)}
              onMouseEnter={() => {
                panelHoverRef.current = true;
                setLockedPointIdx(activePointIdx);
              }}
              onMouseLeave={() => {
                panelHoverRef.current = false;
                setLockedPointIdx(null);
                setActivePointIdx(null);
              }}
            />
          )}
        </AnimatePresence>

        {/* ============================================================ */}
        {/* WHO 档案按钮 — 右下角浮动，科幻档案入口 */}
        {/* ============================================================ */}
        <motion.button
          className="absolute bottom-5 right-5 z-[150] flex items-center gap-2 px-3 py-2 cursor-pointer"
          style={{
            backgroundColor: 'rgba(245,247,250,0.88)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${MED_COLORS.BLUE}40`,
            borderRadius: '3px',
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          onClick={() => setShowDoc(true)}
          whileHover={{
            borderColor: MED_COLORS.BLUE,
            boxShadow: `0 0 16px ${MED_COLORS.BLUE}30`,
          }}
          title="WHO 鼠疫事实档案"
        >
          <GeoIcons.Report />
          <span
            className="text-[9px] font-bold uppercase tracking-wider"
            style={{
              color: MED_COLORS.BLUE,
              fontFamily: "'JetBrains Mono','SimHei',monospace",
            }}
          >
            WHO 档案
          </span>
          {/* 脉冲指示点 */}
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: MED_COLORS.BLUE,
              boxShadow: `0 0 5px ${MED_COLORS.BLUE}`,
              animation: 'pulse-blue 1.5s ease-in-out infinite',
            }}
          />
        </motion.button>
      </div>

      {/* ============================================================ */}
      {/* WHO 分页电子档案 */}
      {/* ============================================================ */}
      <PaginatedDoc visible={showDoc} onClose={() => setShowDoc(false)} />
    </PageTransition>
  );
};

export default AnalysisView;
