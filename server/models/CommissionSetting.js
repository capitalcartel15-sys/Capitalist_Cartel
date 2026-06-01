import mongoose from 'mongoose';
import { baseToJSON } from '../lib/serialize.js';

const settingSchema = new mongoose.Schema(
  {
    setting_name: { type: String, required: true, unique: true },
    setting_value: { type: Number, required: true },
    description: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: false, updatedAt: 'updated_at' },
    toJSON: baseToJSON,
  }
);

export const CommissionSetting = mongoose.model('CommissionSetting', settingSchema);
