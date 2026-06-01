import mongoose from 'mongoose';
import { baseToJSON } from '../lib/serialize.js';

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    notes: { type: String, default: '' },
    current_handler_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null },
    status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: baseToJSON,
  }
);

// Exposes `current_handler` (the populated Profile) alongside `current_handler_id`.
clientSchema.virtual('current_handler', {
  ref: 'Profile',
  localField: 'current_handler_id',
  foreignField: '_id',
  justOne: true,
});

export const Client = mongoose.model('Client', clientSchema);
