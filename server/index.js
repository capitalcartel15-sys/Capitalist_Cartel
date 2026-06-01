import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import { seed } from './seed.js';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import clientRoutes from './routes/clients.js';
import paymentRoutes from './routes/payments.js';
import targetRoutes from './routes/targets.js';
import settingRoutes from './routes/settings.js';
import earningRoutes from './routes/earnings.js';
import archiveRoutes from './routes/archives.js';
import adminRoutes from './routes/admin.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/earnings', earningRoutes);
app.use('/api/archives', archiveRoutes);
app.use('/api/admin', adminRoutes);

// Central error handler.
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  if (err?.code === 11000) {
    return res.status(409).json({ error: 'Duplicate value violates a unique constraint' });
  }
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

connectDB()
  .then(seed)
  .then(() => {
    app.listen(PORT, () => console.log(`[server] API listening on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  });
