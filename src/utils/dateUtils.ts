// ============================================================
// 日期解析工具 — 东北肺鼠疫时间动画
// first_date 格式为 "M.DD"（如 "10.25"、"1.02"）
// 跨越 1910 年 10 月 至 1911 年 4 月
// ============================================================

export interface ParsedDate {
  year: number;   // 1910 或 1911
  month: number;  // 1-12
  day: number;    // 1-31
}

/** 解析 "M.DD" 格式字符串，自动推断年份 */
export function normalizeDate(raw: string): ParsedDate | null {
  if (!raw || raw.trim() === '') return null;
  const parts = raw.trim().split('.');
  if (parts.length < 2) return null;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) return null;
  // 10-12 月为 1910 年，1-4 月为 1911 年
  const year = month >= 10 ? 1910 : 1911;
  return { year, month, day };
}

/** 转为 YYYYMMDD 整数，用于排序和比较。无效日期返回 null */
export function dateToEpoch(raw: string): number | null {
  const parsed = normalizeDate(raw);
  if (!parsed) return null;
  return parsed.year * 10000 + parsed.month * 100 + parsed.day;
}

/** 格式化为中文显示 "1910年10月25日" */
export function formatDateDisplay(raw: string): string {
  const parsed = normalizeDate(raw);
  if (!parsed) return '';
  return `${parsed.year}年${parsed.month}月${parsed.day}日`;
}

/** 格式化为英文显示 "OCT 25 1910" */
export function formatDateEn(raw: string): string {
  const parsed = normalizeDate(raw);
  if (!parsed) return '';
  const MONTHS = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ];
  const mon = MONTHS[parsed.month - 1] ?? '---';
  const day = String(parsed.day).padStart(2, '0');
  return `${mon} ${day} ${parsed.year}`;
}

/** 从 GeoJSON features 中提取并排序所有唯一的 first_date */
export function extractSortedDates(features: Array<{ properties: Record<string, unknown> | null }>): string[] {
  const dates = new Set<string>();
  for (const f of features) {
    const raw = (f.properties as Record<string, string> | null)?.['first_date'];
    if (raw && raw.trim() !== '') {
      const epoch = dateToEpoch(raw);
      if (epoch !== null) {
        dates.add(raw);
      }
    }
  }
  // 按 epoch 排序
  return Array.from(dates).sort((a, b) => {
    const ea = dateToEpoch(a) ?? 0;
    const eb = dateToEpoch(b) ?? 0;
    return ea - eb;
  });
}
