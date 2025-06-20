import { useState, useEffect, useCallback } from 'react';

export function useTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    let intervalId: number;

    if (isRunning && startTime) {
      intervalId = setInterval(() => {
        setTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isRunning, startTime]);

  const start = useCallback(() => {
    setStartTime(Date.now());
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    return time;
  }, [time]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTime(0);
    setStartTime(null);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRunning,
    time,
    start,
    stop,
    reset,
    formatTime
  };
}