import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MED_COLORS, Icons, SYSTEM_INFO } from '../constants';
import {
  PageTransition,
  SeverityMeter,
  StatCard,
  VitalSigns,
  ECGLine,
  AlertBanner,
  StatusIndicator,
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
            className="text-sm uppercase tracking-[0.4em]"
            style={{ color: MED_COLORS.CYAN }}
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
      <div className="h-full overflow-y-auto p-6 space-y-6">
        {/* 警报横幅 */}
        <AlertBanner
          level="WARNING"
          message="Biohazard Level 4 — 历史鼠疫数据分析模式 // 时空锚点: 已脱离"
          visible={true}
        />

        {/* 第一行：核心统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            title="东北鼠疫疫区数"
            value={chinaStats?.total_regions ?? '--'}
            subtitle="1910-1911 中国东北"
            color={MED_COLORS.CYAN}
            icon={<Icons.MapPin />}
          />
          <StatCard
            title="总死亡人数"
            value={totalDeaths.toLocaleString()}
            subtitle={`最严重: ${chinaStats?.max_death_region ?? '--'} (${chinaStats?.max_death_count?.toLocaleString() ?? '--'}人)`}
            color={MED_COLORS.RED}
            icon={<Icons.Biohazard />}
          />
          <StatCard
            title="欧洲历史记录"
            value={europeStats?.total_records?.toLocaleString() ?? '--'}
            subtitle={`${europeStats?.total_cities ?? '--'} 个城市 · ${europeStats?.year_range ?? '--'}`}
            color={MED_COLORS.AMBER}
            icon={<Icons.Globe />}
          />
          <StatCard
            title="系统状态"
            value="NOMINAL"
            subtitle={`${SYSTEM_INFO.VERSION} // 时空脱离`}
            color={MED_COLORS.GREEN}
            icon={<Icons.Terminal />}
          />
        </div>

        {/* 第二行：生命体征面板 + 严重度 */}
        <div className="grid grid-cols-3 gap-6">
          {/* 左侧：生命体征面板 */}
          <div className="col-span-2 border p-5 space-y-4" style={{ borderColor: '#1a1a1a', backgroundColor: '#050505' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#1a1a1a' }}>
              <h2 className="text-xs uppercase tracking-[0.3em] font-bold" style={{ color: MED_COLORS.CYAN }}>
                ◈ 疫情生命体征监测
              </h2>
              <StatusIndicator label="Monitoring Active" active={true} color={MED_COLORS.GREEN} />
            </div>

            <div className="flex items-center gap-8">
              <VitalSigns label="东北疫区" value={chinaStats?.total_regions ?? '--'} unit="REGIONS" color={MED_COLORS.CYAN} pulse />
              <VitalSigns label="总死亡" value={totalDeaths.toLocaleString()} unit="DEATHS" color={MED_COLORS.RED} pulse />
              <VitalSigns label="欧洲城市" value={europeStats?.total_cities ?? '--'} unit="CITIES" color={MED_COLORS.AMBER} />
              <VitalSigns label="数据记录" value={europeStats?.total_records?.toLocaleString() ?? '--'} unit="RECORDS" color={MED_COLORS.VIOLET} />
            </div>

            {/* 心电图装饰 */}
            <div className="flex justify-center pt-2">
              <ECGLine width={500} height={50} color={MED_COLORS.CYAN} />
            </div>
          </div>

          {/* 右侧：严重度 + 快速导航 */}
          <div className="space-y-4">
            <div className="border p-5 space-y-4" style={{ borderColor: '#1a1a1a', backgroundColor: '#050505' }}>
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: MED_COLORS.GRAY_LIGHT }}>
                疫情威胁评估
              </h3>
              <SeverityMeter level={severityLevel} label="THREAT LEVEL" />

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-[9px] uppercase" style={{ color: MED_COLORS.GRAY_LIGHT }}>
                  <span>检测范围</span>
                  <span style={{ color: MED_COLORS.CYAN }}>全球历史</span>
                </div>
                <div className="flex justify-between text-[9px] uppercase" style={{ color: MED_COLORS.GRAY_LIGHT }}>
                  <span>病原体</span>
                  <span style={{ color: MED_COLORS.AMBER }}>Y. pestis</span>
                </div>
                <div className="flex justify-between text-[9px] uppercase" style={{ color: MED_COLORS.GRAY_LIGHT }}>
                  <span>时空锚点</span>
                  <span style={{ color: MED_COLORS.VIOLET }}>已脱离</span>
                </div>
              </div>
            </div>

            {/* 快速导航磁贴 */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Icons.MapPin />, label: '东北肺鼠疫', color: MED_COLORS.CYAN },
                { icon: <Icons.Globe />, label: '欧洲腺鼠疫', color: MED_COLORS.AMBER },
                { icon: <Icons.Chart />, label: '医疗分析', color: MED_COLORS.VIOLET },
                { icon: <Icons.Report />, label: '查看报告', color: MED_COLORS.GREEN },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="border p-3 flex flex-col items-center gap-1 cursor-pointer hover:bg-white/5 transition-colors"
                  style={{ borderColor: '#1a1a1a' }}
                >
                  <span style={{ color: item.color }}>{item.icon}</span>
                  <span className="text-[8px] uppercase tracking-wider" style={{ color: MED_COLORS.GRAY_LIGHT }}>{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 第三行：数据来源 */}
        <div className="border-t pt-3" style={{ borderColor: '#1a1a1a' }}>
          <div className="flex justify-between text-[8px] uppercase" style={{ color: MED_COLORS.GRAY_MID }}>
            <span>DATA: 中国东北鼠疫1910-1911 + 欧洲历史鼠疫爆发1347-1900</span>
            <span>COORD: Xian 1980 / WGS84 · SOURCE: Academic Research Datasets</span>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
