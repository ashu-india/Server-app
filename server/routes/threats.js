import express from 'express';
import { Op } from 'sequelize';
import { ClientThreatHistory } from '../models/index.js';
import { normalizeArray } from '../utils/serializers.js';

const router = express.Router();

// GET /api/threats/recent
// Query params: since (ISO string) OR hours (number), severity, client_id, page, pageSize
router.get('/recent', async (req, res) => {
  try {
    const { since, hours, severity, client_id } = req.query;
    let page = Number(req.query.page || 1);
    let pageSize = Number(req.query.pageSize || 20);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(pageSize) || pageSize < 1) pageSize = 20;
    // limit pageSize to reasonable max
    pageSize = Math.min(200, pageSize);

    const where = {};
    if (since) {
      const d = new Date(String(since));
      if (!isNaN(d.getTime())) where.detected_at = { [Op.gte]: d };
    } else if (hours) {
      const h = Number(hours);
      if (!isNaN(h) && h > 0) where.detected_at = { [Op.gte]: new Date(Date.now() - h * 60 * 60 * 1000) };
    }

    if (severity) where.severity = String(severity);
    if (client_id) where.client_id = Number(client_id);

    const offset = (page - 1) * pageSize;
    const { rows, count } = await ClientThreatHistory.findAndCountAll({ where, order: [['detected_at', 'DESC']], limit: pageSize, offset });
    const items = normalizeArray(rows.map(r => (typeof r.toJSON === 'function' ? r.toJSON() : r)));
    res.json({ items, total: count, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
