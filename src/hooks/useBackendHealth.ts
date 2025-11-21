import { useEffect, useState, useRef } from 'react';
import api from '../services/api';

export type HealthStatus = 'unknown' | 'online' | 'offline';

export default function useBackendHealth(pollInterval = 5000) {
  const [status, setStatus] = useState<HealthStatus>('unknown');
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let stopped = false;
    let backoff = 0;

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    const check = async () => {
      try {
        await api.get('/api/health');
        if (!mounted.current) return;
        setStatus('online');
        setLastChecked(Date.now());
        backoff = 0;
      } catch {
        if (!mounted.current) return;
        setStatus('offline');
        setLastChecked(Date.now());
        backoff = backoff ? Math.min(60000, backoff * 2) : 1000;
      }
    };

    (async () => {
      while (!stopped && mounted.current) {
        await check();
        const wait = backoff || pollInterval;
        await sleep(wait);
      }
    })();

    return () => { stopped = true; mounted.current = false; };
  }, [pollInterval]);

  return { status, lastChecked } as const;
}
