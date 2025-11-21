import { useState, useEffect, useCallback } from 'react';
import { Client } from '../types';
import { clientService } from '../services/clientService';
import { getToken } from '../services/api';

export const useClients = (pollInterval: number = 30000) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await clientService.getClients();
      setClients(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh clients'));
    } finally {
      setLoading(false);
    }
  }, []);

  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const auto = JSON.parse(localStorage.getItem('autoRefresh') || 'true');
      return !!getToken() && Boolean(auto);
    } catch (e) {
      console.debug('useClients init autoRefresh read failed', e);
      return !!getToken();
    }
  });

  const fetchClients = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      try { 
        localStorage.setItem('app-debug-lastPoll', JSON.stringify({ 
          name: 'clients', 
          ts: Date.now(), 
          interval: pollInterval 
        })); 
      } catch { /* ignore */ }
      
      const data = await clientService.getClients();
      setClients(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch clients'));
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
          await fetchClients();
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
  }, [fetchClients, enabled, pollInterval]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'token') setEnabled(!!localStorage.getItem('token'));
      if (e.key === 'autoRefresh') {
        try { 
          setEnabled(!!localStorage.getItem('token') && JSON.parse(localStorage.getItem('autoRefresh') || 'true')); 
        } catch (err) { 
          console.debug('autoRefresh parse failed', err); 
          setEnabled(!!localStorage.getItem('token')); 
        }
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const getClientById = useCallback((id: string) => {
    return clients.find(c => c.id === id);
  }, [clients]);

  const filterByStatus = useCallback((status: string) => {
    return clients.filter(c => c.status === status);
  }, [clients]);

  const filterByThreatLevel = useCallback((level: string) => {
    return clients.filter(c => c.threat_level === level);
  }, [clients]);

  const search = useCallback((query: string) => {
    const q = query.toLowerCase();
    return clients.filter(c =>
      c.hostname.toLowerCase().includes(q) ||
      c.unique_id.toLowerCase().includes(q) ||
      c.os_name.toLowerCase().includes(q)
    );
  }, [clients]);

  const getStats = useCallback(() => {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'active').length;
    const disconnected = clients.filter(c => c.status === 'disconnected').length;
    const errorStatus = clients.filter(c => c.status === 'error').length;
    const highThreat = clients.filter(c => c.threat_level === 'high').length;
    const mediumThreat = clients.filter(c => c.threat_level === 'medium').length;
    const lowThreat = clients.filter(c => c.threat_level === 'low').length;
    
    // Calculate average security score
    const avgSecurityScore = clients.length > 0 
      ? Math.round(clients.reduce((sum, client) => sum + (client.security_score || 0), 0) / clients.length)
      : 0;
    
    // Calculate average compliance score
    const avgComplianceScore = clients.length > 0 
      ? Math.round(clients.reduce((sum, client) => sum + (client.compliance_score || 0), 0) / clients.length)
      : 0;

    return {
      total,
      active,
      disconnected,
      error: errorStatus,
      highThreat,
      mediumThreat,
      lowThreat,
      avgSecurityScore,
      avgComplianceScore,
      healthy: clients.filter(c => 
        c.status === 'active' && 
        (c.security_score || 0) >= 80 && 
        (c.threat_level === 'low' || c.threat_level === 'medium')
      ).length,
      atRisk: clients.filter(c => 
        c.status === 'active' && 
        ((c.security_score || 0) < 80 || c.threat_level === 'high')
      ).length
    };
  }, [clients]);

  return {
    clients,
    loading,
    error,
    fetchClients,
    getClientById,
    filterByStatus,
    filterByThreatLevel,
    search,
    getStats,
    refresh,
    enabled,
    setEnabled
  };
};