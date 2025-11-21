import api from './api';
import { Client, ClientDetailData, ClientSoftware, ClientAntivirus, ClientNetworkInfo, ClientThreatHistory } from '../types';
import { toArray, toObject } from './responseHelpers';

export const clientService = {
  async getClients(): Promise<Client[]> {
    const res = await api.get('/api/clients');
    return toArray<Client>(res);
  },

  async getClientById(id: string): Promise<Client | null> {
    const res = await api.get(`/api/clients/${encodeURIComponent(id)}`);
    return toObject<Client>(res);
  },

  async getClientDetail(clientId: string): Promise<ClientDetailData | null> {
    const res = await api.get(`/api/clients/${encodeURIComponent(clientId)}/detail`);
    // detail endpoint returns { client, software, antivirus, network, threats }
    return (res as ClientDetailData) || null;
  },

  async getClientSoftware(clientId: string): Promise<ClientSoftware[]> {
    const res = await api.get(`/api/clients/${encodeURIComponent(clientId)}/software`);
    return toArray<ClientSoftware>(res);
  },

  async getClientAntivirus(clientId: string): Promise<ClientAntivirus[]> {
    const res = await api.get(`/api/clients/${encodeURIComponent(clientId)}/antivirus`);
    return toArray<ClientAntivirus>(res);
  },

  async getClientNetwork(clientId: string): Promise<ClientNetworkInfo[]> {
    const res = await api.get(`/api/clients/${encodeURIComponent(clientId)}/network`);
    return toArray<ClientNetworkInfo>(res);
  },

  async getClientThreats(clientId: string): Promise<ClientThreatHistory[]> {
    const res = await api.get(`/api/clients/${encodeURIComponent(clientId)}/threats`);
    return toArray<ClientThreatHistory>(res);
  },

  async updateClientStatus(clientId: string, status: string): Promise<void> {
    await api.put(`/api/clients/${encodeURIComponent(clientId)}/status`, { status });
  },

  async getClientsByStatus(status: string): Promise<Client[]> {
    const res = await api.get(`/api/clients?status=${encodeURIComponent(status)}`);
    return toArray<Client>(res);
  },

  async getClientsByThreatLevel(level: string): Promise<Client[]> {
    const res = await api.get(`/api/clients?threat_level=${encodeURIComponent(level)}`);
    return toArray<Client>(res);
  },

  async searchClients(query: string): Promise<Client[]> {
    const res = await api.get(`/api/clients/search?q=${encodeURIComponent(query)}`);
    return toArray<Client>(res);
  },

  
};
