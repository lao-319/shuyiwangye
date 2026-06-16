/**
 * 中国国界线数据预处理脚本
 * 1. 从 DataV GeoAtlas 下载 100000_full.json（GCJ-02 坐标系）
 * 2. 将 GCJ-02 坐标转换为 WGS-84（与项目 plague 数据一致）
 * 3. 分离为省界 GeoJSON 和九段线 GeoJSON
 * 4. 生成南海诸岛缩略 SVG
 *
 * 用法: node scripts/prepare_boundary.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import coordtransform from 'coordtransform';
const { gcj02towgs84 } = coordtransform;

const RAW_PATH = 'public/data/china_boundary_raw.json';
const PROVINCES_OUT = 'public/data/china_provinces.json';
const NINEDASH_OUT = 'public/data/china_ninedash.json';
const SVG_OUT = 'public/data/south_china_sea.svg';

// ============================================================
// 递归转换 GeoJSON 几何体中的所有坐标：GCJ-02 → WGS-84
// ============================================================
function convertCoords(geometry) {
  if (!geometry || !geometry.coordinates) return geometry;

  const convertPoint = ([lng, lat]) => {
    // coordtransform 的 gcj02towgs84 返回 [lng, lat]
    const result = gcj02towgs84(lng, lat);
    // 保留原始精度（6 位小数，约 0.1m）
    return [Math.round(result[0] * 1e6) / 1e6, Math.round(result[1] * 1e6) / 1e6];
  };

  const walk = (coords) => {
    if (typeof coords[0] === 'number') {
      // 叶节点: [lng, lat]
      return convertPoint(coords);
    }
    return coords.map(walk);
  };

  return {
    ...geometry,
    coordinates: walk(geometry.coordinates),
  };
}

// ============================================================
// 主流程
// ============================================================
console.log('读取原始数据:', RAW_PATH);
const raw = JSON.parse(readFileSync(RAW_PATH, 'utf8'));

// 分离九段线 (adchar === 'JD') 与省界
const provinces = [];
const ninedash = [];
let convertedCount = 0;

for (const feature of raw.features) {
  const props = feature.properties || {};

  if (props.adchar === 'JD') {
    // 九段线特征
    const convertedGeom = convertCoords(feature.geometry);
    ninedash.push({ ...feature, geometry: convertedGeom });
  } else {
    // 省界特征（含台湾、香港、澳门）
    const convertedGeom = convertCoords(feature.geometry);
    provinces.push({ ...feature, geometry: convertedGeom });
  }
}

// 更新 featureCount
const provincesFC = {
  type: 'FeatureCollection',
  features: provinces,
};

const ninedashFC = {
  type: 'FeatureCollection',
  features: ninedash,
};

// 写入文件
writeFileSync(PROVINCES_OUT, JSON.stringify(provincesFC), 'utf8');
console.log(`省界数据: ${PROVINCES_OUT} (${provinces.length} 个省/区, 已转 WGS-84)`);

writeFileSync(NINEDASH_OUT, JSON.stringify(ninedashFC), 'utf8');
console.log(`九段线数据: ${NINEDASH_OUT} (${ninedash.length} 条九段线特征, 已转 WGS-84)`);

// ============================================================
// 生成南海诸岛缩略 SVG（Plate Carrée 等距矩形投影）
// 从省界数据中筛选南海相关区域（海南、广东、台湾等南部省份 + 九段线）
// ============================================================
const SVG_W = 180;
const SVG_H = 240;
// 南海区域经纬度范围（WGS-84）
const BBOX = { west: 105, east: 122, south: 2, north: 24 };

function lonLatToSVG(lon, lat) {
  const x = ((lon - BBOX.west) / (BBOX.east - BBOX.west)) * SVG_W;
  const y = ((BBOX.north - lat) / (BBOX.north - BBOX.south)) * SVG_H;
  return [x, y];
}

function geometryToSvgPath(geometry) {
  if (!geometry || !geometry.coordinates) return '';

  const paths = [];
  const processRing = (ring) => {
    if (ring.length < 2) return '';
    const pts = ring.map(([lng, lat]) => {
      const [x, y] = lonLatToSVG(lng, lat);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return 'M' + pts.join(' L') + ' Z';
  };

  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) {
      paths.push(processRing(ring));
    }
  } else if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) {
      for (const ring of poly) {
        paths.push(processRing(ring));
      }
    }
  } else if (geometry.type === 'MultiLineString') {
    for (const line of geometry.coordinates) {
      if (line.length < 2) continue;
      const pts = line.map(([lng, lat]) => {
        const [x, y] = lonLatToSVG(lng, lat);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      });
      paths.push('M' + pts.join(' L'));
    }
  }

  return paths.join(' ');
}

// 筛选落入南海 BBOX 的省份特征（含海南、广东、广西等）
const southProvinceCodes = new Set(['440000', '450000', '460000', '710000']);
// 地理上落入南海 BBOX 的其余省份部分（如福建、云南等可能跨 BBOX）
// 我们保守地包含所有坐标可能落在 BBOX 内的省份多边形
const southLandPaths = [];
for (const f of provinces) {
  // 遍历几何体坐标（粗粒度检查，避免复杂的多边形成员判断）
  const coords = f.geometry.coordinates;
  const flatLngs = JSON.stringify(coords).match(/\d+\.\d+/g);
  if (!flatLngs) continue;

  let hasCoordsInBbox = false;
  // 采样检查
  const nums = flatLngs.map(Number);
  for (let i = 0; i < nums.length; i += 2) {
    const lng = nums[i], lat = nums[i + 1];
    if (lng >= BBOX.west - 1 && lng <= BBOX.east + 1 && lat >= BBOX.south - 1 && lat <= BBOX.north + 1) {
      hasCoordsInBbox = true;
      break;
    }
  }
  if (hasCoordsInBbox) {
    southLandPaths.push(geometryToSvgPath(f.geometry));
  }
}

// 九段线路径
const ninedashPaths = [];
for (const f of ninedash) {
  ninedashPaths.push(geometryToSvgPath(f.geometry));
}

// 岛屿标记（海南岛、东沙、西沙、中沙、南沙）
const ISLAND_MARKS = [
  { name: '东沙群岛', lon: 116.8, lat: 20.7 },
  { name: '西沙群岛', lon: 112.3, lat: 16.8 },
  { name: '中沙群岛', lon: 114.5, lat: 15.5 },
  { name: '南沙群岛', lon: 114.3, lat: 8.5 },
  { name: '海南岛', lon: 109.5, lat: 19.2 },
  { name: '黄岩岛', lon: 117.8, lat: 15.1 },
  { name: '曾母暗沙', lon: 112.3, lat: 3.97 },
];

const islandMarksSvg = ISLAND_MARKS.map(({ name, lon, lat }) => {
  const [x, y] = lonLatToSVG(lon, lat);
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" fill="#DC2626"/><text x="${(x + 3).toFixed(1)}" y="${(y + 4).toFixed(1)}" font-size="5" fill="#475569" font-family="sans-serif">${name}</text>`;
}).join('\n    ');

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_W} ${SVG_H}" width="${SVG_W}" height="${SVG_H}">
  <!-- 海面底色 -->
  <rect width="${SVG_W}" height="${SVG_H}" fill="#E8EDF2"/>

  <!-- 陆地（南部省份） -->
  <g fill="#D4DAE2" stroke="#94A3B8" stroke-width="0.3">
    ${southLandPaths.map(p => `    <path d="${p}"/>`).join('\n    ')}
  </g>

  <!-- 九段线（红色虚线 SVG 无法直接虚线，使用 stroke-dasharray） -->
  <g fill="none" stroke="#DC2626" stroke-width="0.9" stroke-dasharray="3,3" opacity="0.8">
    ${ninedashPaths.map(p => `    <path d="${p}"/>`).join('\n    ')}
  </g>

  <!-- 岛屿标记 -->
  <g>
    ${islandMarksSvg}
  </g>

  <!-- 边框 -->
  <rect width="${SVG_W}" height="${SVG_H}" fill="none" stroke="#475569" stroke-width="1.5"/>
</svg>`;

writeFileSync(SVG_OUT, svgContent, 'utf8');
console.log(`南海缩略图: ${SVG_OUT} (${SVG_W}×${SVG_H}px)`);

console.log('\n✅ 预处理完成！');
console.log(`   - ${provinces.length} 个省/区边界已转换为 WGS-84`);
console.log(`   - ${ninedash.length} 条九段线已转换为 WGS-84`);
console.log('   - 南海缩略 SVG 已生成');
