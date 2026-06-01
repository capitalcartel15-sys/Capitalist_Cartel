import { Router } from 'express';
import { Payment } from '../models/Payment.js';
import { Client } from '../models/Client.js';
import { Profile } from '../models/Profile.js';
import { CommissionEarning } from '../models/CommissionEarning.js';
import { CommissionSetting } from '../models/CommissionSetting.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { calculateCommission } from '../lib/commission.js';

const router = Router();

router.use(authenticate);

// GET /api/payments — employees only see payments they handled.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.profile.role === 'employee') {
      filter.handler_id = req.profile._id;
    }
    const payments = await Payment.find(filter)
      .sort({ payment_date: -1 })
      .populate('client')
      .populate('handler');
    res.json(payments.map((p) => p.toJSON()));
  })
);

// POST /api/payments — admin/boss record a payment. Server computes the received
// amount and the commission split, then persists commission_earnings.
router.post(
  '/',
  requireRole('admin', 'boss'),
  asyncHandler(async (req, res) => {
    const { client_id, amount, payment_date, payment_method, notes } = req.body;
    if (!client_id || amount === undefined) {
      return res.status(400).json({ error: 'Client and amount are required' });
    }

    const client = await Client.findById(client_id);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const [settingsDocs, profileDocs] = await Promise.all([
      CommissionSetting.find(),
      Profile.find({ is_active: true }),
    ]);
    const settings = settingsDocs.reduce((acc, s) => {
      acc[s.setting_name] = Number(s.setting_value);
      return acc;
    }, {});
    const profiles = profileDocs.map((p) => p.toJSON());

    const handler = profiles.find((p) => p.id === String(client.current_handler_id));
    const { receivedAmount, commissions } = calculateCommission(
      Number(amount),
      handler,
      profiles,
      settings
    );

    const date = payment_date ? new Date(payment_date) : new Date();
    const payment = await Payment.create({
      client_id,
      amount: Number(amount),
      received_amount: receivedAmount,
      payment_date: date,
      payment_method: payment_method || 'cash',
      handler_id: client.current_handler_id || null,
      notes: notes || '',
      commission_calculated: true,
    });

    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    if (commissions.length) {
      await CommissionEarning.insertMany(
        commissions.map((c) => ({
          user_id: c.userId,
          payment_id: payment._id,
          commission_amount: c.amount,
          commission_type: c.type,
          month,
          year,
        }))
      );
    }

    await payment.populate('client');
    await payment.populate('handler');
    res.status(201).json(payment.toJSON());
  })
);

export default router;
