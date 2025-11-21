/* services/alertService.ts */
import api from './api';
import { Alert, AlertSeverity } from '../types';

import { toArray, toObject } from './responseHelpers';

export const alertService = {
  async getAlerts(): Promise<Alert[]> {
    try {
  const res = await api.get('/api/alerts');
  return toArray<Alert>(res);
    } catch (err) {
      console.error('getAlerts error', err);
      return [];
    }
  },

  async getAlertById(id: string): Promise<Alert | null> {
    try {
  const res = await api.get(`/api/alerts/${encodeURIComponent(id)}`);
  return toObject<Alert>(res);
    } catch (err) {
      console.error('getAlertById error', err);
      return null;
    }
  },

  async getAlertsByStatus(status: string): Promise<Alert[]> {
    try {
  const res = await api.get(`/api/alerts?status=${encodeURIComponent(status)}`);
  return toArray<Alert>(res);
    } catch (err) {
      console.error('getAlertsByStatus error', err);
      return [];
    }
  },

  async getAlertsBySeverity(severity: AlertSeverity): Promise<Alert[]> {
    try {
  const res = await api.get(`/api/alerts?severity=${encodeURIComponent(severity)}`);
  return toArray<Alert>(res);
    } catch (err) {
      console.error('getAlertsBySeverity error', err);
      return [];
    }
  },

  async getClientAlerts(clientId: string): Promise<Alert[]> {
    try {
  const res = await api.get(`/api/clients/${encodeURIComponent(clientId)}/alerts`);
  return toArray<Alert>(res);
    } catch (err) {
      console.error('getClientAlerts error', err);
      return [];
    }
  },

  async createAlert(alert: Partial<Alert>): Promise<Alert | null> {
    try {
  const res = await api.post('/api/alerts', alert);
  return toObject<Alert>(res);
    } catch (err) {
      console.error('createAlert error', err);
      return null;
    }
  },

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | null> {
    try {
  const res = await api.put(`/api/alerts/${encodeURIComponent(id)}`, updates);
  return toObject<Alert>(res);
    } catch (err) {
      console.error('updateAlert error', err);
      return null;
    }
  },

   async acknowledgeAlert(id: string): Promise<Alert | null>{
    try {
      const res = await api.put(`/api/alerts/${encodeURIComponent(id)}/acknowledge`, {});
      return toObject<Alert>(res); //
      
    } catch (err) {
      console.error('acknowledgeAlert error', err);
      return null;
    }
  },

  async resolveAlert(id: string): Promise<Alert | null> {
    try {
      const res = await api.put(`/api/alerts/${encodeURIComponent(id)}/resolve`, {});
      return toObject<Alert>(res); //
      
    } catch (err) {
      console.error('resolveAlert error', err);
      return null;
    }
  },

  async getOpenAlerts(): Promise<Alert[]> {
    try {
  const res = await api.get('/api/alerts?status=open');
  return toArray<Alert>(res);
    } catch (err) {
      console.error('getOpenAlerts error', err);
      return [];
    }
  },

  async getRecentAlerts(hours: number = 24): Promise<Alert[]> {
    try {
  const res = await api.get(`/api/alerts/recent?hours=${encodeURIComponent(String(hours))}`);
  return toArray<Alert>(res);
    } catch (err) {
      console.error('getRecentAlerts error', err);
      return [];
    }
  },

  /**
   * subscribeToAlerts: simple polling-based subscription helper
   *
   * Usage:
   * const sub = alertService.subscribeToAlerts((alerts) => { setAlerts(alerts); }, { intervalMs: 5000 });
   * // later
   * sub.unsubscribe();
   */
  subscribeToAlerts(
    onUpdate: (alerts: Alert[]) => void,
    opts: { intervalMs?: number } = {}
  ) {
    const intervalMs = opts.intervalMs ?? 5000;
  let stopped = false;

    async function pollOnce() {
      if (stopped) return;
      try {
        const list = await alertService.getAlerts();
        onUpdate(list);
      } catch (err) {
        console.error('subscribeToAlerts poll error', err);
      }
    }

  // start immediately, then interval
  pollOnce();
  const timer = window.setInterval(pollOnce, intervalMs);

    return {
      unsubscribe() {
        stopped = true;
        if (timer !== undefined) {
          clearInterval(timer);
        }
      }
    };
  }
};

export default alertService;
