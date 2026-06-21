import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, GeoJSON, LayersControl, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import type { FeatureCollection, Feature } from 'geojson';
import L from 'leaflet';
import {
  MED_COLORS,
  CENTURY_COLORS, CENTURY_LABELS,
  getOutbreakRadius, getOutbreakLabel,
} from '../constants';
import type { EuropeSiteProperties, EuropeStats } from '../constants';
import { CyberpunkPanel, useMouseTilt } from './HUD';
import ResilientTileLayer from './ResilientTileLayer';

// ============================================================
// Props：支持外部预加载数据以消除导航时的加载闪烁
// ============================================================
export interface EuropeMapProps {
  sites?: FeatureCollection | null;
  stats?: EuropeStats | null;
}

// ============================================================
// 地图初始化 — 自动适配边界
// ============================================================
const MapBoundsFit: React.FC<{ sites: FeatureCollection | null }> = ({ sites }) => {
  const map = useMap();
  useEffect(() => {
    if (sites && sites.features.length > 0) {
      const geoLayer = L.geoJSON(sites);
      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    }
  }, [sites, map]);
  return null;
};

// ============================================================
// HUD 统计面板
// ============================================================
const StatsOverlay: React.FC<{ stats: EuropeStats | null }> = ({ stats }) => {
  if (!stats) return null;
  return (
    <CyberpunkPanel title="疫情统计摘要" color={MED_COLORS.BLUE} style={{ top: 24, right: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <StatLine label="总疫点数" value={`${stats.total_cities}`} color={MED_COLORS.BLUE} />
        <StatLine label="总爆发记录" value={`${stats.total_records}`} color={MED_COLORS.VIOLET} />
        <StatLine label="时间跨度" value={stats.year_range} color={MED_COLORS.ORANGE} />
        <div style={{ marginTop: 4, borderTop: `1px solid ${MED_COLORS.GRAY_DARK}`, paddingTop: 4 }}>
          <div style={{ fontSize: 9, color: MED_COLORS.GRAY_LIGHT, textTransform: 'uppercase', marginBottom: 4 }}>
            最严重疫点 TOP 3
          </div>
          {stats.top_cities.slice(0, 3).map((loc, i) => (
            <StatLine
              key={loc.Location}
              label={loc.Location}
              value={`${loc.outbreak_count} 次`}
              color={i === 0 ? MED_COLORS.RED : MED_COLORS.GRAY_LIGHT}
            />
          ))}
        </div>
        {stats.century_stats && (
          <div style={{ marginTop: 4, borderTop: `1px solid ${MED_COLORS.GRAY_DARK}`, paddingTop: 4 }}>
            <div style={{ fontSize: 9, color: MED_COLORS.GRAY_LIGHT, textTransform: 'uppercase', marginBottom: 4 }}>
              按世纪分布
            </div>
            {Object.entries(stats.century_stats)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([century, count]) => {
                const cc = parseInt(century);
                const cColor = CENTURY_COLORS[cc] || MED_COLORS.GRAY_LIGHT;
                return (
                  <StatLine
                    key={century}
                    label={`${century}s`}
                    value={`${count} 地`}
                    color={cColor}
                  />
                );
              })}
          </div>
        )}
      </div>
    </CyberpunkPanel>
  );
};

const StatLine: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
    <span style={{ fontSize: 10, color: MED_COLORS.GRAY_LIGHT, textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontSize: 10, color, fontWeight: 700 }}>{value}</span>
  </div>
);

