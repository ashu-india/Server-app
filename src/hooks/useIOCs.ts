import { useState, useEffect, useCallback } from 'react';
import { IOCIndicator } from '../types';
import { iocService } from '../services/iocService';
import { getToken } from '../services/api';

export const useIOCs = (pollInterval: number = 60000) => {
  const [iocs, setIOCs] = useState<IOCIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
        try {
          setLoading(true);
          const data = await iocService.getIOCs();
          setIOCs(data);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed'));
        } finally {
          setLoading(false);
        }
      }, []);
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const auto = JSON.parse(localStorage.getItem('autoRefresh') || 'true');
      return !!getToken() && Boolean(auto);
    } catch (e) {
      console.debug('useIOCs init autoRefresh read failed', e);
      return !!getToken();
    }
  });

  const fetchIOCs = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      try { localStorage.setItem('app-debug-lastPoll', JSON.stringify({ name: 'iocs', ts: Date.now(), interval: pollInterval })); } catch { /* ignore */ }
      const data = await iocService.getIOCs();
      setIOCs(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch IOCs'));
    } finally {
      setLoading(false);
    }
  }, [enabled, pollInterval]);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    let stopped = false;
    let backoff = 0;

    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

    const poll = async () => {
      while (!stopped && mounted) {
        try {
          await fetchIOCs();
          backoff = 0;
        } catch {
          backoff = backoff ? Math.min(60000, backoff * 2) : 1000;
        }

        const waitMs = backoff || pollInterval;
        await sleep(waitMs);
      }
    };

    poll();
    return () => { stopped = true; mounted = false; };
  }, [fetchIOCs, enabled, pollInterval]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'token') setEnabled(!!localStorage.getItem('token'));
      if (e.key === 'autoRefresh') {
        try { setEnabled(!!localStorage.getItem('token') && JSON.parse(localStorage.getItem('autoRefresh') || 'true')); } catch (err) { console.debug('autoRefresh parse failed', err); setEnabled(!!localStorage.getItem('token')); }
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const getByType = useCallback((type: string) => {
    return iocs.filter(i => i.indicator_type === type);
  }, [iocs]);

  const getBySource = useCallback((source: string) => {
    return iocs.filter(i => i.source === source);
  }, [iocs]);

  const getBySeverity = useCallback((severity: string) => {
    return iocs.filter(i => i.severity === severity);
  }, [iocs]);

  const getHighConfidence = useCallback(() => {
    return iocs.filter(i => i.confidence_score >= 80);
  }, [iocs]);

  const getStats = useCallback(() => {
    const typeCount: Record<string, number> = {};
    const sourceCount: Record<string, number> = {};
    const severityCount: Record<string, number> = {};

    iocs.forEach(ioc => {
      typeCount[ioc.indicator_type] = (typeCount[ioc.indicator_type] || 0) + 1;
      sourceCount[ioc.source] = (sourceCount[ioc.source] || 0) + 1;
      severityCount[ioc.severity] = (severityCount[ioc.severity] || 0) + 1;
    });

    return {
      total: iocs.length,
      byType: typeCount,
      bySource: sourceCount,
      bySeverity: severityCount,
      highConfidence: iocs.filter(i => i.confidence_score >= 80).length,
    };
  }, [iocs]);

  return {
    iocs,
    loading,
    error,
    fetchIOCs,
    getByType,
    getBySource,
    getBySeverity,
    getHighConfidence,
    getStats,
    refresh,
  };
};
