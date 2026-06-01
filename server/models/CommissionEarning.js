import mongoose from 'mongoose';
import { baseToJSON } from '../lib/serialize.js';

const earningSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    commission_amount: { type: Number, required: true, default: 0 },
    commission_type: { type: String, enum: ['primary', 'secondary'], default: 'primary' },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: baseToJSON,
  }
);

earningSchema.virtual('user', {
  ref: 'Profile',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

earningSchema.virtual('payment', {
  ref: 'Payment',
  localField: 'payment_id',
  foreignField: '_id',
  justOne: true,
});

export const CommissionEarning = mongoose.model('CommissionEarning', earningSchema);
