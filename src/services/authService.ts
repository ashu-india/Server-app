import api, { setToken } from './api';
import { AdminUser } from '../types';

export async function login(email: string, password: string): Promise<{ token: string; user: AdminUser }> {
  const res = await api.post('/api/auth/login', { email, password });
  if (!res || !res.token) throw new Error(res?.error || 'Login failed');
  setToken(res.token);
  return res;
}

export async function register(email: string, password: string, full_name?: string) {
  const res = await api.post('/api/auth/register', { email, password, full_name });
  if (!res || !res.token) throw new Error(res?.error || 'Register failed');
  setToken(res.token);
  return res;
}

export function logout() {
  setToken(null);
}

export default { login, register, logout };
