import mongoose from 'mongoose';
import { baseToJSON } from '../lib/serialize.js';

const profileSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'boss', 'employee'], default: 'employee' },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: baseToJSON,
  }
);

export const Profile = mongoose.model('Profile', profileSchema);
