import mongoose from 'mongoose';
import { baseToJSON } from '../lib/serialize.js';

const historySchema = new mongoose.Schema(
  {
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    previous_handler_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null },
    new_handler_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null },
    change_date: { type: Date, default: Date.now },
    commission_percentage_previous: { type: Number, default: 0 },
    commission_percentage_new: { type: Number, default: 100 },
    notes: { type: String, default: '' },
  },
  { toJSON: baseToJSON }
);

historySchema.virtual('previous_handler', {
  ref: 'Profile',
  localField: 'previous_handler_id',
  foreignField: '_id',
  justOne: true,
});

historySchema.virtual('new_handler', {
  ref: 'Profile',
  localField: 'new_handler_id',
  foreignField: '_id',
  justOne: true,
});

export const ClientHandlerHistory = mongoose.model('ClientHandlerHistory', historySchema);
