const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    try {
      // store minimal auth debug info (do not store full token in logs)
      const short = token.slice(0, 8) + '...';
      localStorage.setItem('app-debug-lastAuth', JSON.stringify({ present: true, short, ts: Date.now() }));
      console.debug('🔑 api: sending Authorization header (short):', short, 'path:', path);
    } catch {
      /* ignore storage errors */
    }
  } else {
    try { localStorage.setItem('app-debug-lastAuth', JSON.stringify({ present: false, ts: Date.now() })); } catch { /* ignore */ }
    console.warn('⚠️ api: NO token in localStorage for path:', path);
  }

  const res = await fetch(url, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      // store last API failure for debug (do not block)
  console.warn('API error stored for debug', { url, status: res.status });
      localStorage.setItem('app-debug-lastApiError', JSON.stringify({ url, status: res.status, statusText: res.statusText, body: text, ts: Date.now() }));
    } catch {
      /* ignore storage errors */
    }
    throw new Error(text || `Request failed: ${res.status} ${res.statusText}`);
  }

  // Some endpoints may return empty body
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    try {
      console.warn('API parse error stored for debug', url);
      localStorage.setItem('app-debug-lastApiParseError', JSON.stringify({ url, text: text.slice(0, 200), ts: Date.now() }));
    } catch {
      /* ignore storage errors */
    }
    return text;
  }
}

export const api = {
  get: (path: string) => request(path, { method: 'GET' }),
  post: (path: string, data: unknown) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path: string, data: unknown) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (path: string) => request(path, { method: 'DELETE' }),
};

export default api;

// token helpers
export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}
