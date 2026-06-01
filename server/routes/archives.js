import { Router } from 'express';
import { MonthlyDataArchive } from '../models/MonthlyDataArchive.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.use(authenticate);

// GET /api/archives — historical monthly data (admin/boss only), newest first.
router.get(
  '/',
  requireRole('admin', 'boss'),
  asyncHandler(async (req, res) => {
    const archives = await MonthlyDataArchive.find()
      .sort({ year: -1, month: -1 })
      .populate('user');
    res.json(archives.map((a) => a.toJSON()));
  })
);

export default router;
