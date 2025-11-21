import express from 'express';
import { User } from '../models/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { normalize } from '../utils/serializers.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'user exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash: hashed, full_name: full_name || null, is_active: true });
    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '8h' });
    const userData = normalize(user.toJSON());
    res.json({ token, user: { id: userData.id, email: userData.email, full_name: userData.full_name } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
    const userData = normalize(user.toJSON());
    res.json({ token, user: { id: userData.id, email: userData.email, full_name: userData.full_name } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
