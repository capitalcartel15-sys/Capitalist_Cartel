import { Router } from 'express';
import { Profile } from '../models/Profile.js';
import { Payment } from '../models/Payment.js';
import { Client } from '../models/Client.js';
import { CommissionEarning } from '../models/CommissionEarning.js';
import { MonthlyTarget } from '../models/MonthlyTarget.js';
import { MonthlyDataArchive } from '../models/MonthlyDataArchive.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.use(authenticate);

const DEFAULT_TARGET = { employee: 80000, boss: 150000 };

// POST /api/admin/monthly-reset — archive the current month for every non-admin
// user, then roll the current targets forward to next month. Admin only.
// Ported from supabase/functions/monthly-reset/index.ts.
router.post(
  '/monthly-reset',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const users = await Profile.find({ is_active: true });
    const archivedUsers = [];

    for (const user of users) {
      if (user.role === 'admin') continue;

      const earnings = await CommissionEarning.find({
        user_id: user._id,
        month: currentMonth,
        year: currentYear,
      });
      const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.commission_amount), 0);

      const [paymentCount, clientCount, targetDoc, existingArchive] = await Promise.all([
        Payment.countDocuments({ handler_id: user._id }),
        Client.countDocuments({ current_handler_id: user._id }),
        MonthlyTarget.findOne({ role: user.role, month: currentMonth, year: currentYear }),
        MonthlyDataArchive.findOne({ user_id: user._id, month: currentMonth, year: currentYear }),
      ]);

      const targetAmount = targetDoc?.target_amount ?? DEFAULT_TARGET[user.role] ?? 0;

      if (!existingArchive) {
        await MonthlyDataArchive.create({
          user_id: user._id,
          month: currentMonth,
          year: currentYear,
          total_earnings: totalEarnings,
          total_payments: paymentCount,
          total_clients: clientCount,
          target_achieved: totalEarnings >= targetAmount,
          data: { earnings: earnings.map((e) => e.toJSON()) },
        });
        archivedUsers.push({ id: user.id, name: user.full_name, earnings: totalEarnings });
      }
    }

    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    const currentTargets = await MonthlyTarget.find({ month: currentMonth, year: currentYear });
    for (const target of currentTargets) {
      const existingTarget = await MonthlyTarget.findOne({
        role: target.role,
        month: nextMonth,
        year: nextYear,
      });
      if (!existingTarget) {
        await MonthlyTarget.create({
          role: target.role,
          target_amount: target.target_amount,
          month: nextMonth,
          year: nextYear,
        });
      }
    }

    res.json({
      success: true,
      message: 'Monthly reset completed successfully',
      archived_users: archivedUsers.length,
      next_period: { month: nextMonth, year: nextYear },
    });
  })
);

export default router;
