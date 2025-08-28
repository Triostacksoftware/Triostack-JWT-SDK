import mongoose from 'mongoose';

export async function connectDB(MONGODB_URI) {
  if (!MONGODB_URI) throw new Error('MONGODB_URI is required');
  if (mongoose.connection.readyState >= 1) return mongoose.connection;
  return mongoose.connect(MONGODB_URI);
}