// ============================================================
// 图例
// ============================================================
const MapLegend: React.FC = () => {
  return (
    <CyberpunkPanel title="图例" color={MED_COLORS.BLUE} style={{ bottom: 24, left: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ fontSize: 9, color: MED_COLORS.GRAY_LIGHT, textTransform: 'uppercase', marginBottom: 2 }}>
          世纪颜色
        </div>
        {Object.entries(CENTURY_LABELS).map(([century, label]) => {
          const c = parseInt(century);
          const color = CENTURY_COLORS[c] || MED_COLORS.GRAY_LIGHT;
          return (
            <div key={century} className="legend-item">
              <div style={{
                width: 20, height: 10,
                backgroundColor: color,
                borderRadius: '50%',
                border: `1px solid ${MED_COLORS.GRAY_MID}`,
              }} />
              <span style={{ color: MED_COLORS.TEXT, fontSize: 9 }}>{label}</span>
            </div>
          );
        })}
        <div style={{ marginTop: 4, borderTop: `1px solid ${MED_COLORS.GRAY_DARK}`, paddingTop: 4 }}>
          <div style={{ fontSize: 9, color: MED_COLORS.GRAY_LIGHT, textTransform: 'uppercase', marginBottom: 2 }}>
            爆发频率 (大小)
          </div>
          {[
            { count: 1, label: getOutbreakLabel(1) },
            { count: 4, label: getOutbreakLabel(4) },
            { count: 8, label: getOutbreakLabel(8) },
            { count: 21, label: getOutbreakLabel(21) },
          ].map(({ count, label }) => (
            <div key={count} className="legend-item">
              <div style={{
                width: getOutbreakRadius(count) * 2,
                height: getOutbreakRadius(count) * 2,
                backgroundColor: MED_COLORS.BLUE + '60',
                borderRadius: '50%',
                border: `1px solid ${MED_COLORS.BLUE}`,
                flexShrink: 0,
              }} />
              <span style={{ color: MED_COLORS.TEXT, fontSize: 9 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </CyberpunkPanel>
  );
};

// ============================================================
// 入场动画阶段
// ============================================================
type IntroPhase = 'title' | 'fading' | 'map';

// ============================================================
// 主地图组件
// ============================================================
const EuropeMap: React.FC<EuropeMapProps> = ({
  sites: externalSites,
  stats: externalStats,
}) => {
  const [sites, setSites] = useState<FeatureCollection | null>(() => externalSites ?? null);
  const [stats, setStats] = useState<EuropeStats | null>(() => externalStats ?? null);
  const [loading, setLoading] = useState(() => !(externalSites));
  const [introPhase, setIntroPhase] = useState<IntroPhase>('title');
  const introTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fetchStartedRef = useRef(false);

  // ============================================================
  // 倾斜逆变换 — 地图容器抵消父级 ParallaxWrapper 的 3D 倾斜
  // ============================================================
  const tilt = useMouseTilt();
  const inverseTransform = (tilt.x !== 0 || tilt.y !== 0)
    ? `perspective(1000px) rotateX(${-tilt.x}deg) rotateY(${-tilt.y}deg)`
    : 'none';

  // ============================================================
  // 核心逻辑：同步外部预加载数据或自行 fetch
  // ============================================================
  useEffect(() => {
    if (externalSites) {
      setSites(externalSites);
      setStats(externalStats ?? null);
      setLoading(false);
      return;
    }

    if (fetchStartedRef.current) return;
    fetchStartedRef.current = true;

    let cancelled = false;
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/plague_europe_sites.geojson`).then(r => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/plague_europe_stats.json`).then(r => r.json()),
    ]).then(([s, st]) => {
      if (!cancelled) {
        setSites(s);
        setStats(st);
        setLoading(false);
      }
    }).catch(err => {
      console.error('Europe data load error:', err);
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [externalSites, externalStats]);

  // ============================================================
  // 入场动画时序控制
  // ============================================================
  useEffect(() => {
    return () => introTimersRef.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (introPhase !== 'title') return;
    const minDisplayMs = loading ? 2000 : 600;
    const t1 = setTimeout(() => setIntroPhase('fading'), minDisplayMs);
    introTimersRef.current.push(t1);
    return () => clearTimeout(t1);
  }, [introPhase, loading]);

  useEffect(() => {
    if (introPhase !== 'fading') return;
    const t2 = setTimeout(() => setIntroPhase('map'), 700);
    introTimersRef.current.push(t2);
    return () => clearTimeout(t2);
  }, [introPhase]);

  // ============================================================
  // 按世纪分层
  // ============================================================
  const centuryLayers = useMemo(() => {
    if (!sites) return [];
    const groups: Record<number, Feature[]> = {};
    for (const f of sites.features) {
      const props = f.properties as EuropeSiteProperties;
      const century = props.CENTURY;
      (groups[century] ??= []).push(f);
    }
    return Object.entries(groups).sort(([a], [b]) => parseInt(a) - parseInt(b));
  }, [sites]);

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
          <div
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: MED_COLORS.BLUE, opacity: isFading ? 0 : 0.4 }}
          >
            INITIALIZING GIS MODULE
          </div>
          <h2
            className="text-2xl font-bold tracking-tighter uppercase"
            style={{
              color: MED_COLORS.GRAY_LIGHT,
              animation: isFading ? 'none' : 'title-flicker 0.15s infinite',
            }}
          >
            欧洲 · 腺鼠疫 1347-1900
          </h2>
          <p
            className="text-[10px] uppercase tracking-wider"
            style={{
              color: MED_COLORS.GRAY_LIGHT,
              opacity: isFading ? 0 : 0.3,
              animation: isFading ? 'none' : 'title-flicker 0.2s infinite',
            }}
          >
            LOADING // 历史疫情数据加载中
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* 地图容器 — 应用逆变换抵消父级倾斜 */}
      <div
        className="h-full w-full transition-transform duration-300 ease-out"
        style={{ transform: inverseTransform }}
      >
        <MapContainer
          center={[48, 10]}
          zoom={4}
          minZoom={3}
          maxZoom={12}
          maxBounds={[[28, -20], [72, 50]]}
          maxBoundsViscosity={0.8}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          {/* 底图 — 与东北页面一致，多源容错 */}
          <ResilientTileLayer
            sources={[
              'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
            ]}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
          />

          <LayersControl position="topright">
            {/* ===== 按世纪分层的疫点图层 ===== */}
            {centuryLayers.map(([century, features]) => {
              const c = parseInt(century);
              const fc: FeatureCollection = { type: 'FeatureCollection', features };
              const centuryColor = CENTURY_COLORS[c] || MED_COLORS.GRAY_LIGHT;
              const label = CENTURY_LABELS[c] || `${century}s`;
              return (
                <LayersControl.Overlay checked={true} name={`${label} · ${features.length} 疫点`} key={century}>
                  <GeoJSON
                    key={`sites-century-${century}`}
                    data={fc}
                    pointToLayer={(feature, latlng) => {
                      const props = feature.properties as EuropeSiteProperties;
                      const r = getOutbreakRadius(props.COUNT);
                      return L.circleMarker(latlng, {
                        radius: r,
                        fillColor: centuryColor,
                        color: '#FFF',
                        weight: 1,
                        opacity: 0.85,
                        fillOpacity: 0.7,
                      });
                    }}
                    onEachFeature={(feature, layer) => {
                      const props = feature.properties as EuropeSiteProperties;
                      const yearsList = props.YEARS.split(',').slice(0, 20).join(', ');
                      const moreCount = props.COUNT > 20 ? ` ... 等共 ${props.COUNT} 次` : '';
                      const centuryLabel = CENTURY_LABELS[props.CENTURY] || `${props.CENTURY}s`;
                      const popupHtml = `
                        <div style="font-family:'JetBrains Mono',Consolas,SimHei,monospace;font-size:11px;min-width:200px">
                          <div style="background:${centuryColor};color:#FFF;padding:6px 10px;font-weight:700;font-size:13px;letter-spacing:0.05em;display:flex;justify-content:space-between;align-items:center">
                            <span>${props.NAME}</span>
                            <span style="font-size:9px;opacity:0.75">${centuryLabel}</span>
                          </div>
                          <div style="padding:8px 10px;display:flex;flex-direction:column;gap:4px">
                            <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:9px">首发年</span><span style="color:${MED_COLORS.RED};font-weight:700">${props.FIRST_YR}</span></div>
                            <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:9px">末发年</span><span style="color:${MED_COLORS.ORANGE};font-weight:700">${props.LAST_YR}</span></div>
                            <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:9px">爆发次数</span><span style="color:${MED_COLORS.BLUE};font-weight:700">${props.COUNT}</span></div>
                            <div style="margin-top:4px;border-top:1px solid ${MED_COLORS.GRAY_DARK};padding-top:4px">
                              <span style="color:${MED_COLORS.GRAY_LIGHT};font-size:8px">年份: </span>
                              <span style="color:${MED_COLORS.TEXT};font-size:9px">${yearsList}${moreCount}</span>
                            </div>
                          </div>
                        </div>`;
                      layer.bindPopup(popupHtml, { maxWidth: 300 });
                      layer.on('mouseover', (e) => {
                        const l = e.target;
                        l.setStyle({ fillOpacity: 1, weight: 2.5, color: '#FFF', radius: l.options.radius * 1.3 });
                        l.bringToFront();
                      });
                      layer.on('mouseout', (e) => {
                        const l = e.target;
                        const r2 = getOutbreakRadius(props.COUNT);
                        l.setStyle({ fillOpacity: 0.7, weight: 1, color: '#FFF', radius: r2 });
                      });
                    }}
                  />
                </LayersControl.Overlay>
              );
            })}
          </LayersControl>

          {/* 自动适配边界 */}
          <MapBoundsFit sites={sites} />
        </MapContainer>
      </div>

      {/* HUD 覆盖层 */}
      <StatsOverlay stats={stats} />
      <MapLegend />

      {/* ===== 数据来源标注 ===== */}
      <CyberpunkPanel
        title="数据来源"
        color={MED_COLORS.BLUE}
        style={{ bottom: 24, right: 24 }}
      >
        <div style={{ fontSize: 9, color: MED_COLORS.TEXT, lineHeight: 1.6, maxWidth: 280 }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: MED_COLORS.BLUE }}>
            Büntgen, U., Ginzler, C., Esper, J., Tegel, W. & McMichael, A.J.
          </div>
          <div style={{ color: MED_COLORS.GRAY_LIGHT, marginBottom: 2 }}>
            Digitizing Historical Plague
          </div>
          <div style={{ color: MED_COLORS.GRAY_LIGHT, marginBottom: 2 }}>
            Clinical Infectious Diseases, 55(11), 1586–1588 (2012)
          </div>
          <div style={{ color: MED_COLORS.GRAY_LIGHT, marginBottom: 4 }}>
            基于 Biraben (1976) 原始清单 · 6,929 条爆发记录
          </div>
          <a
            href="https://doi.org/10.1093/cid/cis723"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: MED_COLORS.BLUE, textDecoration: 'underline', fontSize: 9 }}
          >
            DOI: 10.1093/cid/cis723
          </a>
          <span style={{ color: MED_COLORS.GRAY_LIGHT, fontSize: 9, margin: '0 4px' }}>|</span>
          <a
            href="https://opendata.swiss/en/dataset/digitizing-historical-plague"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: MED_COLORS.BLUE, textDecoration: 'underline', fontSize: 9 }}
          >
            opendata.swiss
          </a>
        </div>
      </CyberpunkPanel>

    </div>
  );
};

export default EuropeMap;
