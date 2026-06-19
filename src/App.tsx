import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { TerminalView } from './types';
import { MED_COLORS, SYSTEM_INFO, GeoIcons } from './constants';
import { BootScreen } from './components/BootScreen';
import { Dashboard } from './components/Dashboard';
import ChinaMap from './components/ChinaMap';
import type { FeatureCollection } from 'geojson';
import type { PlagueStats, EuropeStats } from './constants';
import EuropeMap from './components/EuropeMap';
import AnalysisView from './components/AnalysisView';
import {
  CursorScanner,
  DataFlow,
  InteractiveBox,
  ParallaxWrapper,
  PageTransition,
  TerminalStatusBar,
} from './components/HUD';

const App: React.FC = () => {
  const [view, setView] = useState<TerminalView>(TerminalView.BOOT);
  const [showIntro, setShowIntro] = useState(true);

  // ============================================================
  // 地图数据预加载 — 启动画面结束后立即后台加载
  // 消除从其他页面跳转到东北·肺鼠疫页面的加载闪烁
  // ============================================================
  const [mapRegions, setMapRegions] = useState<FeatureCollection | null>(null);
  const [mapSites, setMapSites] = useState<FeatureCollection | null>(null);
  const [mapStats, setMapStats] = useState<PlagueStats | null>(null);
  const [mapDataReady, setMapDataReady] = useState(false);

  // ============================================================
  // 欧洲地图数据预加载
  // ============================================================
  const [europeSites, setEuropeSites] = useState<FeatureCollection | null>(null);
  const [europeStats, setEuropeStats] = useState<EuropeStats | null>(null);
  const [europeDataReady, setEuropeDataReady] = useState(false);

  const preloadEuropeData = useCallback(() => {
    if (europeDataReady) return;
    Promise.all([
      fetch('/data/plague_europe_sites.geojson').then(r => r.json()),
      fetch('/data/plague_europe_stats.json').then(r => r.json()),
    ]).then(([sites, stats]) => {
      setEuropeSites(sites);
      setEuropeStats(stats);
      setEuropeDataReady(true);
    }).catch(err => {
      console.error('Europe data preload error:', err);
      setEuropeDataReady(true);
    });
  }, [europeDataReady]);

  const preloadMapData = useCallback(() => {
    if (mapDataReady) return; // 已加载完成，跳过
    Promise.all([
      fetch('/data/plague_region.geojson').then(r => r.json()),
      fetch('/data/plague_sites.geojson').then(r => r.json()),
      fetch('/data/plague_stats.json').then(r => r.json()),
    ]).then(([regions, sites, stats]) => {
      setMapRegions(regions);
      setMapSites(sites);
      setMapStats(stats);
      setMapDataReady(true);
    }).catch(err => {
      console.error('Map data preload error:', err);
      setMapDataReady(true); // 标记为完成，让 ChinaMap 自行处理 fallback
    });
  }, [mapDataReady]);

  const handleViewChange = (newView: TerminalView) => {
    setView(newView);
  };

  const renderContent = () => {
    // 每个分支都加上 key={view}，让 AnimatePresence 能正确追踪子元素切换
    switch (view) {
      case TerminalView.DASHBOARD:
        return <Dashboard key={view} />;
      case TerminalView.CHINA_MAP:
        return (
          <PageTransition key={view} keyValue={TerminalView.CHINA_MAP}>
            <ChinaMap
              regions={mapRegions}
              sites={mapSites}
              stats={mapStats}
            />
          </PageTransition>
        );
      case TerminalView.CHINA_ANALYSIS:
        return <AnalysisView key={view} keyValue={TerminalView.CHINA_ANALYSIS} />;
      case TerminalView.CHINA_REPORT:
        return <AnalysisView key={view} keyValue={TerminalView.CHINA_REPORT} />;
      case TerminalView.EUROPE_MAP:
        return (
          <PageTransition key={view} keyValue={TerminalView.EUROPE_MAP}>
            <EuropeMap
              sites={europeSites}
              stats={europeStats}
            />
          </PageTransition>
        );
      case TerminalView.EUROPE_ANALYSIS:
        return <AnalysisView key={view} keyValue={TerminalView.EUROPE_ANALYSIS} />;
      case TerminalView.EUROPE_REPORT:
        return <AnalysisView key={view} keyValue={TerminalView.EUROPE_REPORT} />;
      default:
        return null;
    }
  };

  // 启动画面
  if (showIntro) {
    return (
      <BootScreen onComplete={() => {
        setShowIntro(false);
        setView(TerminalView.DASHBOARD);
        // 后台预加载地图数据，确保用户导航到东北·肺鼠疫时数据已就绪
        preloadMapData();
        preloadEuropeData();
      }} />
    );
  }

  // 根据当前视图确定 TerminalStatusBar 上下文
  const statusContext = (() => {
    if (view === TerminalView.DASHBOARD) return 'dashboard' as const;
    if (view === TerminalView.CHINA_MAP || view === TerminalView.CHINA_ANALYSIS || view === TerminalView.CHINA_REPORT) return 'china' as const;
    if (view === TerminalView.EUROPE_MAP || view === TerminalView.EUROPE_ANALYSIS || view === TerminalView.EUROPE_REPORT) return 'europe' as const;
    return 'analysis' as const;
  })();

  return (
    <div className="h-screen w-screen overflow-hidden select-none relative flex flex-col" style={{ backgroundColor: MED_COLORS.BG }}>
      {/* ===== 左上角科幻终端状态栏 ===== */}
      <TerminalStatusBar context={statusContext} />

      <CursorScanner />

      {/* 背景数据流 */}
      <div className="fixed inset-0 z-0">
        <DataFlow color={MED_COLORS.BLUE} />
      </div>

      <ParallaxWrapper>
        <div className="h-screen w-screen flex flex-col relative z-10 pointer-events-none">
          {/* ===== Header — 极简导航栏 ===== */}
          <header
            className="h-12 border-b flex items-center justify-end px-6 z-30 pointer-events-auto"
            style={{
              borderColor: MED_COLORS.GRAY_MID,
              backgroundColor: 'rgba(245,247,250,0.88)',
              backdropFilter: 'blur(12px)',
            }}
          >

            {/* 导航 */}
            <nav className="flex items-center gap-4">
              <NavButton
                active={view === TerminalView.DASHBOARD}
                onClick={() => handleViewChange(TerminalView.DASHBOARD)}
                label="总览"
                icon={<GeoIcons.Dashboard />}
              />
              <NavButton
                active={view === TerminalView.CHINA_MAP || view === TerminalView.CHINA_ANALYSIS || view === TerminalView.CHINA_REPORT}
                onClick={() => handleViewChange(TerminalView.CHINA_MAP)}
                label="东北·肺鼠疫"
                icon={<GeoIcons.MapPin />}
              />
              <NavButton
                active={view === TerminalView.EUROPE_MAP || view === TerminalView.EUROPE_ANALYSIS || view === TerminalView.EUROPE_REPORT}
                onClick={() => handleViewChange(TerminalView.EUROPE_MAP)}
                label="欧洲·腺鼠疫"
                icon={<GeoIcons.Globe />}
              />
              <NavButton
                active={
                  view === TerminalView.CHINA_ANALYSIS || view === TerminalView.CHINA_REPORT ||
                  view === TerminalView.EUROPE_ANALYSIS || view === TerminalView.EUROPE_REPORT
                }
                onClick={() => {
                  if (view.toString().startsWith('CHINA')) handleViewChange(TerminalView.CHINA_ANALYSIS);
                  else handleViewChange(TerminalView.EUROPE_ANALYSIS);
                }}
                label="分析"
                color={MED_COLORS.VIOLET}
                icon={<GeoIcons.Chart />}
              />
            </nav>
          </header>

          {/* ===== 主内容区 ===== */}
          <main className="flex-1 relative z-20 pointer-events-auto overflow-hidden">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </main>

          {/* ===== Footer — 极简终端信息行 ===== */}
          <footer
            className="h-7 flex items-center justify-between px-6 text-[7px] uppercase font-mono z-30 pointer-events-auto"
            style={{
              backgroundColor: 'rgba(245,247,250,0.85)',
              color: MED_COLORS.GRAY_LIGHT,
            }}
          >
            <div className="flex items-center gap-3 opacity-30">
              <span>PESTIS Terminal</span>
              <span>·</span>
              <span>{SYSTEM_INFO.VERSION}</span>
              <span>·</span>
              <span>{SYSTEM_INFO.BUILD}</span>
              <span>·</span>
              <span>CODENAME: {SYSTEM_INFO.CODENAME}</span>
            </div>
            <div className="flex items-center gap-4 opacity-25">
              {view === TerminalView.CHINA_MAP && (
                <span>数据来源: Liu &amp; Gong (2025) DOI:10.3974/geodb.2025.01.06.V1</span>
              )}
              {view === TerminalView.EUROPE_MAP && (
                <span>数据来源: Büntgen et al. (2012) DOI:10.1093/cid/cis723</span>
              )}
            </div>
          </footer>
        </div>
      </ParallaxWrapper>
    </div>
  );
};

/** 导航按钮 */
const NavButton: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
  icon?: React.ReactNode;
}> = ({ active, onClick, label, color, icon }) => (
  <button onClick={onClick} className="focus:outline-none">
    <InteractiveBox
      label=""
      active={active}
      color={color || MED_COLORS.GRAY_LIGHT}
      className="w-[72px] h-10 flex flex-col items-center justify-center"
    >
      <div className="transition-colors duration-300 flex-shrink-0" style={{ color: active ? MED_COLORS.BLUE : MED_COLORS.GRAY_LIGHT }}>
        {icon}
      </div>
      <span
        className="text-[7px] uppercase font-bold mt-0.5 tracking-widest transition-colors duration-300"
        style={{ color: active ? MED_COLORS.BLUE : MED_COLORS.GRAY_LIGHT }}
      >
        {label}
      </span>
    </InteractiveBox>
  </button>
);

export default App;
