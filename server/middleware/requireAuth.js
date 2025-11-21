import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

export default function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  console.log('🔒 requireAuth check: Authorization header present =', !!auth, 'path=', req.path, 'method=', req.method);
  if (!auth || !auth.startsWith('Bearer ')) {
    console.warn('❌ requireAuth: missing or malformed Authorization header', { auth: !!auth, path: req.path });
    return res.status(401).json({ error: 'Unauthorized', debug: { authPresent: !!auth } });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // attach to req
    req.user = payload;
    console.log('✅ requireAuth: token verified for user', payload.email);
    next();
  } catch (err) {
    console.warn('❌ requireAuth: token verification failed', { err: err.message });
    return res.status(401).json({ error: 'Invalid token' });
  }
}
