// Small helpers to normalize API responses into arrays or objects.
export function toArray<T = unknown>(res: unknown, keys: string[] = ['data', 'clients', 'results', 'iocs', 'alerts', 'body']): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as T[];
  const r = res as Record<string, unknown>;
  for (const k of keys) {
    if (Array.isArray(r[k])) return r[k] as T[];
  }
  // If the wrapper has a single object in `data`/`body`, wrap it
  const single = (r['data'] ?? r['body']) as unknown;
  if (single && typeof single === 'object' && !Array.isArray(single)) return [single as T];
  // If res itself is a single object, wrap it
  if (typeof res === 'object' && !Array.isArray(res)) return [res as T];
  return [];
}

export function toObject<T = unknown>(res: unknown): T | null {
  if (!res) return null;
  if (Array.isArray(res)) return (res[0] ?? null) as T | null;
  const r = res as Record<string, unknown>;
  if (r['data'] && typeof r['data'] === 'object' && !Array.isArray(r['data'])) return r['data'] as T;
  if (r['body'] && typeof r['body'] === 'object' && !Array.isArray(r['body'])) return r['body'] as T;
  if (typeof res === 'object') return res as T;
  return null;
}

export default { toArray, toObject };
