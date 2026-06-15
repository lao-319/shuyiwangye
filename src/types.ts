// ===== 终端视图枚举 =====
export enum TerminalView {
  BOOT = 'BOOT',
  DASHBOARD = 'DASHBOARD',
  CHINA_MAP = 'CHINA_MAP',
  CHINA_ANALYSIS = 'CHINA_ANALYSIS',
  CHINA_REPORT = 'CHINA_REPORT',
  EUROPE_MAP = 'EUROPE_MAP',
  EUROPE_ANALYSIS = 'EUROPE_ANALYSIS',
  EUROPE_REPORT = 'EUROPE_REPORT',
}

// ===== 东北鼠疫数据 =====
export interface PlagueRegion {
  fid: number;
  name_cn: string;
  name_en: string;
  area: number | null;           // 面积 (万km²)
  population: number | null;     // 人口 (万)
  first_date: number | null;     // 首发日 (月.日格式)
  term_date: number | null;      // 终止日
  days_since_first: number | null; // 首发日距 (天)
  duration_days: number | null;  // 流行时长 (天)
  node_degree: number | null;    // 节点度
  speed_km_day: number | null;   // 传播速度 (km/day)
  deaths: number | null;         // 死亡人数
  mortality_per_capita: number | null;  // 人均死亡比率 (1/10万)
  mortality_per_area: number | null;   // 地均死亡比率
  mortality_daily: number | null;      // 日均死亡比率
  mortality_intensity: number | null;  // 综合死亡强度
}

// ===== 欧洲鼠疫数据 =====
export interface CityOutbreak {
  Location: string;
  outbreak_count: number;
  first_year: number;
  last_year: number;
  lat: number;
  lon: number;
}

export interface DecadeTrend {
  decade: number;
  count: number;
}

// ===== 预处理统计 =====
export interface PlagueData {
  plague_ne_china: PlagueRegion[];
  plague_ne_count: number;
  plague_ne_stats: {
    total_regions: number;
    total_deaths: number;
    max_death_region: string;
    max_death_count: number;
    date_range: string;
  };
  plague_europe: {
    total_records: number;
    total_cities: number;
    year_range: string;
    top_cities: CityOutbreak[];
    decade_trend: DecadeTrend[];
    century_stats: Record<string, number>;
  };
}

// ===== 分析报告 =====
export interface AnalysisReport {
  title: string;
  sections: ReportSection[];
  conclusion: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  generatedAt: string;
}

export interface ReportSection {
  heading: string;
  content: string;
  dataRef?: string;
}

// ===== 地图视口状态 =====
export interface MapViewState {
  center: [number, number];
  zoom: number;
}
