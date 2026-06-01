import mongoose from 'mongoose';
import { baseToJSON } from '../lib/serialize.js';

const archiveSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    total_earnings: { type: Number, default: 0 },
    total_payments: { type: Number, default: 0 },
    total_clients: { type: Number, default: 0 },
    target_achieved: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: baseToJSON,
  }
);

archiveSchema.virtual('user', {
  ref: 'Profile',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

export const MonthlyDataArchive = mongoose.model('MonthlyDataArchive', archiveSchema);
