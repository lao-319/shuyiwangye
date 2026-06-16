import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { TerminalView } from './types';
import { MED_COLORS, SYSTEM_INFO, GeoIcons } from './constants';
import { BootScreen } from './components/BootScreen';
import { Dashboard } from './components/Dashboard';
import ChinaMap from './components/ChinaMap';
import type { FeatureCollection } from 'geojson';
import type { PlagueStats } from './constants';
import {
  CursorScanner,
  DataFlow,
  InteractiveBox,
  StatusIndicator,
  ParallaxWrapper,
  VoiceWave,
  PageTransition,
} from './components/HUD';

// 占位组件（后续会话实现）
const PlaceholderView: React.FC<{ title: string; view: TerminalView }> = ({ title, view }) => (
  <PageTransition keyValue={view}>
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-xs uppercase tracking-[0.2em] opacity-40" style={{ color: MED_COLORS.BLUE }}>
          MODULE OFFLINE
        </div>
        <h2 className="text-2xl font-bold tracking-tighter uppercase" style={{ color: MED_COLORS.GRAY_LIGHT }}>
          {title}
        </h2>
        <p className="text-[10px] opacity-30" style={{ color: MED_COLORS.GRAY_LIGHT }}>
          SESSION_2_PENDING // COMING SOON
        </p>
      </div>
    </div>
  </PageTransition>
);

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
        return <PlaceholderView key={view} title="医疗分析：东北肺鼠疫" view={view} />;
      case TerminalView.CHINA_REPORT:
        return <PlaceholderView key={view} title="分析报告：东北肺鼠疫" view={view} />;
      case TerminalView.EUROPE_MAP:
        return <PlaceholderView key={view} title="欧洲大陆·腺鼠疫 1347-1900" view={view} />;
      case TerminalView.EUROPE_ANALYSIS:
        return <PlaceholderView key={view} title="医疗分析：欧洲腺鼠疫" view={view} />;
      case TerminalView.EUROPE_REPORT:
        return <PlaceholderView key={view} title="分析报告：欧洲腺鼠疫" view={view} />;
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
      }} />
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden select-none relative flex flex-col" style={{ backgroundColor: MED_COLORS.BG }}>
      <CursorScanner />

      {/* 背景数据流 */}
      <div className="fixed inset-0 z-0">
        <DataFlow color={MED_COLORS.BLUE} />
      </div>

      <ParallaxWrapper>
        <div className="h-screen w-screen flex flex-col relative z-10 pointer-events-none">
          {/* ===== Header ===== */}
          <header
            className="h-16 border-b flex items-center justify-between px-6 z-30 pointer-events-auto"
            style={{
              borderColor: MED_COLORS.GRAY_MID,
              backgroundColor: 'rgba(245,247,250,0.88)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Logo + 系统名 */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className="w-10 h-10 border-2 flex items-center justify-center font-bold text-xl"
                  style={{
                    borderColor: MED_COLORS.BLUE,
                    color: MED_COLORS.BLUE,
                    boxShadow: `0 0 12px ${MED_COLORS.BLUE}20`,
                  }}
                >
                  P
                </div>
                <div
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full animate-ping"
                  style={{ backgroundColor: MED_COLORS.RED }}
                />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tighter uppercase leading-none" style={{ color: MED_COLORS.BLUE }}>
                  {SYSTEM_INFO.NAME}
                </h1>
                <p className="text-[8px] uppercase tracking-[0.2em] mt-0.5 opacity-50" style={{ color: MED_COLORS.GRAY_LIGHT }}>
                  {SYSTEM_INFO.BUILD}
                </p>
              </div>
            </div>

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

          {/* ===== Footer 状态栏 ===== */}
          <footer
            className="h-8 border-t flex items-center justify-between px-6 text-[9px] uppercase font-mono z-30 pointer-events-auto"
            style={{
              borderColor: MED_COLORS.GRAY_MID,
              backgroundColor: 'rgba(245,247,250,0.92)',
              color: MED_COLORS.GRAY_LIGHT,
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex gap-6">
              <StatusIndicator label="Biosafety Level 4" active={true} color={MED_COLORS.GREEN} />
              <StatusIndicator label="Temporal Anchor" active={true} color={MED_COLORS.BLUE} />
              <span className="opacity-40">
                <VoiceWave active={true} color={MED_COLORS.BLUE} />
              </span>
            </div>
            <div className="flex gap-5 opacity-50">
              <span>NODES: 1,492,055</span>
              <span>|</span>
              <span>SYS:{new Date().toLocaleTimeString()}</span>
              <span>|</span>
              <span>{SYSTEM_INFO.VERSION}</span>
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
