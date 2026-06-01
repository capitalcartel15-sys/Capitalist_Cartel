import { Router } from 'express';
import { Client } from '../models/Client.js';
import { Payment } from '../models/Payment.js';
import { ClientHandlerHistory } from '../models/ClientHandlerHistory.js';
import { CommissionSetting } from '../models/CommissionSetting.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.use(authenticate);

// GET /api/clients — employees only see clients they currently handle.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.profile.role === 'employee') {
      filter.current_handler_id = req.profile._id;
    }
    const clients = await Client.find(filter)
      .sort({ created_at: -1 })
      .populate('current_handler');
    res.json(clients.map((c) => c.toJSON()));
  })
);

// POST /api/clients — admin/boss only.
router.post(
  '/',
  requireRole('admin', 'boss'),
  asyncHandler(async (req, res) => {
    const { name, phone, email, notes, status, current_handler_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const client = await Client.create({
      name,
      phone: phone || '',
      email: email || '',
      notes: notes || '',
      status: status || 'active',
      current_handler_id: current_handler_id || null,
    });
    await client.populate('current_handler');
    res.status(201).json(client.toJSON());
  })
);

// PATCH /api/clients/:id — admin/boss only.
router.patch(
  '/:id',
  requireRole('admin', 'boss'),
  asyncHandler(async (req, res) => {
    const allowed = ['name', 'phone', 'email', 'notes', 'status', 'current_handler_id'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const client = await Client.findByIdAndUpdate(req.params.id, updates, { new: true }).populate(
      'current_handler'
    );
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client.toJSON());
  })
);

// DELETE /api/clients/:id — admin only.
router.delete(
  '/:id',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true });
  })
);

// GET /api/clients/:id/history — handler change history.
router.get(
  '/:id/history',
  asyncHandler(async (req, res) => {
    const history = await ClientHandlerHistory.find({ client_id: req.params.id })
      .sort({ change_date: -1 })
      .populate('previous_handler')
      .populate('new_handler');
    res.json(history.map((h) => h.toJSON()));
  })
);

// GET /api/clients/:id/payments — payments for one client.
router.get(
  '/:id/payments',
  asyncHandler(async (req, res) => {
    const payments = await Payment.find({ client_id: req.params.id })
      .sort({ payment_date: -1 })
      .populate('client')
      .populate('handler');
    res.json(payments.map((p) => p.toJSON()));
  })
);

// POST /api/clients/:id/transfer — reassign handler + record history. Admin/boss only.
router.post(
  '/:id/transfer',
  requireRole('admin', 'boss'),
  asyncHandler(async (req, res) => {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const newHandlerId = req.body.new_handler_id || null;
    const previousHandlerId = client.current_handler_id || null;

    const settings = await CommissionSetting.find();
    const settingsMap = settings.reduce((acc, s) => {
      acc[s.setting_name] = Number(s.setting_value);
      return acc;
    }, {});

    await ClientHandlerHistory.create({
      client_id: client._id,
      previous_handler_id: previousHandlerId,
      new_handler_id: newHandlerId,
      commission_percentage_previous: settingsMap.handler_transfer_previous ?? 20,
      commission_percentage_new: settingsMap.handler_transfer_new ?? 80,
    });

    client.current_handler_id = newHandlerId;
    await client.save();
    await client.populate('current_handler');
    res.json(client.toJSON());
  })
);

export default router;
