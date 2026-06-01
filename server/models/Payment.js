import mongoose from 'mongoose';
import { baseToJSON } from '../lib/serialize.js';

const paymentSchema = new mongoose.Schema(
  {
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    amount: { type: Number, required: true, default: 0 },
    received_amount: { type: Number, required: true, default: 0 },
    payment_date: { type: Date, default: Date.now },
    payment_method: { type: String, default: 'cash' },
    handler_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null },
    commission_calculated: { type: Boolean, default: false },
    notes: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: baseToJSON,
  }
);

paymentSchema.virtual('client', {
  ref: 'Client',
  localField: 'client_id',
  foreignField: '_id',
  justOne: true,
});

paymentSchema.virtual('handler', {
  ref: 'Profile',
  localField: 'handler_id',
  foreignField: '_id',
  justOne: true,
});

export const Payment = mongoose.model('Payment', paymentSchema);
