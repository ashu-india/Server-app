import express from 'express';
import { User } from '../models/index.js';
import requireAuth from '../middleware/requireAuth.js';
import { normalize } from '../utils/serializers.js';

const router = express.Router();

// GET /api/profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const userData = normalize(user.toJSON());
    res.json({ user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profile - update profile fields or settings
router.put('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { full_name, settings } = req.body;
    if (typeof full_name !== 'undefined') user.full_name = full_name;
    if (typeof settings !== 'undefined') {
      // merge settings with existing
      const existing = user.settings || {};
      user.settings = { ...existing, ...settings };
    }
    await user.save();
    const userData = normalize(user.toJSON());
    res.json({ user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
