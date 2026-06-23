import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { MapContainer, GeoJSON, LayersControl, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import type { FeatureCollection, Feature } from 'geojson';
import L from 'leaflet';
import {
  MED_COLORS,
  PROVINCE_COLORS, getSpeedColor, getSpeedLabel, getNodeDegreeRadius,
  ANIMATION,
} from '../constants';
import type { RegionProperties, SiteProperties, PlagueStats } from '../constants';
import { CyberpunkPanel, useMouseTilt } from './HUD';
import ChinaBoundary from './ChinaBoundary';
import SouthChinaSeaInset from './SouthChinaSeaInset';
import ResilientTileLayer from './ResilientTileLayer';
import { extractSortedDates, dateToEpoch } from '../utils/dateUtils';
import { useTimeController } from './useTimeController';
import DateDisplay from './DateDisplay';
import PlaybackControls from './PlaybackControls';

// ============================================================
// Props：支持外部预加载数据以消除导航时的加载闪烁
// ============================================================
export interface ChinaMapProps {
  regions?: FeatureCollection | null;
  sites?: FeatureCollection | null;
  stats?: PlagueStats | null;
}

// ============================================================
// 地图初始化 — 自动适配边界
// ============================================================
const MapBoundsFit: React.FC<{ regions: FeatureCollection | null }> = ({ regions }) => {
  const map = useMap();
  useEffect(() => {
    if (regions) {
      const geoLayer = L.geoJSON(regions);
      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [regions, map]);
  return null;
};

// ============================================================
// 区域面样式 — 无首发日期的区域（行政枢纽）使用虚线低透明度
// ============================================================
const regionStyle = (feature?: Feature) => {
  const props = feature?.properties as RegionProperties | undefined;
  const v = props?.V ?? 0;
  const color = getSpeedColor(v);
  const rawDate = props?.first_date;
  const hasDate = rawDate && rawDate.trim() !== '';

  return {
    fillColor: color,
    weight: hasDate ? 1 : 0.5,
    opacity: hasDate ? 0.7 : 0.3,
    color: hasDate ? MED_COLORS.GRAY_LIGHT : MED_COLORS.GRAY_MID,
    fillOpacity: hasDate ? 0.35 : 0.12,
    dashArray: hasDate ? '' : '4 3',
  };
};

const regionStyleHover = {
  weight: 2,
  opacity: 1,
  color: MED_COLORS.BLUE,
  fillOpacity: 0.55,
  dashArray: '4 2',
};

// ============================================================
// 图例
// ============================================================
const SPEED_LEGEND_ITEMS = [
  { label: '>20 km/d · 极高', color: '#991B1B' },
  { label: '10-20 km/d · 高', color: '#DC2626' },
  { label: '5-10 km/d · 中', color: '#F97316' },
  { label: '2-5 km/d · 低', color: '#3B82F6' },
  { label: '<2 km/d · 极低', color: '#22C55E' },
];

const MapLegend: React.FC = () => {
  return (
    <CyberpunkPanel title="传播速度图例" color={MED_COLORS.BLUE} style={{ bottom: 24, left: 85 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {SPEED_LEGEND_ITEMS.map(item => (
          <div key={item.label} className="legend-item">
            <div style={{
              width: 24, height: 10,
              backgroundColor: item.color,
              border: `1px solid ${MED_COLORS.GRAY_MID}`,
            }} />
            <span style={{ color: MED_COLORS.TEXT }}>{item.label}</span>
          </div>
        ))}
        <div style={{ marginTop: 6, borderTop: `1px solid ${MED_COLORS.GRAY_DARK}`, paddingTop: 6 }}>
          <span className="legend-item" style={{ color: MED_COLORS.GRAY_LIGHT }}>
            ● 站点大小 = 节点度 (传播连接数)
          </span>
        </div>
      </div>
    </CyberpunkPanel>
  );
};

// ============================================================
// HUD 统计面板
// ============================================================
const StatsOverlay: React.FC<{ stats: PlagueStats | null }> = ({ stats }) => {
  if (!stats) return null;
  return (
    <CyberpunkPanel title="疫情统计摘要" color={MED_COLORS.BLUE} style={{ top: 24, right: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <StatLine label="疫区数" value={`${stats.total_regions}`} color={MED_COLORS.BLUE} />
        <StatLine label="疫点数" value={`${stats.total_sites}`} color="#8B5CF6" />
        <StatLine label="总死亡人数" value={stats.total_deaths.toLocaleString()} color={MED_COLORS.RED} />
        <div style={{ marginTop: 4, borderTop: `1px solid ${MED_COLORS.GRAY_DARK}`, paddingTop: 4 }}>
          {Object.entries(stats.provinces).map(([prov, s]) => (
            <StatLine key={prov} label={prov} value={`${s.region_count} 区 · ${s.total_deaths.toLocaleString()} 死`}
              color={PROVINCE_COLORS[prov] || MED_COLORS.GRAY_LIGHT} />
          ))}
        </div>
        <div style={{ marginTop: 4, borderTop: `1px solid ${MED_COLORS.GRAY_DARK}`, paddingTop: 4 }}>
          <div style={{ fontSize: 12, color: MED_COLORS.GRAY_LIGHT, textTransform: 'uppercase' }}>
            最快传播: <span style={{ color: MED_COLORS.RED, fontWeight: 700 }}>{stats.max_speed_region}</span>
            <span style={{ marginLeft: 4 }}>({stats.max_speed_value.toFixed(1)} km/d)</span>
          </div>
        </div>
      </div>
    </CyberpunkPanel>
  );
};

const StatLine: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
    <span style={{ fontSize: 12, color: MED_COLORS.GRAY_LIGHT, textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontSize: 13, color, fontWeight: 700 }}>{value}</span>
  </div>
);

// ============================================================
// 主地图组件
// ============================================================
// 入场动画阶段
type IntroPhase = 'title' | 'fading' | 'map';

const ChinaMap: React.FC<ChinaMapProps> = ({
  regions: externalRegions,
  sites: externalSites,
  stats: externalStats,
}) => {
  // 本地数据状态
  const [regions, setRegions] = useState<FeatureCollection | null>(() => externalRegions ?? null);
  const [sites, setSites] = useState<FeatureCollection | null>(() => externalSites ?? null);
  const [stats, setStats] = useState<PlagueStats | null>(() => externalStats ?? null);
  const [loading, setLoading] = useState(() => !(externalRegions && externalSites));

  // 入场动画状态
  const [introPhase, setIntroPhase] = useState<IntroPhase>('title');
  const introTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 防止重复 fetch 的标记
  const fetchStartedRef = useRef(false);

  // ============================================================
  // 倾斜逆变换 — 地图容器抵消父级 ParallaxWrapper 的 3D 倾斜
  // 使地图保持平坦，而周围 HUD 面板仍随鼠标倾斜
  // ============================================================
  const tilt = useMouseTilt();
  const inverseTransform = (tilt.x !== 0 || tilt.y !== 0)
    ? `perspective(1000px) rotateX(${-tilt.x}deg) rotateY(${-tilt.y}deg)`
    : 'none';

  // ============================================================
  // 核心逻辑：同步外部预加载数据或自行 fetch
  // ============================================================
  useEffect(() => {
    // 如果外部数据可用，直接使用
    if (externalRegions && externalSites) {
      setRegions(externalRegions);
      setSites(externalSites);
      setStats(externalStats ?? null);
      setLoading(false);
      return;
    }

    // 如果已经发起过 fetch，不重复请求
    if (fetchStartedRef.current) return;
    fetchStartedRef.current = true;

    // 自行加载数据
    let cancelled = false;
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/plague_region.geojson`).then(r => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/plague_sites.geojson`).then(r => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/plague_stats.json`).then(r => r.json()),
    ]).then(([r, s, st]) => {
      if (!cancelled) {
        setRegions(r);
        setSites(s);
        setStats(st);
        setLoading(false);
      }
    }).catch(err => {
      console.error('Map data load error:', err);
      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [externalRegions, externalSites, externalStats]);

  // ============================================================
  // 入场动画时序控制
  // title（闪烁）→ fading（淡出）→ map（地图显示）
  // ============================================================
  useEffect(() => {
    return () => introTimersRef.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (introPhase !== 'title') return;

    // 数据就绪后至少保留标题闪烁 0.6s
    const minDisplayMs = loading ? 2000 : 600;

    const t1 = setTimeout(() => {
      setIntroPhase('fading');
    }, minDisplayMs);
    introTimersRef.current.push(t1);

    return () => clearTimeout(t1);
  }, [introPhase, loading]);

  useEffect(() => {
    if (introPhase !== 'fading') return;

    // 淡出动画持续 0.7s 后切到地图
    const t2 = setTimeout(() => {
      setIntroPhase('map');
    }, 700);
    introTimersRef.current.push(t2);

    return () => clearTimeout(t2);
  }, [introPhase]);

  // ============================================================
  // 时间动画相关 — 从 regions 中提取排序日期
  // ============================================================
  const sortedDates = useMemo(() => {
    if (!regions) return [] as string[];
    return extractSortedDates(regions.features);
  }, [regions]);

  const { state: timeState, actions: timeActions } = useTimeController({
    sortedDates,
    baseIntervalMs: ANIMATION.BASE_INTERVAL_MS,
    autoPlay: true,
  });

  // 追踪新出现的区域，用于高亮效果
  const [newRegionNames, setNewRegionNames] = useState<Set<string>>(new Set());
  const prevEpochsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const prev = prevEpochsRef.current;
    const curr = timeState.visibleEpochs;

    // 找出本轮新增的 epoch
    const newEpochs = new Set<number>();
    for (const e of curr) {
      if (!prev.has(e)) {
        newEpochs.add(e);
      }
    }

    if (newEpochs.size > 0 && regions) {
      // 收集新出现区域的名字
      const names = new Set<string>();
      for (const f of regions.features) {
        const props = f.properties as RegionProperties | undefined;
        const raw = props?.first_date;
        if (raw && raw.trim() !== '') {
          const epoch = dateToEpoch(raw);
          if (epoch !== null && newEpochs.has(epoch)) {
            names.add(props?.NAME_CH ?? '');
          }
        }
      }

      if (names.size > 0) {
        setNewRegionNames(names);
        // 1.5 秒后清除高亮
        const timer = setTimeout(() => {
          setNewRegionNames(new Set());
        }, ANIMATION.NEW_REGION_HIGHLIGHT_MS);
        return () => clearTimeout(timer);
      }
    }

    prevEpochsRef.current = new Set(curr);
  }, [timeState.visibleEpochs, timeState.currentFrameIndex, regions]);

  // ============================================================
  // 根据时间过滤区域
  // ============================================================
  const filteredRegionFC = useMemo((): FeatureCollection | null => {
    if (!regions) return null;

    const filtered = regions.features.filter(f => {
      const props = f.properties as RegionProperties | undefined;
      const raw = props?.first_date;
      if (!raw || raw.trim() === '') {
        // 无首发日期的行政枢纽始终可见
        return true;
      }
      const epoch = dateToEpoch(raw);
      if (epoch === null) return true;
      // 在当前时间之前或等于当前时间的区域可见
      return timeState.visibleEpochs.has(epoch);
    });

    return {
      type: 'FeatureCollection',
      features: filtered,
    };
  }, [regions, timeState.visibleEpochs]);

  // 动态区域样式 — 新出现的区域高亮显示
  const dynamicRegionStyle = useCallback((feature?: Feature) => {
    const base = regionStyle(feature);
    const props = feature?.properties as RegionProperties | undefined;
    const name = props?.NAME_CH ?? '';

    if (newRegionNames.has(name)) {
      return {
        ...base,
        fillOpacity: 0.65,
        weight: 2,
        opacity: 1,
        color: MED_COLORS.RED,
        dashArray: '',
      };
    }
    return base;
  }, [newRegionNames]);

  // 站点按省份分色
  const siteProvinceLayers = useMemo(() => {
    if (!sites) return [];
    const groups: Record<string, Feature[]> = {};
    for (const f of sites.features) {
      const prov = (f.properties as SiteProperties)?.LEV1_CH || '未知';
      (groups[prov] ??= []).push(f);
    }
    return Object.entries(groups);
  }, [sites]);

  // Region 事件处理
  const onEachRegion = (feature: Feature, layer: L.Layer) => {
    const props = feature.properties as RegionProperties;
    const popup = L.popup({
      className: 'terminal-popup',
      maxWidth: 300,
      closeButton: true,
    }).setContent(
      `<div id="popup-${props.NAME_CH}" style="min-width:240px"></div>`
    );

    layer.bindPopup(popup);
    layer.on('popupopen', () => {
      const el = document.getElementById(`popup-${props.NAME_CH}`);
      if (el) {
        el.innerHTML = `
          <div style="font-family:'JetBrains Mono',Consolas,SimHei,monospace;font-size:13px">
            <div style="background:${MED_COLORS.BLUE};color:#FFF;padding:6px 10px;font-weight:700;font-size:15px;letter-spacing:0.05em;display:flex;justify-content:space-between;align-items:center">
              <span>${props.NAME_CH}</span>
              <span style="font-size:12px;opacity:0.75">${props.NAME_PY}</span>
            </div>
            <div style="padding:8px 10px;display:flex;flex-direction:column;gap:4px">
              <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:12px">省份</span><span style="color:${PROVINCE_COLORS[props.LEV1_CH] || MED_COLORS.GRAY_LIGHT};font-weight:700;font-size:12px">${props.LEV1_CH}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:12px">传播速度</span><span style="color:${getSpeedColor(props.V)};font-weight:700;font-size:12px">${props.V?.toFixed(2)} km/d</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:12px">死亡人数</span><span style="color:${MED_COLORS.RED};font-weight:700;font-size:12px">${(props.deaths ?? 0).toLocaleString()}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:12px">节点度</span><span style="color:${MED_COLORS.BLUE};font-weight:700;font-size:12px">${props.node_degree ?? '--'}</span></div>
            </div>
          </div>`;
      }
    });

    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle(regionStyleHover);
        l.bringToFront();
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(regionStyle(feature));
      },
    });
  };

  // ============================================================
  // 入场动画：标题闪烁 → 淡出 → 地图
  // ============================================================
  if (introPhase !== 'map') {
    const isFading = introPhase === 'fading';
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: MED_COLORS.BG }}>
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 1 }}
          animate={{ opacity: isFading ? 0 : 1 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          {/* 顶部小字 — 无闪烁，稳定 */}
          <div
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: MED_COLORS.BLUE, opacity: isFading ? 0 : 0.4 }}
          >
            INITIALIZING GIS MODULE
          </div>

          {/* 主标题 — 闪烁效果 */}
          <h2
            className="text-2xl font-bold tracking-tighter uppercase"
            style={{
              color: MED_COLORS.GRAY_LIGHT,
              animation: isFading ? 'none' : 'title-flicker 0.15s infinite',
            }}
          >
            东北 · 肺鼠疫 1910-1911
          </h2>

          {/* 底部副标题 — 闪烁 */}
          <p
            className="text-[10px] uppercase tracking-wider"
            style={{
              color: MED_COLORS.GRAY_LIGHT,
              opacity: isFading ? 0 : 0.3,
              animation: isFading ? 'none' : 'title-flicker 0.2s infinite',
            }}
          >
            LOADING // 地图数据加载中
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* 地图容器 — 应用逆变换抵消父级倾斜，保持地图平坦 */}
      <div
        className="h-full w-full transition-transform duration-300 ease-out"
        style={{ transform: inverseTransform }}
      >
        <MapContainer
          center={[43.5, 124]}
          zoom={6}
          minZoom={3}
          maxZoom={12}
          maxBounds={[[-10, 40], [70, 180]]}
          maxBoundsViscosity={0.8}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
        {/* 底图 — 浅灰色医疗风格，多源容错 */}
        <ResilientTileLayer
          sources={[
            'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
          ]}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
        />

        <LayersControl position="topright">
          {/* ===== 区域面图层（时间过滤） ===== */}
          <LayersControl.Overlay checked name="疫区面 (传播速度)">
            {filteredRegionFC && (
              <GeoJSON
                key={`regions-${timeState.currentFrameIndex}`}
                data={filteredRegionFC}
                style={dynamicRegionStyle}
                onEachFeature={onEachRegion}
              />
            )}
          </LayersControl.Overlay>

          {/* ===== 站点图层（按省份分层） ===== */}
          {siteProvinceLayers.map(([prov, features]) => {
            const fc: FeatureCollection = { type: 'FeatureCollection', features };
            const provColor = PROVINCE_COLORS[prov] || MED_COLORS.GRAY_LIGHT;
            return (
              <LayersControl.Overlay checked name={`疫点 · ${prov}`} key={prov}>
                <GeoJSON
                  key={`sites-${prov}`}
                  data={fc}
                  pointToLayer={(feature, latlng) => {
                    const props = feature.properties as SiteProperties;
                    const r = getNodeDegreeRadius(props.JDD);
                    return L.circleMarker(latlng, {
                      radius: r,
                      fillColor: provColor,
                      color: '#FFF',
                      weight: 1.5,
                      opacity: 0.9,
                      fillOpacity: 0.75,
                    });
                  }}
                  onEachFeature={(feature, layer) => {
                    const props = feature.properties as SiteProperties;
                    const popupHtml = `
                      <div style="font-family:'JetBrains Mono',Consolas,SimHei,monospace;font-size:13px;min-width:200px">
                        <div style="background:${provColor};color:#FFF;padding:6px 10px;font-weight:700;font-size:15px;letter-spacing:0.05em;display:flex;justify-content:space-between;align-items:center">
                          <span>${props.NAME_CH}</span>
                          <span style="font-size:12px;opacity:0.75">${props.LEV1_CH}</span>
                        </div>
                        <div style="padding:8px 10px;display:flex;flex-direction:column;gap:4px">
                          <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:12px">首发日</span><span style="color:${MED_COLORS.RED};font-weight:700;font-size:12px">${props.SFR}</span></div>
                          <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:12px">终止日</span><span style="color:#F97316;font-weight:700;font-size:12px">${props.ZZR}</span></div>
                          <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:12px">节点度</span><span style="color:#8B5CF6;font-weight:700;font-size:12px">${props.JDD}</span></div>
                          <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:12px">死亡人数</span><span style="color:${MED_COLORS.RED};font-weight:700;font-size:12px">${(props.deaths ?? 0).toLocaleString()}</span></div>
                        </div>
                      </div>`;
                    layer.bindPopup(popupHtml, { maxWidth: 280 });
                    layer.on('mouseover', (e) => {
                      const l = e.target;
                      l.setStyle({ fillOpacity: 1, weight: 3, color: '#FFF', radius: l.options.radius * 1.3 });
                      l.bringToFront();
                    });
                    layer.on('mouseout', (e) => {
                      const l = e.target;
                      const r2 = getNodeDegreeRadius(props.JDD);
                      l.setStyle({ fillOpacity: 0.75, weight: 1.5, color: '#FFF', radius: r2 });
                    });
                  }}
                />
              </LayersControl.Overlay>
            );
          })}
        </LayersControl>

        {/* 自动适配边界 */}
        <MapBoundsFit regions={regions} />

        {/* 中国国界线叠加层（省界 + 九段线）— 始终可见，不入 LayersControl */}
        <ChinaBoundary />

      </MapContainer>
      </div>

      {/* HUD 覆盖层 — 右上统计面板 */}
      <StatsOverlay stats={stats} />
      {/* 左下角图例保留，但在动画运行时被日期面板和播放控件覆盖位置 */}
      <MapLegend />

      {/* 时间动画 HUD */}
      <DateDisplay
        currentDate={timeState.currentDate}
        frameIndex={timeState.currentFrameIndex}
        totalFrames={timeState.totalFrames}
        progress={timeState.progress}
        isPlaying={timeState.isPlaying}
        hasReachedEnd={timeState.hasReachedEnd}
        regions={regions}
        visibleEpochs={timeState.visibleEpochs}
      />
      <PlaybackControls
        isPlaying={timeState.isPlaying}
        speed={timeState.speed}
        hasReachedEnd={timeState.hasReachedEnd}
        onTogglePlay={timeActions.toggle}
        onRestart={timeActions.restart}
        onSetSpeed={timeActions.setSpeed}
      />

      {/* ===== 数据来源标注 ===== */}
      <CyberpunkPanel
        title="数据来源"
        color={MED_COLORS.BLUE}
        style={{ top: 24, left: '50%', transform: 'translateX(-50%)' }}
      >
        <div style={{ fontSize: 12, color: MED_COLORS.TEXT, lineHeight: 1.6, maxWidth: 320 }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: MED_COLORS.BLUE }}>
            刘晓峥, 龚胜生*
          </div>
          <div style={{ color: MED_COLORS.GRAY_LIGHT, marginBottom: 2 }}>
            1910-1911年东北大鼠疫传播与死亡时空数据集
          </div>
          <div style={{ color: MED_COLORS.GRAY_LIGHT, marginBottom: 2 }}>
            全球变化数据仓储电子杂志(中英文), 2025
          </div>
          <div style={{ color: MED_COLORS.GRAY_LIGHT, marginBottom: 4 }}>
            CSTR: 20146.11.2025.01.06.V1
          </div>
          <a
            href="https://doi.org/10.3974/geodb.2025.01.06.V1"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: MED_COLORS.BLUE, textDecoration: 'underline', fontSize: 11 }}
          >
            DOI: 10.3974/geodb.2025.01.06.V1
          </a>
        </div>
      </CyberpunkPanel>

      {/* 南海诸岛缩略图 */}
      <SouthChinaSeaInset />
    </div>
  );
};

export default ChinaMap;
