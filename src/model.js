import mongoose from 'mongoose';

export function getUserModel(tableName = 'users') {
  if (!tableName) throw new Error('tableName is required');

  if (mongoose.models[tableName]) return mongoose.models[tableName];

  const schema = new mongoose.Schema(
    {
      email: { type: String, required: true, unique: true, index: true },
      password: { type: String, required: true }
    },
    { timestamps: true, strict: false }
  );

  return mongoose.model(tableName, schema);
}