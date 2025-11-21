import express from 'express';
import { Alert } from '../models/index.js';
import { normalize, normalizeArray } from '../utils/serializers.js';

const router = express.Router();

// GET /api/alerts - Fetch alerts
router.get('/', async (req, res) => {
  try {
    const { acknowledged } = req.query;
    const where = {};

    // Filter based on acknowledged status if provided
    if (acknowledged !== undefined) {
      where.acknowledged_at = acknowledged === 'true' ? { $ne: null } : null;
    }

    // Fetch the alerts from the database
    const rows = await Alert.findAll({
      where,
      order: [['detected_at', 'DESC']],
    });

    // Set headers to disable caching
    res.set('Cache-Control', 'no-store'); // Prevent caching
    res.set('Pragma', 'no-cache'); // Legacy HTTP/1.0 cache control
    res.set('Expires', '0'); // Expire immediately

    // Send the response with fresh data
    res.json(normalizeArray(rows.map((r) => (typeof r.toJSON === 'function' ? r.toJSON() : r))));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts - Create a new alert
router.post('/', async (req, res) => {
  try {
    const { client_id, title, description, severity } = req.body;
    const alert = await Alert.create({
      client_id: client_id || null,
      title,
      description,
      severity,
      detected_at: new Date(),
      status: 'open',
    });
    res.status(201).json(normalize(alert.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/alerts/:id/acknowledge - Acknowledge an alert
router.put('/:id/acknowledge', async (req, res) => {
  try {
    await Alert.update(
      { acknowledged_at: new Date(), updated_at: new Date(), status: 'acknowledged' },
      { where: { id: req.params.id } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// PUT /api/alerts/:id/acknowledge - Acknowledge an alert
router.put('/:id/resolve', async (req, res) => {
  try {
    await Alert.update(
      { resolved_at: new Date(), updated_at: new Date(), status: 'resolved' },
      { where: { id: req.params.id } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts/cleanup - Delete alerts older than the given days
router.post('/cleanup', async (req, res) => {
  try {
    const days = Number(req.body.days || req.query.days || 0);
    if (!days || isNaN(days) || days <= 0)
      return res.status(400).json({ error: 'Invalid days parameter' });

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const deleted = await Alert.destroy({ where: { detected_at: { $lt: cutoff } } });
    res.json({ ok: true, deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
