import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MED_COLORS, SYSTEM_INFO } from '../constants';

interface BootLine {
  id: number;
  text: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'header';
  delay: number;
}

const BOOT_SEQUENCE: BootLine[] = [
  { id: 1,  text: '╔══════════════════════════════════════════════╗', type: 'header', delay: 200 },
  { id: 2,  text: '║   PESTIS TERMINAL — BIOSAFETY LEVEL 4       ║', type: 'header', delay: 400 },
  { id: 3,  text: '║   鼠疫监测系统 v4.1-MEDICAL                  ║', type: 'header', delay: 600 },
  { id: 4,  text: '╚══════════════════════════════════════════════╝', type: 'header', delay: 800 },
  { id: 5,  text: '', type: 'info', delay: 1000 },
  { id: 6,  text: '[BIOS] Initializing YERSINIA Core..............', type: 'info', delay: 1200 },
  { id: 7,  text: '[BIOS] Memory Check: 8192 TB OK', type: 'success', delay: 1600 },
  { id: 8,  text: '[BIOS] Quantum Entanglement: STABLE', type: 'success', delay: 2000 },
  { id: 9,  text: '[BIOS] Temporal Anchor: DETACHED', type: 'success', delay: 2400 },
  { id: 10, text: '', type: 'info', delay: 2800 },
  { id: 11, text: '[KERNEL] Loading Pathogen Database.............', type: 'info', delay: 3000 },
  { id: 12, text: '[KERNEL] Y. pestis strain data: 130 REGIONS', type: 'success', delay: 3500 },
  { id: 13, text: '[KERNEL] European outbreak records: 6,926', type: 'success', delay: 3900 },
  { id: 14, text: '[KERNEL] Mortality data loaded: 56,287 deaths', type: 'warn', delay: 4300 },
  { id: 15, text: '', type: 'info', delay: 4700 },
  { id: 16, text: '[MED-ENG] Initializing Analysis Pipeline.......', type: 'info', delay: 4900 },
  { id: 17, text: '[MED-ENG] GIS Projection: Xian 1980 → WGS84', type: 'info', delay: 5300 },
  { id: 18, text: '[MED-ENG] Map tileserver: ONLINE', type: 'success', delay: 5700 },
  { id: 19, text: '[MED-ENG] Epidemic spread model: LOADED', type: 'success', delay: 6100 },
  { id: 20, text: '', type: 'info', delay: 6500 },
  { id: 21, text: '[SEC] Biosafety Protocol: ACTIVE', type: 'success', delay: 6700 },
  { id: 22, text: '[SEC] Containment field: NOMINAL', type: 'success', delay: 7100 },
  { id: 23, text: '[SEC] Cross-temporal firewall: ENABLED', type: 'success', delay: 7500 },
  { id: 24, text: '', type: 'info', delay: 7900 },
  { id: 25, text: '[SYS] All subsystems ONLINE', type: 'success', delay: 8100 },
  { id: 26, text: '[SYS] Awaiting ADMIN authorization............', type: 'info', delay: 8500 },
];

export const BootScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [showButton, setShowButton] = useState(false);
  const [bootPhase, setBootPhase] = useState<'booting' | 'ready'>('booting');

  useEffect(() => {
    // 逐行显示启动序列
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_SEQUENCE.forEach((line) => {
      const t = setTimeout(() => {
        setVisibleLines(prev => [...prev, line.id]);
      }, line.delay);
      timers.push(t);
    });

    // 启动完成
    const finalTimer = setTimeout(() => {
      setBootPhase('ready');
      setTimeout(() => setShowButton(true), 500);
    }, 9000);
    timers.push(finalTimer);

    return () => timers.forEach(clearTimeout);
  }, []);

  const lineColor = (type: BootLine['type']) => {
    switch (type) {
      case 'success': return MED_COLORS.GREEN;
      case 'warn':    return MED_COLORS.AMBER;
      case 'error':   return MED_COLORS.RED;
      case 'header':  return MED_COLORS.CYAN;
      default:        return MED_COLORS.GRAY_LIGHT;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ backgroundColor: MED_COLORS.BG }}>
      {/* 启动画面背景网格 */}
      <div className="surveillance-grid absolute inset-0 opacity-30" />

      <div className="w-full max-w-2xl px-8 font-mono text-sm">
        {/* 启动日志 */}
        <div className="mb-8 space-y-0 leading-relaxed">
          <AnimatePresence>
            {BOOT_SEQUENCE.filter(l => visibleLines.includes(l.id)).map((line) => (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                style={{ color: lineColor(line.type) }}
                className="text-[11px] tracking-wide whitespace-pre"
              >
                {line.text || ' '}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 就绪提示 + 进入按钮 */}
        <AnimatePresence>
          {bootPhase === 'ready' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center gap-6"
            >
              <motion.div
                className="text-xs uppercase tracking-[0.4em] font-bold"
                style={{ color: MED_COLORS.CYAN }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ◈ System Ready — Temporal Anchor Released ◈
              </motion.div>

              {showButton && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  onClick={onComplete}
                  className="px-10 py-4 border-2 font-bold uppercase tracking-[0.3em] text-sm transition-all hover:scale-105 active:scale-95"
                  style={{
                    borderColor: MED_COLORS.CYAN,
                    color: MED_COLORS.CYAN,
                    boxShadow: `0 0 30px ${MED_COLORS.CYAN}20`,
                  }}
                >
                  Enter PESTIS Terminal
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
