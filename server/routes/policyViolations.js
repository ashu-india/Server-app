import express from 'express';
import { Op } from 'sequelize';
import { PolicyViolation, Client, SecurityPolicy } from '../models/index.js';
import { normalize, normalizeArray } from '../utils/serializers.js';

const router = express.Router();

// Get all policy violations with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      severity, 
      client_id, 
      violation_type,
      start_date,
      end_date,
      limit = 50,
      offset = 0,
      page = 1
    } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (client_id) where.client_id = client_id;
    if (violation_type) where.violation_type = violation_type;
    
    // Date range filtering
    if (start_date || end_date) {
      where.detected_at = {};
      if (start_date) where.detected_at[Op.gte] = new Date(start_date);
      if (end_date) where.detected_at[Op.lte] = new Date(end_date);
    }
    
    const limitInt = parseInt(limit);
    const offsetInt = parseInt(offset);
    const pageInt = parseInt(page);
    
    const { count, rows: violations } = await PolicyViolation.findAndCountAll({
      where,
      include: [{
        model: Client,
        attributes: ['id', 'hostname', 'unique_id', 'status']
      }],
      order: [['detected_at', 'DESC']],
      limit: limitInt,
      offset: offsetInt
    });
    
    // Return paginated response format that frontend expects
    res.json({
      data: normalizeArray(violations.map(v => v.toJSON())),
      total: count,
      page: pageInt,
      limit: limitInt,
      hasMore: (offsetInt + limitInt) < count
    });
  } catch (err) { 
    console.error('Error fetching violations:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Get violation by ID
router.get('/:id', async (req, res) => {
  try {
    const violation = await PolicyViolation.findByPk(req.params.id, {
      include: [{
        model: Client,
        attributes: ['id', 'hostname', 'unique_id', 'status', 'os_name', 'os_version']
      }]
    });
    
    if (!violation) {
      return res.status(404).json({ error: 'Policy violation not found' });
    }
    
    res.json(normalize(violation.toJSON()));
  } catch (err) { 
    console.error('Error fetching violation:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Search violations
router.get('/search', async (req, res) => {
  try {
    const { q, status, severity, violation_type, start_date, end_date } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const where = {
      [Op.or]: [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { violation_type: { [Op.iLike]: `%${q}%` } },
        { client_id: { [Op.iLike]: `%${q}%` } }
      ]
    };
    
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (violation_type) where.violation_type = violation_type;
    
    // Date range filtering
    if (start_date || end_date) {
      where.detected_at = {};
      if (start_date) where.detected_at[Op.gte] = new Date(start_date);
      if (end_date) where.detected_at[Op.lte] = new Date(end_date);
    }
    
    const violations = await PolicyViolation.findAll({
      where,
      include: [{
        model: Client,
        attributes: ['id', 'hostname', 'unique_id', 'status']
      }],
      order: [['detected_at', 'DESC']],
      limit: 50
    });
    
    res.json(normalizeArray(violations.map(v => v.toJSON())));
  } catch (err) { 
    console.error('Error searching violations:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Get violations by client
router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { status, severity, violation_type, start_date, end_date } = req.query;
    
    const where = { client_id: clientId };
    
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (violation_type) where.violation_type = violation_type;
    
    // Date range filtering
    if (start_date || end_date) {
      where.detected_at = {};
      if (start_date) where.detected_at[Op.gte] = new Date(start_date);
      if (end_date) where.detected_at[Op.lte] = new Date(end_date);
    }
    
    const violations = await PolicyViolation.findAll({
      where,
      include: [{
        model: Client,
        attributes: ['id', 'hostname', 'unique_id', 'status']
      }],
      order: [['detected_at', 'DESC']],
      limit: 100
    });
    
    res.json(normalizeArray(violations.map(v => v.toJSON())));
  } catch (err) { 
    console.error('Error fetching client violations:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Update violation status
router.put('/:id/resolve', async (req, res) => {
  try {
    const { notes } = req.body;
    
    const violation = await PolicyViolation.findByPk(req.params.id);
    if (!violation) {
      return res.status(404).json({ error: 'Policy violation not found' });
    }
    
    await violation.update({
      status: 'resolved',
      resolved_at: new Date(),
      resolution_notes: notes || violation.resolution_notes
    });
    
    res.json(normalize(violation.toJSON()));
  } catch (err) { 
    console.error('Error resolving violation:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Acknowledge violation
router.put('/:id/acknowledge', async (req, res) => {
  try {
    const { acknowledged_by } = req.body;
    
    const violation = await PolicyViolation.findByPk(req.params.id);
    if (!violation) {
      return res.status(404).json({ error: 'Policy violation not found' });
    }
    
    await violation.update({
      status: 'acknowledged',
      acknowledged_by: acknowledged_by || 'System',
      acknowledged_at: new Date()
    });
    
    res.json(normalize(violation.toJSON()));
  } catch (err) { 
    console.error('Error acknowledging violation:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Mark as false positive
router.put('/:id/false-positive', async (req, res) => {
  try {
    const { notes } = req.body;
    
    const violation = await PolicyViolation.findByPk(req.params.id);
    if (!violation) {
      return res.status(404).json({ error: 'Policy violation not found' });
    }
    
    await violation.update({
      status: 'false_positive',
      resolution_notes: notes || 'Marked as false positive',
      resolved_at: new Date()
    });
    
    res.json(normalize(violation.toJSON()));
  } catch (err) { 
    console.error('Error marking violation as false positive:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Get violation statistics - support both /stats and /stats/summary
router.get('/stats', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const where = {};
    if (start_date || end_date) {
      where.detected_at = {};
      if (start_date) where.detected_at[Op.gte] = new Date(start_date);
      if (end_date) where.detected_at[Op.lte] = new Date(end_date);
    }
    
    const violations = await PolicyViolation.findAll({ where });
    
    const stats = {
      total: violations.length,
      by_severity: {
        critical: violations.filter(v => v.severity === 'critical').length,
        high: violations.filter(v => v.severity === 'high').length,
        medium: violations.filter(v => v.severity === 'medium').length,
        low: violations.filter(v => v.severity === 'low').length
      },
      by_status: {
        open: violations.filter(v => v.status === 'open').length,
        acknowledged: violations.filter(v => v.status === 'acknowledged').length,
        resolved: violations.filter(v => v.status === 'resolved').length,
        false_positive: violations.filter(v => v.status === 'false_positive').length
      },
      by_type: violations.reduce((acc, violation) => {
        acc[violation.violation_type] = (acc[violation.violation_type] || 0) + 1;
        return acc;
      }, {})
    };
    
    res.json(stats);
  } catch (err) { 
    console.error('Error fetching violation stats:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Alias for /stats/summary
router.get('/stats/summary', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const where = {};
    if (start_date || end_date) {
      where.detected_at = {};
      if (start_date) where.detected_at[Op.gte] = new Date(start_date);
      if (end_date) where.detected_at[Op.lte] = new Date(end_date);
    }
    
    const violations = await PolicyViolation.findAll({ where });
    
    const stats = {
      total: violations.length,
      by_severity: {
        critical: violations.filter(v => v.severity === 'critical').length,
        high: violations.filter(v => v.severity === 'high').length,
        medium: violations.filter(v => v.severity === 'medium').length,
        low: violations.filter(v => v.severity === 'low').length
      },
      by_status: {
        open: violations.filter(v => v.status === 'open').length,
        acknowledged: violations.filter(v => v.status === 'acknowledged').length,
        resolved: violations.filter(v => v.status === 'resolved').length,
        false_positive: violations.filter(v => v.status === 'false_positive').length
      },
      by_type: violations.reduce((acc, violation) => {
        acc[violation.violation_type] = (acc[violation.violation_type] || 0) + 1;
        return acc;
      }, {})
    };
    
    res.json(stats);
  } catch (err) { 
    console.error('Error fetching violation stats summary:', err);
    res.status(500).json({ error: err.message }); 
  }
});

export default router;