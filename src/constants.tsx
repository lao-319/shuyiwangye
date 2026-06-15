import React from 'react';

// ===== 医疗终端色彩系统 — 红蓝白未来科技风格 =====
export const MED_COLORS = {
  BLUE:       '#3B82F6',   // 主色调 — 心电图蓝
  RED:        '#DC2626',   // 危险色 — 心电图红
  ORANGE:     '#F97316',   // 警告色 — 疫情爆发
  GREEN:      '#22C55E',   // 安全色 — 已控制
  VIOLET:     '#8B5CF6',   // 系统色 — 管理员
  BG:         '#F5F7FA',   // 终端底色 — 医疗白
  TEXT:       '#1E293B',   // 监视器文字 — 深石板灰
  GRAY_DARK:  '#E2E8F0',   // 卡片/面板背景
  GRAY_MID:   '#CBD5E1',   // 中灰表面
  GRAY_LIGHT: '#94A3B8',   // 灰色边框
} as const;

// ===== 疫情严重度等级阈值 =====
export const SEVERITY_THRESHOLDS = {
  LOW:      { max: 50,    color: MED_COLORS.GREEN,  label: '低风险' },
  MODERATE: { max: 500,   color: MED_COLORS.ORANGE, label: '中度风险' },
  HIGH:     { max: 2000,  color: MED_COLORS.RED,    label: '高风险' },
  CRITICAL: { max: Infinity, color: MED_COLORS.RED, label: '危急' },
} as const;

// ===== SVG 图标组件 =====
export const Icons = {
  /** 终端 */
  Terminal: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),

  /** 地图定位 */
  MapPin: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),

  /** 分析/图表 */
  Chart: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),

  /** 报告/文档 */
  Report: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),

  /** 搜索 */
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),

  /** 生化危险 */
  Biohazard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeWidth={2}
        d="M12 7v3M12 14v3M8 9.5c1.5 1.5 2.5 1 3.5 2M16 9.5c-1.5 1.5-2.5 1-3.5 2" />
    </svg>
  ),

  /** 时间轴/时钟 */
  Clock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),

  /** 仪表盘 */
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),

  /** 预警/警告 */
  Alert: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),

  /** 返回 */
  Back: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  ),

  /** 全球 */
  Globe: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// ===== 系统常量 =====
export const SYSTEM_INFO = {
  NAME: 'PESTIS Terminal',
  VERSION: 'v4.1-MEDICAL',
  BUILD: 'OS Build MED-4.1 // BIOSAFETY LEVEL 4',
  CODENAME: 'YERSINIA',
} as const;

// ===== 日期格式化映射 =====
// 将数据集中的月.日格式 (如 10.25) 转为可读格式
export function formatPlagueDate(value: number | null): string {
  if (value == null) return '--';
  const month = Math.floor(value);
  const day = Math.round((value - month) * 100);
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `1910/${m}/${d}`;
}

/** 根据死亡人数返回严重度颜色 */
export function getDeathSeverityColor(deaths: number | null): string {
  if (deaths == null) return MED_COLORS.GRAY_LIGHT;
  if (deaths > 2000) return MED_COLORS.RED;
  if (deaths > 500)  return MED_COLORS.ORANGE;
  if (deaths > 50)   return MED_COLORS.BLUE;
  return MED_COLORS.GREEN;
}

/** 根据爆发次数返回气泡颜色 */
export function getOutbreakColor(count: number): string {
  if (count > 80) return MED_COLORS.RED;
  if (count > 50) return MED_COLORS.ORANGE;
  if (count > 20) return MED_COLORS.BLUE;
  return MED_COLORS.GREEN;
}
