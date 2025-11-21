function safeParseJSON(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object') return val;
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch (err) {
    // Try comma-separated fallback
    if (val.includes(',')) return val.split(',').map(s => s.trim()).filter(Boolean);
    return val;
  }
}

function normalize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = { ...obj };
  // Common JSON/text fields
  if ('metadata' in out) {
    out.metadata = safeParseJSON(out.metadata) || undefined;
  }
  if ('tags' in out) {
    const parsed = safeParseJSON(out.tags);
    out.tags = Array.isArray(parsed) ? parsed : (parsed ? [String(parsed)] : []);
  }
  if ('dns_servers' in out) {
    const parsed = safeParseJSON(out.dns_servers);
    out.dns_servers = Array.isArray(parsed) ? parsed : (parsed ? [String(parsed)] : []);
  }
  // Ensure ids are numbers (Sequelize usually returns numbers)
  if ('id' in out) out.id = typeof out.id === 'string' ? Number(out.id) : out.id;
  if ('client_id' in out) out.client_id = typeof out.client_id === 'string' ? Number(out.client_id) : out.client_id;
  if ('ioc_id' in out) out.ioc_id = typeof out.ioc_id === 'string' ? Number(out.ioc_id) : out.ioc_id;
  // Dates: ensure ISO strings
  ['created_at','updated_at','last_seen','detected_at','acknowledged_at','resolved_at','install_date','signature_date','last_scan','expires_at','last_seen'].forEach(k => {
    if (k in out && out[k]) {
      const d = new Date(out[k]);
      if (!isNaN(d.getTime())) out[k] = d.toISOString();
    }
  });
  return out;
}

function normalizeArray(arr) {
  return Array.isArray(arr) ? arr.map(a => normalize(a)) : arr;
}

export { normalize, normalizeArray };
