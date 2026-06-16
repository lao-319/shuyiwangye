import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { dateToEpoch } from '../utils/dateUtils';

export interface TimeState {
  isPlaying: boolean;
  speed: number;
  currentFrameIndex: number;
  currentDate: string;       // M.DD 格式原始日期
  totalFrames: number;
  progress: number;           // 0..1
  hasReachedEnd: boolean;
  /** 到目前为止可见的所有日期 epoch (Set<number>) */
  visibleEpochs: Set<number>;
}

export interface TimeActions {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  restart: () => void;
  setSpeed: (s: number) => void;
}

interface UseTimeControllerOptions {
  /** 排序后的唯一日期列表 (M.DD 格式) */
  sortedDates: string[];
  /** 1x 速度下的帧间隔 (毫秒) */
  baseIntervalMs: number;
  /** 是否自动播放 */
  autoPlay?: boolean;
}

export function useTimeController({
  sortedDates,
  baseIntervalMs,
  autoPlay = true,
}: UseTimeControllerOptions): { state: TimeState; actions: TimeActions } {
  const totalFrames = sortedDates.length;

  // ---- 可变状态 ----
  const [isPlaying, setIsPlaying] = useState(autoPlay && totalFrames > 0);
  const [speed, setSpeedState] = useState(1);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  // 用 ref 保存 interval 中需要的最新值，避免闭包过期
  const frameRef = useRef(currentFrameIndex);
  frameRef.current = currentFrameIndex;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- 清除 interval ----
  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ---- 推进帧 ----
  const advanceFrame = useCallback(() => {
    const next = frameRef.current + 1;
    if (next >= totalFrames) {
      // 到达末尾，停止播放
      setIsPlaying(false);
      setHasReachedEnd(true);
      clearTimer();
      return;
    }
    frameRef.current = next;
    setCurrentFrameIndex(next);
  }, [totalFrames, clearTimer]);

  // ---- 启动 interval ----
  const startInterval = useCallback(() => {
    clearTimer();
    const actualInterval = Math.max(baseIntervalMs / speedRef.current, 50);
    intervalRef.current = setInterval(advanceFrame, actualInterval);
  }, [baseIntervalMs, advanceFrame, clearTimer]);

  // ---- 监听 sortedDates 变化，数据就绪后自动开始播放 ----
  useEffect(() => {
    if (totalFrames > 0 && autoPlay && !hasReachedEnd) {
      // 数据就绪，从头开始播放
      setCurrentFrameIndex(0);
      frameRef.current = 0;
      setIsPlaying(true);
      setHasReachedEnd(false);
    }
  }, [totalFrames]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- 监听 isPlaying / speed 变化，重启 interval ----
  useEffect(() => {
    if (isPlaying) {
      startInterval();
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isPlaying, speed]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Actions ----
  const play = useCallback(() => {
    if (hasReachedEnd) {
      // 如果已到达末尾，从头开始
      setCurrentFrameIndex(0);
      frameRef.current = 0;
      setHasReachedEnd(false);
    }
    setIsPlaying(true);
  }, [hasReachedEnd]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  const restart = useCallback(() => {
    clearTimer();
    setIsPlaying(false);
    setCurrentFrameIndex(0);
    frameRef.current = 0;
    setHasReachedEnd(false);
  }, [clearTimer]);

  const setSpeed = useCallback((s: number) => {
    setSpeedState(s);
    // interval 会通过 useEffect 自动重建
  }, []);

  // ---- 派生状态 ----
  const currentDate = sortedDates[currentFrameIndex] ?? '';
  const progress = totalFrames > 1 ? currentFrameIndex / (totalFrames - 1) : 1;

  const visibleEpochs = useMemo(() => {
    const set = new Set<number>();
    for (let i = 0; i <= currentFrameIndex; i++) {
      const epoch = dateToEpoch(sortedDates[i]);
      if (epoch !== null) {
        set.add(epoch);
      }
    }
    return set;
  }, [sortedDates, currentFrameIndex]);

  const state: TimeState = {
    isPlaying,
    speed,
    currentFrameIndex,
    currentDate,
    totalFrames,
    progress,
    hasReachedEnd,
    visibleEpochs,
  };

  const actions: TimeActions = {
    play,
    pause,
    toggle,
    restart,
    setSpeed,
  };

  return { state, actions };
}
