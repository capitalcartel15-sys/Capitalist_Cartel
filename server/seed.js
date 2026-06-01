import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { CommissionSetting } from './models/CommissionSetting.js';
import { MonthlyTarget } from './models/MonthlyTarget.js';

// Default commission settings — mirrors the original SQL seed.
const DEFAULT_SETTINGS = [
  { setting_name: 'received_percentage', setting_value: 90, description: 'Percentage of payment actually received (10% deducted)' },
  { setting_name: 'employee_commission', setting_value: 30, description: 'Employee commission percentage when handling client' },
  { setting_name: 'boss_split_percentage', setting_value: 50, description: 'How bosses split the remaining 70% (50-50)' },
  { setting_name: 'handler_transfer_previous', setting_value: 20, description: 'Previous handler commission after transfer' },
  { setting_name: 'handler_transfer_new', setting_value: 80, description: 'New handler commission after transfer' },
];

// Seeds default settings and current-month targets. Idempotent.
export async function seed() {
  for (const s of DEFAULT_SETTINGS) {
    await CommissionSetting.updateOne(
      { setting_name: s.setting_name },
      { $setOnInsert: s },
      { upsert: true }
    );
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const defaultTargets = [
    { role: 'employee', target_amount: 80000 },
    { role: 'boss', target_amount: 150000 },
  ];
  for (const t of defaultTargets) {
    await MonthlyTarget.updateOne(
      { role: t.role, month, year },
      { $setOnInsert: { ...t, month, year } },
      { upsert: true }
    );
  }

  console.log('[seed] Default settings and current-month targets ensured.');
}

// Allow running standalone: `npm run seed`.
const isMain = process.argv[1] && process.argv[1].endsWith('seed.js');
if (isMain) {
  connectDB()
    .then(seed)
    .then(() => mongoose.connection.close())
    .then(() => {
      console.log('[seed] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[seed] Failed:', err);
      process.exit(1);
    });
}
