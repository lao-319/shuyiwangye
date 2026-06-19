import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MED_COLORS, SYSTEM_INFO, GeoIcons } from '../constants';
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

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<PlagueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载预处理数据
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
            className="text-sm uppercase tracking-[0.2em]"
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
  // 严重度: 按死亡人数比例计算
  const severityLevel = Math.min(100, Math.round((totalDeaths / 60000) * 100));

  return (
    <PageTransition keyValue="dashboard">
      <div className="h-full flex flex-col p-6">
        {/* 警报横幅 */}
        <AlertBanner
          level="WARNING"
          message="Biohazard Level 4 — 历史鼠疫数据分析模式 // 时空锚点: 已脱离"
          visible={true}
        />

        {/* 第一行：核心统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mt-5">
          <StatCard
            title="东北鼠疫疫区数"
            value={chinaStats?.total_regions ?? '--'}
            subtitle="1910-1911 中国东北"
            color={MED_COLORS.BLUE}
            icon={<GeoIcons.MapPin />}
          />
          <StatCard
            title="总死亡人数"
            value={totalDeaths.toLocaleString()}
            subtitle={`最严重: ${chinaStats?.max_death_region ?? '--'} (${chinaStats?.max_death_count?.toLocaleString() ?? '--'}人)`}
            color={MED_COLORS.RED}
            icon={<GeoIcons.Biohazard />}
          />
          <StatCard
            title="欧洲历史记录"
            value={europeStats?.total_records?.toLocaleString() ?? '--'}
            subtitle={`${europeStats?.total_cities ?? '--'} 个城市 · ${europeStats?.year_range ?? '--'}`}
            color={MED_COLORS.ORANGE}
            icon={<GeoIcons.Globe />}
          />
          <StatCard
            title="系统状态"
            value="NOMINAL"
            subtitle={`${SYSTEM_INFO.VERSION} // 时空脱离`}
            color={MED_COLORS.GREEN}
            icon={<GeoIcons.Terminal />}
          />
        </div>

        {/* 第二行：生命体征面板 + 严重度 */}
        <div className="grid grid-cols-3 gap-6 mt-5">
          {/* 左侧：生命体征面板 */}
          <div className="col-span-2 border p-5 space-y-4 rounded" style={{ borderColor: MED_COLORS.GRAY_MID, backgroundColor: '#FFFFFF' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: MED_COLORS.GRAY_MID }}>
              <h2 className="text-xs uppercase tracking-[0.15em] font-bold" style={{ color: MED_COLORS.BLUE }}>
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
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: MED_COLORS.GRAY_LIGHT }}>
                疫情威胁评估
              </h3>
              <SeverityMeter level={severityLevel} label="THREAT LEVEL" />

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-[9px] uppercase" style={{ color: MED_COLORS.GRAY_LIGHT }}>
                  <span>检测范围</span>
                  <span style={{ color: MED_COLORS.BLUE }}>全球历史</span>
                </div>
                <div className="flex justify-between text-[9px] uppercase" style={{ color: MED_COLORS.GRAY_LIGHT }}>
                  <span>病原体</span>
                  <span style={{ color: MED_COLORS.ORANGE }}>Y. pestis</span>
                </div>
                <div className="flex justify-between text-[9px] uppercase" style={{ color: MED_COLORS.GRAY_LIGHT }}>
                  <span>时空锚点</span>
                  <span style={{ color: MED_COLORS.VIOLET }}>已脱离</span>
                </div>
              </div>
            </div>

            {/* 快速导航磁贴 — 医疗白底 + 左侧色彩点缀 + 右列空心边框 */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '东北肺鼠疫', color: MED_COLORS.BLUE, variant: 'accent' as const, icon: <GeoIcons.MapPin /> },
                { label: '欧洲腺鼠疫', color: MED_COLORS.ORANGE, variant: 'outlined' as const, icon: <GeoIcons.Globe /> },
                { label: '医疗分析', color: MED_COLORS.VIOLET, variant: 'accent' as const, icon: <GeoIcons.Chart /> },
                { label: '查看报告', color: MED_COLORS.GREEN, variant: 'outlined' as const, icon: <GeoIcons.Report /> },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
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
                  {/* 极简几何图标 */}
                  <span className="flex-shrink-0" style={{ color: item.color }}>{item.icon}</span>
                  <span
                    className="text-[8px] uppercase tracking-wider font-bold"
                    style={{ color: '#334155' }}
                  >
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 第三行：终端代码流 — 填充生命体征面板下方空白，逐行加载系统诊断日志 */}
        <div className="mt-5 flex-1 min-h-0">
          <LogStream />
        </div>

        {/* 第四行：数据来源 */}
        <div className="border-t pt-3 mt-5" style={{ borderColor: MED_COLORS.GRAY_MID }}>
          <div className="flex justify-between text-[8px] uppercase" style={{ color: MED_COLORS.GRAY_LIGHT }}>
            <span>东北大鼠疫数据: 刘晓峥,龚胜生 (2025) DOI:10.3974/geodb.2025.01.06.V1</span>
            <span>欧洲鼠疫数据: Büntgen et al. (2012) DOI:10.1093/cid/cis723 — opendata.swiss</span>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
