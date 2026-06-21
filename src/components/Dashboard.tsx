import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MED_COLORS, SYSTEM_INFO, GeoIcons } from '../constants';
import { TerminalView } from '../types';
import {
  PageTransition,
  SeverityMeter,
  StatCard,
  VitalSigns,
  ECGLine,
  AlertBanner,
  StatusIndicator,
  LogStream,
} from './HUD';
import type { PlagueData } from '../types';

export const Dashboard: React.FC<{
  onNavigate: (view: TerminalView, extra?: { autoShowDoc?: boolean }) => void;
}> = ({ onNavigate }) => {
  const [data, setData] = useState<PlagueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/plague_data.json')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageTransition keyValue="dashboard-loading">
        <div className="h-full flex items-center justify-center">
          <motion.div
            className="text-base uppercase tracking-[0.2em]"
            style={{ color: MED_COLORS.BLUE }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading Pathogen Database...
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  const chinaStats = data?.plague_ne_stats;
  const europeStats = data?.plague_europe;

  const totalDeaths = chinaStats?.total_deaths ?? 0;
  const severityLevel = Math.min(100, Math.round((totalDeaths / 60000) * 100));

  return (
    <PageTransition keyValue="dashboard">
      <div className="h-full flex flex-col p-6 overflow-y-auto">
        {/* ===== 警报横幅 ===== */}
        <AlertBanner
          level="WARNING"
          message=""
          visible={true}
        />

        {/* ===== 项目概述区域 — 说明这是什么信息可视化 ===== */}
        <div className="mt-5 border p-5 rounded" style={{ borderColor: MED_COLORS.GRAY_MID, backgroundColor: '#FFFFFF' }}>
          <h2 className="text-sm uppercase tracking-[0.15em] font-bold mb-4 flex items-center gap-2" style={{ color: MED_COLORS.BLUE }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: MED_COLORS.BLUE, boxShadow: `0 0 6px ${MED_COLORS.BLUE}` }} />
            ◈ 项目概述 — PESTIS Terminal 鼠疫历史数据可视化系统
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {/* 左侧：东北鼠疫 */}
            <div className="border-l-2 pl-4" style={{ borderColor: MED_COLORS.BLUE }}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: MED_COLORS.BLUE }}>
                ▸ 东北肺鼠疫 (1910–1911)
              </h3>
              <p className="text-[13px] leading-relaxed mb-2" style={{ color: MED_COLORS.TEXT }}>
                1910 年 10 月，满洲里首次发现鼠疫病例，病原体沿中东铁路迅速南下，在 6 个月内席卷东三省、
                直隶、山东等北方诸省。这是人类历史上最后一次大规模的肺鼠疫大流行，由伍连德博士领导防疫，
                开创了中国现代公共卫生体系。本次疫情共波及 <strong style={{ color: MED_COLORS.BLUE }}>{chinaStats?.total_regions ?? '—'}</strong> 个县/府级行政区，
                累计造成 <strong style={{ color: MED_COLORS.RED }}>{totalDeaths.toLocaleString()}</strong> 人死亡。
              </p>
              <div className="flex gap-3 text-[11px] flex-wrap" style={{ color: '#64748B' }}>
                <span>▸ 疫区: {chinaStats?.total_regions ?? '—'} 个</span>
                <span>▸ 最严重: {chinaStats?.max_death_region ?? '—'} ({chinaStats?.max_death_count?.toLocaleString() ?? '—'}人)</span>
                <span>▸ 数据来源: Liu &amp; Gong (2025)</span>
              </div>
            </div>

            {/* 右侧：欧洲鼠疫 */}
            <div className="border-l-2 pl-4" style={{ borderColor: MED_COLORS.ORANGE }}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: MED_COLORS.ORANGE }}>
                ▸ 欧洲腺鼠疫 (1347–1853)
              </h3>
              <p className="text-[13px] leading-relaxed mb-2" style={{ color: MED_COLORS.TEXT }}>
                自 1347 年"黑死病"传入欧洲，鼠疫耶尔森菌在欧陆反复爆发达 500 余年。
                数据集收录了欧洲 <strong style={{ color: MED_COLORS.ORANGE }}>{europeStats?.total_cities ?? '—'}</strong> 个城市的 <strong style={{ color: MED_COLORS.ORANGE }}>{europeStats?.total_records?.toLocaleString() ?? '—'}</strong> 条城市-年份爆发记录，
                时间跨度从 {europeStats?.year_range ?? '—'}，涵盖中世纪晚期至工业革命初期的主要腺鼠疫流行事件。
              </p>
              <div className="flex gap-3 text-[11px] flex-wrap" style={{ color: '#64748B' }}>
                <span>▸ 城市: {europeStats?.total_cities ?? '—'} 个</span>
                <span>▸ 记录: {europeStats?.total_records?.toLocaleString() ?? '—'} 条</span>
                <span>▸ 数据来源: Büntgen et al. (2012)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 第一行：核心统计卡片 ===== */}
        <div className="grid grid-cols-4 gap-4 mt-5">
          <StatCard
            title="东北鼠疫疫区数"
            value={chinaStats?.total_regions ?? '--'}
            subtitle="1910-1911 东北肺鼠疫波及范围"
            color={MED_COLORS.BLUE}
            icon={<GeoIcons.MapPin />}
          />
          <StatCard
            title="东北疫病死亡人数"
            value={totalDeaths.toLocaleString()}
            subtitle={`最严重区域: ${chinaStats?.max_death_region ?? '--'} (${chinaStats?.max_death_count?.toLocaleString() ?? '--'}人)`}
            color={MED_COLORS.RED}
            icon={<GeoIcons.Biohazard />}
          />
          <StatCard
            title="欧洲鼠疫历史记录"
            value={europeStats?.total_records?.toLocaleString() ?? '--'}
            subtitle={`${europeStats?.total_cities ?? '--'} 个城市 · 时间跨度: ${europeStats?.year_range ?? '--'}`}
            color={MED_COLORS.ORANGE}
            icon={<GeoIcons.Globe />}
          />
          <StatCard
            title="数据覆盖范围"
            value="两大洲"
            subtitle={`中国东北 + 欧洲大陆 // 1347–1911`}
            color={MED_COLORS.GREEN}
            icon={<GeoIcons.Terminal />}
          />
        </div>

        {/* ===== 第二行：生命体征面板 + 严重度 ===== */}
        <div className="grid grid-cols-3 gap-6 mt-5">
          {/* 左侧：生命体征面板 */}
          <div className="col-span-2 border p-5 space-y-4 rounded" style={{ borderColor: MED_COLORS.GRAY_MID, backgroundColor: '#FFFFFF' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: MED_COLORS.GRAY_MID }}>
              <h2 className="text-sm uppercase tracking-[0.15em] font-bold" style={{ color: MED_COLORS.BLUE }}>
                ◈ 疫情生命体征监测
              </h2>
              <StatusIndicator label="Monitoring Active" active={true} color={MED_COLORS.GREEN} />
            </div>

            <div className="flex items-center gap-8">
              <VitalSigns label="东北疫区" value={chinaStats?.total_regions ?? '--'} unit="REGIONS" color={MED_COLORS.BLUE} pulse />
              <VitalSigns label="总死亡" value={totalDeaths.toLocaleString()} unit="DEATHS" color={MED_COLORS.RED} pulse />
              <VitalSigns label="欧洲城市" value={europeStats?.total_cities ?? '--'} unit="CITIES" color={MED_COLORS.ORANGE} />
              <VitalSigns label="数据记录" value={europeStats?.total_records?.toLocaleString() ?? '--'} unit="RECORDS" color={MED_COLORS.VIOLET} />
            </div>

            {/* 心电图装饰 */}
            <div className="flex justify-center pt-2">
              <ECGLine width={500} height={50} color={MED_COLORS.BLUE} />
            </div>
          </div>

          {/* 右侧：严重度 + 快速导航 */}
          <div className="space-y-4">
            <div className="border p-5 space-y-4 rounded" style={{ borderColor: MED_COLORS.GRAY_MID, backgroundColor: '#FFFFFF' }}>
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold" style={{ color: MED_COLORS.GRAY_LIGHT }}>
                疫情威胁评估
              </h3>
              <SeverityMeter level={severityLevel} label="THREAT LEVEL" />

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-[10px] uppercase" style={{ color: '#64748B' }}>
                  <span>检测范围</span>
                  <span style={{ color: MED_COLORS.BLUE }}>跨时空 · 全球历史</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase" style={{ color: '#64748B' }}>
                  <span>病原体</span>
                  <span style={{ color: MED_COLORS.ORANGE }}>Y. pestis · 鼠疫耶尔森菌</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase" style={{ color: '#64748B' }}>
                  <span>疫病类型</span>
                  <span style={{ color: MED_COLORS.VIOLET }}>肺鼠疫 + 腺鼠疫</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase" style={{ color: '#64748B' }}>
                  <span>时空锚点</span>
                  <span style={{ color: MED_COLORS.RED }}>已脱离 · 历史模式</span>
                </div>
              </div>
            </div>

            {/* 快速导航磁贴 — 医疗白底 + 左侧色彩点缀 + 右列空心边框 */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '东北肺鼠疫地图', color: MED_COLORS.BLUE,   variant: 'accent' as const, icon: <GeoIcons.MapPin />,  view: TerminalView.CHINA_MAP },
                { label: '欧洲腺鼠疫地图', color: MED_COLORS.ORANGE, variant: 'outlined' as const, icon: <GeoIcons.Globe />,  view: TerminalView.EUROPE_MAP },
                { label: '疫情传播分析',   color: MED_COLORS.VIOLET, variant: 'accent' as const, icon: <GeoIcons.Chart />,   view: TerminalView.CHINA_ANALYSIS },
                { label: '分析报告',       color: MED_COLORS.GREEN,  variant: 'outlined' as const, icon: <GeoIcons.Report />,  view: TerminalView.CHINA_REPORT, autoShowDoc: true },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  onClick={() => onNavigate(item.view, item.autoShowDoc ? { autoShowDoc: true } : undefined)}
                  className="relative p-3 flex items-center gap-2.5 cursor-pointer transition-all duration-300 hover:scale-[1.03] overflow-hidden"
                  style={{
                    borderRadius: '5px',
                    backgroundColor: '#FFFFFF',
                    border: item.variant === 'outlined' ? `1px solid ${item.color}50` : 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* 左列：左侧窄色彩强调条 */}
                  {item.variant === 'accent' && (
                    <div
                      className="absolute left-0 top-0 h-full w-1"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  <span className="flex-shrink-0" style={{ color: item.color }}>{item.icon}</span>
                  <span
                    className="text-[10px] uppercase tracking-wider font-bold"
                    style={{ color: '#334155' }}
                  >
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== 第三行：代码加载栏 — 单行居中，持续变换 ===== */}
        <div className="mt-5" style={{ height: '48px' }}>
          <LogStream singleLine />
        </div>

        {/* ===== 第四行：数据来源 ===== */}
        <div className="border-t pt-3 mt-5" style={{ borderColor: MED_COLORS.GRAY_MID }}>
          <div className="flex justify-between text-[10px] uppercase" style={{ color: '#64748B' }}>
            <span>东北大鼠疫数据: 刘晓峥, 龚胜生 (2025) DOI:10.3974/geodb.2025.01.06.V1</span>
            <span>欧洲鼠疫数据: Büntgen et al. (2012) DOI:10.1093/cid/cis723 — opendata.swiss</span>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
