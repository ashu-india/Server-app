import api from './api';
import { IOCIndicator } from '../types';
import { toArray } from './responseHelpers';

export const iocService = {
  async getIOCs(): Promise<IOCIndicator[]> {
    const res = await api.get('/api/iocs');
    if (Array.isArray(res)) return res;
    const r = (res ?? {}) as Record<string, unknown>;
    if (Array.isArray(r['iocs'])) return r['iocs'] as IOCIndicator[];
    if (Array.isArray(r['data'])) return r['data'] as IOCIndicator[];
    return [];
  },

  async getIOCById(id: string): Promise<IOCIndicator | null> {
    return await api.get(`/api/iocs/${encodeURIComponent(id)}`);
  },

  async getIOCsByType(type: string): Promise<IOCIndicator[]> {
    const res = await api.get(`/api/iocs?type=${encodeURIComponent(type)}`);
    return toArray<IOCIndicator>(res);
  },

  async getIOCsBySource(source: string): Promise<IOCIndicator[]> {
    const res = await api.get(`/api/iocs?source=${encodeURIComponent(source)}`);
    return toArray<IOCIndicator>(res);
  },

  async getIOCsBySeverity(severity: string): Promise<IOCIndicator[]> {
    const res = await api.get(`/api/iocs?severity=${encodeURIComponent(severity)}`);
    return toArray<IOCIndicator>(res);
  },

  async createIOC(ioc: Partial<IOCIndicator>): Promise<IOCIndicator> {
    return await api.post('/api/iocs', ioc);
  },

  async updateIOC(id: string, updates: Partial<IOCIndicator>): Promise<IOCIndicator> {
    return await api.put(`/api/iocs/${encodeURIComponent(id)}`, updates);
  },

  async deleteIOC(id: string): Promise<void> {
    await api.delete(`/api/iocs/${encodeURIComponent(id)}`);
  },

  async deactivateIOC(id: string): Promise<void> {
    await api.put(`/api/iocs/${encodeURIComponent(id)}/deactivate`, {});
  },

  async getIOCDistributions(iocId: string) {
    const res = await api.get(`/api/iocs/${encodeURIComponent(iocId)}/distributions`);
    return toArray(res);
  },

  
};
