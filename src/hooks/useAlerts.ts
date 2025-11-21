import { useState, useEffect, useCallback } from 'react';
import { Alert } from '../types';
import { alertService } from '../services/alertService';

export const useAlerts = (enabled: boolean = true, pollInterval: number = 10000) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await alertService.getAlerts();
      setAlerts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const initialFetch = async () => {
    try {
      setLoading(true);
      const data = await alertService.getAlerts();
      if (mounted) {
        setAlerts(data);
        setError(null);
      }
    } finally {
      if (mounted) setLoading(false);
    }
  };
  
  initialFetch();
    let mounted = true;
    let stopped = false;
    let backoff = 0; // ms

    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

    const poll = async () => {
      while (!stopped && mounted) {
        try {
          setLoading(true);
          try { localStorage.setItem('app-debug-lastPoll', JSON.stringify({ name: 'alerts', ts: Date.now(), interval: pollInterval })); } catch { /* ignore */ }
          const data = await alertService.getAlerts();
          if (!mounted) return;
          setAlerts(data);
          setError(null);
          backoff = 0; // reset on success
        } catch (err) {
          if (!mounted) return;
          setError(err instanceof Error ? err : new Error('Failed to fetch alerts'));
          // exponential backoff (start 1s, double up to 60s)
          backoff = backoff ? Math.min(60000, backoff * 2) : 1000;
        } finally {
          if (!mounted) return;
          setLoading(false);
        }

        // wait for either backoff or normal interval
        const waitMs = backoff || pollInterval;
        await sleep(waitMs);
      }
    };

    poll();
    return () => { stopped = true; mounted = false; };
  }, [enabled, pollInterval]);

  const getOpenAlerts = useCallback(() => {
    return alerts.filter(a => a.status === 'open');
  }, [alerts]);

  const getCriticalAlerts = useCallback(() => {
    return alerts.filter(a => a.severity === 'critical' && a.status === 'open');
  }, [alerts]);

  const getAlertsBySeverity = useCallback((severity: string) => {
    return alerts.filter(a => a.severity === severity);
  }, [alerts]);

  const getUnacknowledgedCount = useCallback(() => {
    return alerts.filter(a => a.status === 'open').length;
  }, [alerts]);

  const getStats = useCallback(() => {
    return {
      total: alerts.length,
      open: alerts.filter(a => a.status === 'open').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
    };
  }, [alerts]);

  return {
    alerts,
    loading,
    error,
    getOpenAlerts,
    getCriticalAlerts,
    getAlertsBySeverity,
    getUnacknowledgedCount,
    getStats,
    refresh
  };
};
