import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import type { FeatureCollection, Feature } from 'geojson';
import L from 'leaflet';
import {
  MED_COLORS, SYSTEM_INFO,
  PROVINCE_COLORS, getSpeedColor, getSpeedLabel, getNodeDegreeRadius,
} from '../constants';
import type { RegionProperties, SiteProperties, PlagueStats } from '../constants';

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
// 区域面样式
// ============================================================
const regionStyle = (feature?: Feature) => {
  const props = feature?.properties as RegionProperties | undefined;
  const v = props?.V ?? 0;
  const color = getSpeedColor(v);
  return {
    fillColor: color,
    weight: 1,
    opacity: 0.7,
    color: MED_COLORS.GRAY_LIGHT,
    fillOpacity: 0.35,
    dashArray: '',
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
  { label: '10-20 km/d · 高', color: MED_COLORS.RED },
  { label: '5-10 km/d · 中', color: MED_COLORS.ORANGE },
  { label: '2-5 km/d · 低', color: MED_COLORS.BLUE },
  { label: '<2 km/d · 极低', color: MED_COLORS.GREEN },
];

const MapLegend: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="hud-panel" style={{
      position: 'absolute', bottom: 24, left: 24, zIndex: 1000,
      padding: collapsed ? '6px 10px' : '10px 14px',
      cursor: 'default',
    }}>
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: MED_COLORS.BLUE,
          marginBottom: collapsed ? 0 : 8, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <span style={{
          display: 'inline-block', width: 6, height: 6,
          background: MED_COLORS.BLUE, borderRadius: '50%',
          boxShadow: `0 0 4px ${MED_COLORS.BLUE}`,
          animation: collapsed ? 'none' : 'pulse-blue 1.5s ease-in-out infinite',
        }} />
        传播速度图例
        <span style={{ fontSize: 8, opacity: 0.4 }}>{collapsed ? '▶' : '▼'}</span>
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================
// HUD 统计面板
// ============================================================
const StatsOverlay: React.FC<{ stats: PlagueStats | null }> = ({ stats }) => {
  if (!stats) return null;
  return (
    <div className="hud-panel" style={{
      position: 'absolute', top: 24, right: 24, zIndex: 1000,
      padding: '12px 16px', minWidth: 220,
    }}>
      <div style={{
        fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: MED_COLORS.BLUE, marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{
          display: 'inline-block', width: 6, height: 6,
          background: MED_COLORS.BLUE, borderRadius: '50%',
          boxShadow: `0 0 4px ${MED_COLORS.BLUE}`,
          animation: 'pulse-blue 1.5s ease-in-out infinite',
        }} />
        疫情统计摘要
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <StatLine label="疫区数" value={`${stats.total_regions}`} color={MED_COLORS.BLUE} />
        <StatLine label="疫点数" value={`${stats.total_sites}`} color={MED_COLORS.VIOLET} />
        <StatLine label="总死亡人数" value={stats.total_deaths.toLocaleString()} color={MED_COLORS.RED} />
        <div style={{ marginTop: 4, borderTop: `1px solid ${MED_COLORS.GRAY_DARK}`, paddingTop: 4 }}>
          {Object.entries(stats.provinces).map(([prov, s]) => (
            <StatLine key={prov} label={prov} value={`${s.region_count} 区 · ${s.total_deaths.toLocaleString()} 死`}
              color={PROVINCE_COLORS[prov] || MED_COLORS.GRAY_LIGHT} />
          ))}
        </div>
        <div style={{ marginTop: 4, borderTop: `1px solid ${MED_COLORS.GRAY_DARK}`, paddingTop: 4 }}>
          <div style={{ fontSize: 8, color: MED_COLORS.GRAY_LIGHT, textTransform: 'uppercase' }}>
            最快传播: <span style={{ color: MED_COLORS.RED, fontWeight: 700 }}>{stats.max_speed_region}</span>
            <span style={{ marginLeft: 4 }}>({stats.max_speed_value.toFixed(1)} km/d)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatLine: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
    <span style={{ fontSize: 9, color: MED_COLORS.GRAY_LIGHT, textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontSize: 11, color, fontWeight: 700 }}>{value}</span>
  </div>
);

// ============================================================
// 主地图组件
// ============================================================
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

  // 防止重复 fetch 的标记
  const fetchStartedRef = useRef(false);
  const mountedRef = useRef(true);

  // ============================================================
  // 核心逻辑：同步外部预加载数据或自行 fetch
  // ============================================================
  useEffect(() => {
    mountedRef.current = true;

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
      fetch('/data/plague_region.geojson').then(r => r.json()),
      fetch('/data/plague_sites.geojson').then(r => r.json()),
      fetch('/data/plague_stats.json').then(r => r.json()),
    ]).then(([r, s, st]) => {
      if (!cancelled && mountedRef.current) {
        setRegions(r);
        setSites(s);
        setStats(st);
        setLoading(false);
      }
    }).catch(err => {
      console.error('Map data load error:', err);
      if (!cancelled && mountedRef.current) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [externalRegions, externalSites, externalStats]);

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
          <div style="font-family:'JetBrains Mono',Consolas,SimHei,monospace;font-size:11px">
            <div style="background:${MED_COLORS.BLUE};color:#FFF;padding:6px 10px;font-weight:700;font-size:13px;letter-spacing:0.05em;display:flex;justify-content:space-between;align-items:center">
              <span>${props.NAME_CH}</span>
              <span style="font-size:9px;opacity:0.75">${props.NAME_PY}</span>
            </div>
            <div style="padding:8px 10px;display:flex;flex-direction:column;gap:4px">
              <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:9px">省份</span><span style="color:${PROVINCE_COLORS[props.LEV1_CH] || MED_COLORS.GRAY_LIGHT};font-weight:700">${props.LEV1_CH}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:9px">传播速度</span><span style="color:${getSpeedColor(props.V)};font-weight:700">${props.V?.toFixed(2)} km/d</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:9px">死亡人数</span><span style="color:${MED_COLORS.RED};font-weight:700">${(props.deaths ?? 0).toLocaleString()}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:9px">节点度</span><span style="color:${MED_COLORS.BLUE};font-weight:700">${props.node_degree ?? '--'}</span></div>
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

  // 加载中状态
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: MED_COLORS.BG }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: `2px solid ${MED_COLORS.BLUE}`,
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 16px',
          }} />
          <div style={{ fontSize: 11, color: MED_COLORS.BLUE, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            加载中 · INITIALIZING GIS MODULE
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[43.5, 124]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={false}
      >
        {/* 底图 — 浅灰色医疗风格 */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        <LayersControl position="topright">
          {/* ===== 区域面图层 ===== */}
          <LayersControl.Overlay checked name="疫区面 (传播速度)">
            {regions && (
              <GeoJSON
                key="regions"
                data={regions}
                style={regionStyle}
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
                      <div style="font-family:'JetBrains Mono',Consolas,SimHei,monospace;font-size:11px;min-width:200px">
                        <div style="background:${provColor};color:#FFF;padding:6px 10px;font-weight:700;font-size:13px;letter-spacing:0.05em;display:flex;justify-content:space-between;align-items:center">
                          <span>${props.NAME_CH}</span>
                          <span style="font-size:9px;opacity:0.75">${props.LEV1_CH}</span>
                        </div>
                        <div style="padding:8px 10px;display:flex;flex-direction:column;gap:4px">
                          <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:9px">首发日</span><span style="color:${MED_COLORS.RED};font-weight:700">${props.SFR}</span></div>
                          <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:9px">终止日</span><span style="color:${MED_COLORS.ORANGE};font-weight:700">${props.ZZR}</span></div>
                          <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:9px">节点度</span><span style="color:${MED_COLORS.VIOLET};font-weight:700">${props.JDD}</span></div>
                          <div style="display:flex;justify-content:space-between"><span style="color:${MED_COLORS.GRAY_LIGHT};font-size:9px">死亡人数</span><span style="color:${MED_COLORS.RED};font-weight:700">${(props.deaths ?? 0).toLocaleString()}</span></div>
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
      </MapContainer>

      {/* HUD 覆盖层 */}
      <StatsOverlay stats={stats} />
      <MapLegend />

      {/* 标题栏 */}
      <div className="hud-panel" style={{
        position: 'absolute', top: 24, left: 24, zIndex: 1000,
        padding: '8px 14px',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: MED_COLORS.BLUE, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          东北 · 肺鼠疫 1910-1911
        </div>
        <div style={{ fontSize: 8, color: MED_COLORS.GRAY_LIGHT, textTransform: 'uppercase', marginTop: 2 }}>
          GIS Projection: Xian 1980 → WGS84 | 疫情传播可视化
        </div>
      </div>
    </div>
  );
};

export default ChinaMap;
