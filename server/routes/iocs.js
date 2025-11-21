import express from 'express';
import { IOCIndicator } from '../models/index.js';
import { normalize, normalizeArray } from '../utils/serializers.js';

const router = express.Router();

// Simple, small helper: build a basic where clause from query params
function buildWhere(query) {
  const where = {};
  if (query.type) where.indicator_type = String(query.type);
  if (query.source) where.source = String(query.source);
  if (query.severity) where.severity = String(query.severity);
  if (query.active !== undefined) {
    const a = String(query.active).toLowerCase();
    if (a === 'true' || a === 'false') where.is_active = a === 'true';
  }
  return where;
}

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(t => String(t).trim()).filter(Boolean);
  return String(tags).split(',').map(t => t.trim()).filter(Boolean);
}

function normalizeTagsField(obj) {
  if (!obj) return obj;
  const out = { ...obj };
  try {
    if (typeof out.tags === 'string') {
      out.tags = out.tags ? JSON.parse(out.tags) : [];
    } else if (!Array.isArray(out.tags)) {
      out.tags = Array.isArray(out.tags) ? out.tags : [];
    }
  } catch (e) {
    out.tags = typeof out.tags === 'string' ? out.tags.split(',').map(s => s.trim()).filter(Boolean) : [];
  }
  return out;
}

// GET / - list IOCs (simple list, optional filters)
router.get('/', async (req, res) => {
  try {
    const where = buildWhere(req.query);
    const rows = await IOCIndicator.findAll({ where, order: [['created_at', 'DESC']] });
    const out = rows.map(r => normalizeTagsField(typeof r.toJSON === 'function' ? r.toJSON() : r));
    res.json(normalizeArray(out));
  } catch (err) {
    console.error('ioc list error', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// GET /:id - get IOC by id
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const row = await IOCIndicator.findByPk(id);
    if (!row) return res.status(404).json({ error: 'ioc not found' });
    res.json(normalize(normalizeTagsField(typeof row.toJSON === 'function' ? row.toJSON() : row)));
  } catch (err) {
    console.error('ioc get error', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// POST / - create IOC (simple validation only)
router.post('/', async (req, res) => {
  try {
    const value = req.body.value ?? req.body.indicator_value;
    const type = req.body.type ?? req.body.indicator_type;

    if (!value || !String(value).trim()) return res.status(400).json({ error: 'indicator value is required' });
    if (!type || !String(type).trim()) return res.status(400).json({ error: 'indicator type is required' });

    // ensure tags are serialized to string (Sequelize TEXT column expects a string)
    const tagsArray = parseTags(req.body.tags);
    const tagsForDb = tagsArray.length ? JSON.stringify(tagsArray) : null;

    const payload = {
      indicator_value: String(value).trim(),
      indicator_type: String(type).trim(),
      source: req.body.source ? String(req.body.source).trim() : null,
      severity: req.body.severity ? String(req.body.severity).trim() : null,
      confidence_score: req.body.confidence !== undefined ? Number(req.body.confidence) : undefined,
      description: req.body.description ? String(req.body.description).trim() : null,
      tags: tagsForDb,
      is_active: req.body.is_active === undefined ? true : !!req.body.is_active,
    };

    const created = await IOCIndicator.create(payload);
    const createdJson = typeof created.toJSON === 'function' ? created.toJSON() : created;

    res.status(201)
      .location(`/api/iocs/${encodeURIComponent(createdJson.id)}`)
      .json({ ok: true, ioc: normalize(normalizeTagsField(createdJson)) });
  } catch (err) {
    console.error('ioc create error', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// PUT /:id - update IOC (simple patch semantics)
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const row = await IOCIndicator.findByPk(id);
    if (!row) return res.status(404).json({ error: 'ioc not found' });

    const updates = {};
    if (req.body.type !== undefined) updates.indicator_type = String(req.body.type);
    if (req.body.value !== undefined) updates.indicator_value = String(req.body.value);
    if (req.body.source !== undefined) updates.source = req.body.source === null ? null : String(req.body.source);
    if (req.body.severity !== undefined) updates.severity = req.body.severity === null ? null : String(req.body.severity);
    if (req.body.confidence !== undefined) updates.confidence_score = req.body.confidence === null ? null : Number(req.body.confidence);
    if (req.body.description !== undefined) updates.description = req.body.description === null ? null : String(req.body.description);
    if (req.body.tags !== undefined) {
      const tagsArr = parseTags(req.body.tags);
      updates.tags = tagsArr.length ? JSON.stringify(tagsArr) : null;
    }
    if (req.body.is_active !== undefined) updates.is_active = !!req.body.is_active;

    await row.update(updates);
    res.json(normalize(normalizeTagsField(typeof row.toJSON === 'function' ? row.toJSON() : row)));
  } catch (err) {
    console.error('ioc update error', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// DELETE /:id - hard delete
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const row = await IOCIndicator.findByPk(id);
    if (!row) return res.status(404).json({ error: 'ioc not found' });
    await row.destroy();
    res.status(204).end();
  } catch (err) {
    console.error('ioc delete error', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// PUT /:id/deactivate - mark as inactive (kept because it's simple)
router.put('/:id/deactivate', async (req, res) => {
  try {
    const id = req.params.id;
    const row = await IOCIndicator.findByPk(id);
    if (!row) return res.status(404).json({ error: 'ioc not found' });
    await row.update({ is_active: false });
    res.json({ ok: true });
  } catch (err) {
    console.error('ioc deactivate error', err);
    res.status(500).json({ error: 'internal error' });
  }
});

export default router;