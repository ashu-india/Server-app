import express from 'express';
import { Op } from 'sequelize';
import { 
  Client, 
  ClientSoftware, 
  ClientAntivirus, 
  ClientNetworkInfo, 
  ClientThreatHistory, 
  Alert,
  ClientSnapshot,
  PolicyViolation,
  NetworkChange,
  ComplianceStatus,
  ClientPerformanceMetrics,
  SecurityPolicy
} from '../models/index.js';
import { normalize, normalizeArray } from '../utils/serializers.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { status, threat_level } = req.query;
    const where = {};
    if (status) where.status = status;
    if (threat_level) where.threat_level = threat_level;
    const rows = await Client.findAll({ where, order: [['last_seen', 'DESC']] });
    res.json(normalizeArray(rows.map(r => (typeof r.toJSON === 'function' ? r.toJSON() : r))));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '');
    const like = `%${q}%`;
    const rows = await Client.findAll({
      where: {
        [Op.or]: [
          { hostname: { [Op.like]: like } },
          { unique_id: { [Op.like]: like } },
          { os_name: { [Op.like]: like } },
        ]
      },
      order: [['last_seen', 'DESC']]
    });
    res.json(normalizeArray(rows.map(r => (typeof r.toJSON === 'function' ? r.toJSON() : r))));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    res.json(client ? normalize(client.toJSON()) : null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/detail', async (req, res) => {
  try {
    const clientId = req.params.id;
    const client = await Client.findByPk(clientId);
    if (!client) return res.json({ client: null, software: [], antivirus: [], network: [], threats: [] });
    const [software, antivirus, network, threats] = await Promise.all([
      ClientSoftware.findAll({ where: { client_id: clientId }, order: [['created_at', 'DESC']] }),
      ClientAntivirus.findAll({ where: { client_id: clientId }, order: [['updated_at', 'DESC']] }),
      ClientNetworkInfo.findAll({ where: { client_id: clientId } }),
      ClientThreatHistory.findAll({ where: { client_id: clientId }, order: [['detected_at', 'DESC']] }),
    ]);
    res.json({ 
      client: normalize(client.toJSON()), 
      software: normalizeArray(software.map(s => (typeof s.toJSON === 'function' ? s.toJSON() : s))), 
      antivirus: normalizeArray(antivirus.map(a => (typeof a.toJSON === 'function' ? a.toJSON() : a))), 
      network: normalizeArray(network.map(n => (typeof n.toJSON === 'function' ? n.toJSON() : n))), 
      threats: normalizeArray(threats.map(t => (typeof t.toJSON === 'function' ? t.toJSON() : t))) 
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Individual client sub-resources used by frontend
router.get('/:id/software', async (req, res) => {
  try {
    const rows = await ClientSoftware.findAll({ where: { client_id: req.params.id }, order: [['created_at', 'DESC']] });
    res.json(normalizeArray((rows || []).map(r => (typeof r.toJSON === 'function' ? r.toJSON() : r))));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/antivirus', async (req, res) => {
  try {
    const rows = await ClientAntivirus.findAll({ where: { client_id: req.params.id }, order: [['updated_at', 'DESC']] });
    res.json(normalizeArray((rows || []).map(r => (typeof r.toJSON === 'function' ? r.toJSON() : r))));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/network', async (req, res) => {
  try {
    const rows = await ClientNetworkInfo.findAll({ where: { client_id: req.params.id } });
    res.json(normalizeArray((rows || []).map(r => (typeof r.toJSON === 'function' ? r.toJSON() : r))));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/threats', async (req, res) => {
  try {
    const rows = await ClientThreatHistory.findAll({ where: { client_id: req.params.id }, order: [['detected_at', 'DESC']] });
    res.json(normalizeArray((rows || []).map(r => (typeof r.toJSON === 'function' ? r.toJSON() : r))));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await Client.update({ status, updated_at: new Date() }, { where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/alerts', async (req, res) => {
  try {
    const rows = await Alert.findAll({ where: { client_id: req.params.id }, order: [['detected_at', 'DESC']] });
    res.json(normalizeArray(rows.map(r => (typeof r.toJSON === 'function' ? r.toJSON() : r))));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============ NEW POLICY VIOLATION ROUTES ============

// Client snapshots for change tracking
router.get('/:id/snapshots', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const rows = await ClientSnapshot.findAll({ 
      where: { client_id: req.params.id },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });
    res.json(normalizeArray(rows.map(r => (typeof r.toJSON === 'function' ? r.toJSON() : r))));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/snapshots/latest', async (req, res) => {
  try {
    const snapshot = await ClientSnapshot.findOne({ 
      where: { client_id: req.params.id },
      order: [['created_at', 'DESC']]
    });
    res.json(snapshot ? normalize(snapshot.toJSON()) : null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/snapshots', async (req, res) => {
  try {
    const { snapshot_data } = req.body;
    const snapshot = await ClientSnapshot.create({
      client_id: req.params.id,
      snapshot_data,
      created_at: new Date()
    });
    res.json(normalize(snapshot.toJSON()));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Policy violations
router.get('/:id/violations', async (req, res) => {
  try {
    const { status, severity, limit = 50 } = req.query;
    const where = { client_id: req.params.id };
    if (status) where.status = status;
    if (severity) where.severity = severity;
    
    const rows = await PolicyViolation.findAll({ 
      where,
      order: [['detected_at', 'DESC']],
      limit: parseInt(limit)
    });
    res.json(normalizeArray(rows.map(r => (typeof r.toJSON === 'function' ? r.toJSON() : r))));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Network changes
router.get('/:id/network-changes', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const rows = await NetworkChange.findAll({ 
      where: { client_id: req.params.id },
      order: [['detected_at', 'DESC']],
      limit: parseInt(limit)
    });
    res.json(normalizeArray(rows.map(r => (typeof r.toJSON === 'function' ? r.toJSON() : r))));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Compliance status
router.get('/:id/compliance', async (req, res) => {
  try {
    const compliance = await ComplianceStatus.findOne({ 
      where: { client_id: req.params.id },
      order: [['last_assessment', 'DESC']]
    });
    res.json(compliance ? normalize(compliance.toJSON()) : null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Performance metrics
router.get('/:id/performance-metrics', async (req, res) => {
  try {
    const { limit = 24 } = req.query; // Last 24 hours by default
    const rows = await ClientPerformanceMetrics.findAll({ 
      where: { client_id: req.params.id },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });
    res.json(normalizeArray(rows.map(r => (typeof r.toJSON === 'function' ? r.toJSON() : r))));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Trigger compliance analysis
router.post('/:id/analyze-compliance', async (req, res) => {
  try {
    // This would trigger the policy service analysis
    // For now, return success - the actual analysis happens in the service layer
    res.json({ 
      success: true, 
      message: 'Compliance analysis triggered',
      timestamp: new Date().toISOString()
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;