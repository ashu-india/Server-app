import express from 'express';
import { SecurityPolicy } from '../models/index.js';
import { normalize, normalizeArray } from '../utils/serializers.js';

const router = express.Router();

// Get all security policies
router.get('/', async (req, res) => {
  try {
    const { is_active, category } = req.query;
    
    const where = {};
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (category) where.category = category;
    
    const policies = await SecurityPolicy.findAll({
      where,
      order: [['severity', 'DESC'], ['name', 'ASC']]
    });
    
    res.json(normalizeArray(policies.map(p => p.toJSON())));
  } catch (err) { 
    console.error('Error fetching policies:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Get policy by ID
router.get('/:id', async (req, res) => {
  try {
    const policy = await SecurityPolicy.findByPk(req.params.id);
    
    if (!policy) {
      return res.status(404).json({ error: 'Security policy not found' });
    }
    
    res.json(normalize(policy.toJSON()));
  } catch (err) { 
    console.error('Error fetching policy:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Create new policy
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      rules,
      severity,
      category,
      is_active = true,
      auto_remediate = false,
      remediation_script,
      notification_enabled = true,
      check_frequency = 300
    } = req.body;
    
    // Validate required fields
    if (!name || !description || !rules || !severity || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const policy = await SecurityPolicy.create({
      name,
      description,
      rules,
      severity,
      category,
      is_active,
      auto_remediate,
      remediation_script,
      notification_enabled,
      check_frequency
    });
    
    res.status(201).json(normalize(policy.toJSON()));
  } catch (err) { 
    console.error('Error creating policy:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Update policy
router.put('/:id', async (req, res) => {
  try {
    const policy = await SecurityPolicy.findByPk(req.params.id);
    
    if (!policy) {
      return res.status(404).json({ error: 'Security policy not found' });
    }
    
    await policy.update(req.body);
    
    res.json(normalize(policy.toJSON()));
  } catch (err) { 
    console.error('Error updating policy:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Delete policy
router.delete('/:id', async (req, res) => {
  try {
    const policy = await SecurityPolicy.findByPk(req.params.id);
    
    if (!policy) {
      return res.status(404).json({ error: 'Security policy not found' });
    }
    
    await policy.destroy();
    
    res.json({ success: true, message: 'Policy deleted successfully' });
  } catch (err) { 
    console.error('Error deleting policy:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Toggle policy status
router.put('/:id/toggle', async (req, res) => {
  try {
    const policy = await SecurityPolicy.findByPk(req.params.id);
    
    if (!policy) {
      return res.status(404).json({ error: 'Security policy not found' });
    }
    
    await policy.update({ is_active: !policy.is_active });
    
    res.json(normalize(policy.toJSON()));
  } catch (err) { 
    console.error('Error toggling policy:', err);
    res.status(500).json({ error: err.message }); 
  }
});

export default router;