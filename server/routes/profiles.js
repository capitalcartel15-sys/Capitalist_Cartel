import { Router } from 'express';
import { Profile } from '../models/Profile.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.use(authenticate);

// GET /api/profiles?active=1
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.active === '1' || req.query.active === 'true') {
      filter.is_active = true;
    }
    const profiles = await Profile.find(filter).sort({ created_at: 1 });
    res.json(profiles.map((p) => p.toJSON()));
  })
);

// PATCH /api/profiles/:id — admin only (role / is_active / full_name).
router.patch(
  '/:id',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const updates = {};
    if (req.body.role !== undefined) updates.role = req.body.role;
    if (req.body.is_active !== undefined) updates.is_active = req.body.is_active;
    if (req.body.full_name !== undefined) updates.full_name = req.body.full_name;

    const profile = await Profile.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile.toJSON());
  })
);

export default router;
