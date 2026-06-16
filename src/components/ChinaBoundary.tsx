import React, { useEffect, useState } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import type { FeatureCollection } from 'geojson';
import { MED_COLORS } from '../constants';

// ============================================================
// 中国国界线叠加层
// - 省界多边形（浅灰填充 + 细灰边框）
// - 九段线（红色虚线 MultiLineString）
// 数据已预处理为 WGS-84 坐标系，与底图一致
// ============================================================

export interface BoundaryData {
  provinces: FeatureCollection | null;
  nineDash: FeatureCollection | null;
}

/** 省界多边形样式 — 参考自然资源部标准地图 */
const provinceStyle = {
  fillColor: '#F8FAFC',
  weight: 0.6,
  opacity: 0.55,
  color: '#94A3B8',
  fillOpacity: 0.08,
};

/** 省界 hover 样式 */
const provinceHoverStyle = {
  weight: 1.5,
  opacity: 0.8,
  color: MED_COLORS.BLUE,
  fillOpacity: 0.15,
};

/** 九段线样式 — 红色虚线 */
const nineDashStyle = {
  color: MED_COLORS.RED,
  weight: 2,
  opacity: 0.75,
  dashArray: '10 6',
  fillOpacity: 0,
};

// ============================================================
// 国界线层（放在 MapContainer 内部使用 useMap）
// ============================================================
const ChinaBoundaryLayers: React.FC<{ data: BoundaryData }> = ({ data }) => {
  const map = useMap();

  // 省界交互事件
  useEffect(() => {
    if (!data.provinces) return;
    // Leaflet GeoJSON 的 onEachFeature 在组件层处理更方便
  }, [data.provinces, map]);

  if (!data.provinces && !data.nineDash) return null;

  return (
    <>
      {/* 省界多边形 — 共同构成中国国界线 */}
      {data.provinces && (
        <GeoJSON
          key="china-provinces"
          data={data.provinces}
          style={() => provinceStyle}
          onEachFeature={(feature, layer) => {
            layer.on({
              mouseover: (e) => {
                e.target.setStyle(provinceHoverStyle);
                e.target.bringToFront();
              },
              mouseout: (e) => {
                e.target.setStyle(provinceStyle);
              },
            });
            // 省名弹窗
            const name = (feature.properties as any)?.name;
            if (name) {
              layer.bindTooltip(name, {
                permanent: false,
                direction: 'center',
                className: 'province-tooltip',
                opacity: 0.85,
              });
            }
          }}
        />
      )}

      {/* 九段线 — 红色虚线 */}
      {data.nineDash && (
        <GeoJSON
          key="china-ninedash"
          data={data.nineDash}
          style={() => nineDashStyle}
        />
      )}
    </>
  );
};

// ============================================================
// 数据加载 + 渲染包装器
// ============================================================
const ChinaBoundary: React.FC = () => {
  const [boundaryData, setBoundaryData] = useState<BoundaryData>({
    provinces: null,
    nineDash: null,
  });
  const [loadError, setLoadError] = useState(false);
  const fetchedRef = React.useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;

    Promise.all([
      fetch('/data/china_provinces.json').then(r => r.json()),
      fetch('/data/china_ninedash.json').then(r => r.json()),
    ])
      .then(([provinces, nineDash]) => {
        if (!cancelled) {
          setBoundaryData({
            provinces: provinces as FeatureCollection,
            nineDash: nineDash as FeatureCollection,
          });
        }
      })
      .catch((err) => {
        console.warn('国界线数据加载失败，地图仍可正常使用:', err);
        if (!cancelled) setLoadError(true);
      });

    return () => { cancelled = true; };
  }, []);

  // 加载失败时静默降级，不影响疫情数据展示
  if (loadError) return null;

  return <ChinaBoundaryLayers data={boundaryData} />;
};

export default ChinaBoundary;
