import { Router } from 'express';
import { CommissionEarning } from '../models/CommissionEarning.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.use(authenticate);

// GET /api/earnings?userId=&month=&year=
// Populates `user` and `payment` (with the payment's nested `client`).
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.userId) filter.user_id = req.query.userId;
    if (req.query.month) filter.month = Number(req.query.month);
    if (req.query.year) filter.year = Number(req.query.year);

    const earnings = await CommissionEarning.find(filter)
      .sort({ created_at: -1 })
      .populate('user')
      .populate({ path: 'payment', populate: { path: 'client' } });
    res.json(earnings.map((e) => e.toJSON()));
  })
);

export default router;
