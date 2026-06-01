import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Create server/.env (see server/.env.example).');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('[db] Connected to MongoDB');
  return mongoose.connection;
}
