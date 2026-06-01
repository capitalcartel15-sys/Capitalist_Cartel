import { Router } from 'express';
import { CommissionSetting } from '../models/CommissionSetting.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.use(authenticate);

// GET /api/settings — all commission settings.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const settings = await CommissionSetting.find().sort({ setting_name: 1 });
    res.json(settings.map((s) => s.toJSON()));
  })
);

// PATCH /api/settings/:name — update a setting value. Admin only.
router.patch(
  '/:name',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const setting = await CommissionSetting.findOneAndUpdate(
      { setting_name: req.params.name },
      { $set: { setting_value: Number(req.body.setting_value) } },
      { new: true }
    );
    if (!setting) return res.status(404).json({ error: 'Setting not found' });
    res.json(setting.toJSON());
  })
);

export default router;
