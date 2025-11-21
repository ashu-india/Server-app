import express from 'express';
import { Op } from 'sequelize';
import { NetworkChange, Client } from '../models/index.js';
import { normalize, normalizeArray } from '../utils/serializers.js';

const router = express.Router();

// Get all network changes
router.get('/', async (req, res) => {
  try {
    const { 
      client_id, 
      change_type,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = req.query;
    
    const where = {};
    if (client_id) where.client_id = client_id;
    if (change_type) where.change_type = change_type;
    
    // Date range filtering
    if (start_date || end_date) {
      where.detected_at = {};
      if (start_date) where.detected_at[Op.gte] = new Date(start_date);
      if (end_date) where.detected_at[Op.lte] = new Date(end_date);
    }
    
    const changes = await NetworkChange.findAll({
      where,
      include: [{
        model: Client,
        attributes: ['id', 'hostname', 'unique_id']
      }],
      order: [['detected_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json(normalizeArray(changes.map(c => c.toJSON())));
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// Create network change (typically called by policy service)
router.post('/', async (req, res) => {
  try {
    const {
      client_id,
      interface_name,
      old_ipv4,
      new_ipv4,
      old_ipv6,
      new_ipv6,
      old_mac,
      new_mac,
      change_type
    } = req.body;
    
    const change = await NetworkChange.create({
      client_id,
      interface_name,
      old_ipv4,
      new_ipv4,
      old_ipv6,
      new_ipv6,
      old_mac,
      new_mac,
      change_type,
      detected_at: new Date()
    });
    
    res.status(201).json(normalize(change.toJSON()));
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// Get network change statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const where = {};
    if (start_date || end_date) {
      where.detected_at = {};
      if (start_date) where.detected_at[Op.gte] = new Date(start_date);
      if (end_date) where.detected_at[Op.lte] = new Date(end_date);
    }
    
    const changes = await NetworkChange.findAll({ where });
    
    const stats = {
      total_changes: changes.length,
      changes_by_type: changes.reduce((acc, change) => {
        acc[change.change_type] = (acc[change.change_type] || 0) + 1;
        return acc;
      }, {}),
      changes_by_client: changes.reduce((acc, change) => {
        acc[change.client_id] = (acc[change.client_id] || 0) + 1;
        return acc;
      }, {}),
      recent_changes: changes.slice(0, 10).map(c => ({
        client_id: c.client_id,
        interface_name: c.interface_name,
        change_type: c.change_type,
        detected_at: c.detected_at
      }))
    };
    
    res.json(stats);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

export default router;