import mongoose from 'mongoose';
import { baseToJSON } from '../lib/serialize.js';

const targetSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['employee', 'boss'], required: true },
    target_amount: { type: Number, required: true, default: 0 },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: baseToJSON,
  }
);

targetSchema.index({ role: 1, month: 1, year: 1 }, { unique: true });

export const MonthlyTarget = mongoose.model('MonthlyTarget', targetSchema);
