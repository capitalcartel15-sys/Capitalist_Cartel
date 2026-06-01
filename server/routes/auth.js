import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Profile } from '../models/Profile.js';
import { signToken, authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

// Role assignment preserved from the original Supabase trigger (handle_new_user).
const ADMIN_EMAILS = ['gm3908827@gmail.com'];
const BOSS_EMAILS = ['pry14314@gmail.com', 'rishabhrcc15@gmail.com'];

function roleForEmail(email) {
  const e = email.toLowerCase();
  if (ADMIN_EMAILS.includes(e)) return 'admin';
  if (BOSS_EMAILS.includes(e)) return 'boss';
  return 'employee';
}

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { email, password, full_name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await Profile.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const profile = await Profile.create({
      email: email.toLowerCase(),
      password_hash,
      full_name: full_name || '',
      role: roleForEmail(email),
    });

    const token = signToken(profile);
    res.status(201).json({ token, profile: profile.toJSON() });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const profile = await Profile.findOne({ email: String(email).toLowerCase() });
    if (!profile) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!profile.is_active) {
      return res.status(403).json({ error: 'This account has been deactivated' });
    }

    const ok = await bcrypt.compare(password, profile.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(profile);
    res.json({ token, profile: profile.toJSON() });
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ profile: req.profile.toJSON() });
  })
);

export default router;
