import React, { useRef, useCallback } from 'react';
import { TileLayer } from 'react-leaflet';
import type { TileErrorEvent } from 'leaflet';

// ============================================================
// 多源容错瓦片层 — 主源加载失败时自动切换到备源
//
// 原理：TileLayer 渲染主源，通过 eventHandlers.tileerror
// 感知失败瓦片。拿到瓦片坐标后，逐个尝试备源 URL，
// 用临时 Image 预检可达性，成功后替换 src。
// 全部失败才显示与背景融合的占位色块。
// ============================================================

interface ResilientTileLayerProps {
  sources: string[];
  attribution?: string;
}

// {s} 子域循环
const SUBDOMAINS = ['a', 'b', 'c'];
let si = 0;
const pickSub = () => SUBDOMAINS[si++ % 3];

const buildUrl = (tpl: string, x: number, y: number, z: number): string =>
  tpl
    .replace('{s}', pickSub())
    .replace('{x}', String(x))
    .replace('{y}', String(y))
    .replace('{z}', String(z))
    .replace('{r}', window.devicePixelRatio > 1 ? '@2x' : '');

const DEAD_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">' +
  '<rect fill="#EEF1F5" width="256" height="256"/>' +
  '</svg>'
)}`;

const ResilientTileLayer: React.FC<ResilientTileLayerProps> = ({
  sources,
  attribution,
}) => {
  const sourcesRef = useRef(sources);
  sourcesRef.current = sources;

  const handleTileError = useCallback((e: TileErrorEvent) => {
    const tile = e.tile as HTMLImageElement;
    const c = e.coords as { x: number; y: number; z: number } | undefined;

    let z: number, x: number, y: number;

    if (c && c.z !== undefined) {
      z = c.z; x = c.x; y = c.y;
    } else {
      // 降级：从当前 src 反解坐标  …/z/x/y.png
      const m = tile.src.match(/\/(\d+)\/(\d+)\/(\d+)(?:@2x)?\.(?:png|jpg)/);
      if (!m) { tile.src = DEAD_SVG; return; }
      z = +m[1]; x = +m[2]; y = +m[3];
    }

    tryBackup(tile, z, x, y, 0);
  }, []);

  const tryBackup = (
    tile: HTMLImageElement,
    z: number, x: number, y: number,
    attempt: number,
  ) => {
    const cur = sourcesRef.current;
    const idx = attempt + 1; // 0 是主源
    if (idx >= cur.length) { tile.src = DEAD_SVG; return; }

    const url = buildUrl(cur[idx], x, y, z);
    const probe = new Image();
    let done = false;
    const clean = () => { done = true; probe.onload = null; probe.onerror = null; };

    probe.onload = () => { if (!done) { clean(); tile.src = url; } };
    probe.onerror = () => { if (!done) { clean(); tryBackup(tile, z, x, y, attempt + 1); } };
    probe.src = url;

    setTimeout(() => { if (!done) { clean(); tryBackup(tile, z, x, y, attempt + 1); } }, 4000);
  };

  if (!sources || sources.length === 0) return null;

  return (
    <TileLayer
      url={sources[0]}
      attribution={attribution}
      keepBuffer={6}
      updateWhenIdle={false}
      updateWhenZooming={true}
      eventHandlers={{ tileerror: handleTileError }}
    />
  );
};

export default ResilientTileLayer;
