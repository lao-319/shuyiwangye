import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================
// 1. 读取并解析 CSV
// ============================================================
const csvPath = resolve(__dirname, '../../historicalplagueoutbreaks/Historical_plague_outbreaks.txt');
const raw = readFileSync(csvPath, 'utf-8');
const lines = raw.trim().split('\n');

console.log(`读取 ${lines.length - 1} 行数据`);

// ============================================================
// 2. 按地点聚合
// ============================================================
const locationMap = new Map();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const cols = line.split(',');
  if (cols.length < 6) continue;

  const name = cols[0].trim();
  const lon = parseFloat(cols[4]);
  const lat = parseFloat(cols[5]);
  const year = parseInt(cols[3], 10);

  if (isNaN(lon) || isNaN(lat) || isNaN(year)) continue;
  if (year > 1900 || year < 1300) continue;

  const key = `${name}|${lon.toFixed(6)}|${lat.toFixed(6)}`;

  if (!locationMap.has(key)) {
    locationMap.set(key, { name, lon, lat, years: [] });
  }
  locationMap.get(key).years.push(year);
}

console.log(`聚合后共 ${locationMap.size} 个唯一地点`);

// ============================================================
// 3. 计算属性并转为数组
// ============================================================
const locations = [];
const centuryCount = {};
let totalOutbreaks = 0;

for (const [, loc] of locationMap) {
  const sortedYears = [...loc.years].sort((a, b) => a - b);
  const firstYear = sortedYears[0];
  const lastYear = sortedYears[sortedYears.length - 1];
  const count = sortedYears.length;
  const century = Math.floor(firstYear / 100) * 100;

  totalOutbreaks += count;
  centuryCount[century] = (centuryCount[century] || 0) + 1;

  locations.push({
    name: loc.name,
    lon: loc.lon,
    lat: loc.lat,
    years: sortedYears,
    firstYear,
    lastYear,
    count,
    century,
  });
}

// ============================================================
// 4. 生成 GeoJSON (sites)
// ============================================================
const features = locations.map(loc => ({
  type: 'Feature',
  properties: {
    NAME: loc.name,
    YEARS: loc.years.join(','),
    FIRST_YR: loc.firstYear,
    LAST_YR: loc.lastYear,
    COUNT: loc.count,
    CENTURY: loc.century,
  },
  geometry: {
    type: 'Point',
    coordinates: [loc.lon, loc.lat],
  },
}));

const geojson = { type: 'FeatureCollection', features };
const geojsonPath = resolve(__dirname, '../public/data/plague_europe_sites.geojson');
writeFileSync(geojsonPath, JSON.stringify(geojson));
console.log(`GeoJSON 已写入: ${geojsonPath} (${features.length} 个疫点)`);

// ============================================================
// 5. 生成统计 JSON
// ============================================================
const sortedByCount = [...locations].sort((a, b) => b.count - a.count);
const topLocations = sortedByCount.slice(0, 15).map(loc => ({
  Location: loc.name,
  outbreak_count: loc.count,
  first_year: loc.firstYear,
  last_year: loc.lastYear,
  lat: parseFloat(loc.lat.toFixed(6)),
  lon: parseFloat(loc.lon.toFixed(6)),
}));

const centuryStats = Object.fromEntries(
  Object.entries(centuryCount)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([c, n]) => [c, n])
);

const decadeTrend = [];
for (let d = 1340; d <= 1900; d += 10) {
  let count = 0;
  for (const loc of locations) {
    for (const y of loc.years) {
      if (y >= d && y < d + 10) count++;
    }
  }
  if (count > 0) {
    decadeTrend.push({ decade: d, count });
  }
}

const europeStats = {
  total_records: totalOutbreaks,
  total_cities: locations.length,
  year_range: `${Math.min(...locations.map(l => l.firstYear))} - ${Math.max(...locations.map(l => l.lastYear))}`,
  top_cities: topLocations,
  decade_trend: decadeTrend,
  century_stats: centuryStats,
};

const statsPath = resolve(__dirname, '../public/data/plague_europe_stats.json');
writeFileSync(statsPath, JSON.stringify(europeStats, null, 2));
console.log(`统计 JSON 已写入: ${statsPath}`);
console.log(`  - 总地点: ${europeStats.total_cities}, 总记录: ${europeStats.total_records}`);
console.log(`  - 时间范围: ${europeStats.year_range}`);
