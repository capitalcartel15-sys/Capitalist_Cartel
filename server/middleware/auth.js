import jwt from 'jsonwebtoken';
import { Profile } from '../models/Profile.js';

export function signToken(profile) {
  return jwt.sign(
    { sub: profile.id, role: profile.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Verifies the Bearer token, loads the profile, and attaches it as req.profile.
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing authentication token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const profile = await Profile.findById(payload.sub);
    if (!profile || !profile.is_active) {
      return res.status(401).json({ error: 'Invalid or inactive account' });
    }

    req.profile = profile;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Guards a route to specific roles. Use after authenticate.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.profile || !roles.includes(req.profile.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
