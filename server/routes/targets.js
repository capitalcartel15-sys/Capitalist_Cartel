import { Router } from 'express';
import { MonthlyTarget } from '../models/MonthlyTarget.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.use(authenticate);

// GET /api/targets?month=&year=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.month) filter.month = Number(req.query.month);
    if (req.query.year) filter.year = Number(req.query.year);
    const targets = await MonthlyTarget.find(filter);
    res.json(targets.map((t) => t.toJSON()));
  })
);

// PUT /api/targets — upsert a target by role+month+year. Admin only.
router.put(
  '/',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { role, target_amount, month, year } = req.body;
    if (!role || month === undefined || year === undefined) {
      return res.status(400).json({ error: 'role, month and year are required' });
    }
    const target = await MonthlyTarget.findOneAndUpdate(
      { role, month: Number(month), year: Number(year) },
      { $set: { target_amount: Number(target_amount) || 0 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(target.toJSON());
  })
);

export default router;
