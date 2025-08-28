import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from './db.js';
import { getUserModel } from './model.js';
import { cookieOptionsByEnv } from './utils/cookies.js';

function reqParam(name, value) {
  if (value === undefined || value === null || value === '')
    throw new Error(`${name} is required`);
}

export async function register(params = {}) {
  const { JWT_SECRET_KEY, MONGODB_URI, NODE_ENV, tableName, email, password, ...restFields } = params;

  reqParam('JWT_SECRET_KEY', JWT_SECRET_KEY);
  reqParam('MONGODB_URI', MONGODB_URI);
  reqParam('NODE_ENV', NODE_ENV);
  reqParam('tableName', tableName);
  reqParam('email', email);
  reqParam('password', password);

  await connectDB(MONGODB_URI);
  const User = getUserModel(tableName);

  const existing = await User.findOne({ email });
  if (existing) throw new Error('User already exists');

  const hashed = await bcrypt.hash(password, 10);

  const RESERVED = new Set(['_id', 'password', 'createdAt', 'updatedAt']);
  const safeExtra = {};
  for (const [k, v] of Object.entries(restFields)) {
    if (!RESERVED.has(k)) safeExtra[k] = v;
  }

  const doc = new User({ email, password: hashed, ...safeExtra });
  await doc.save();

  return { msg: 'User registered successfully', userId: String(doc._id) };
}

export async function login(params = {}, res) {
  const { JWT_SECRET_KEY, MONGODB_URI, NODE_ENV, tableName, email, password } = params;

  reqParam('JWT_SECRET_KEY', JWT_SECRET_KEY);
  reqParam('MONGODB_URI', MONGODB_URI);
  reqParam('NODE_ENV', NODE_ENV);
  reqParam('tableName', tableName);
  reqParam('email', email);
  reqParam('password', password);
  if (!res) throw new Error('res (Express response) is required for login');

  await connectDB(MONGODB_URI);
  const User = getUserModel(tableName);

  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid credentials');

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new Error('Invalid credentials');

  const token = jwt.sign({ id: String(user._id),email:user.email,name:user.name}, JWT_SECRET_KEY, { expiresIn: '1d' });

  res.cookie('token', token, cookieOptionsByEnv(NODE_ENV));

  return { msg: 'Login successful', userId: String(user._id), token };
}

export function logout({ res }) {
  if (!res) throw new Error('res (Express response) is required for logout');
  
  // Clear cookie with both secure and non-secure options to handle all environments
  res.clearCookie('token', { 
    httpOnly: true, 
    sameSite: 'None', 
    secure: true,
    path: '/'
  });
  res.clearCookie('token', { 
    httpOnly: true, 
    sameSite: 'Lax', 
    secure: false,
    path: '/'
  });
  
  return { msg: 'Logged out' };
}

export function verifyToken(JWT_SECRET_KEY) {
  reqParam('JWT_SECRET_KEY', JWT_SECRET_KEY);
  return (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ msg: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET_KEY);
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ msg: 'Invalid token' });
    }
  };
}

export function isLoggedIn({ req, JWT_SECRET_KEY }) {
  reqParam('JWT_SECRET_KEY', JWT_SECRET_KEY);
  const token = req?.cookies?.token;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET_KEY);
  } catch {
    return null;
  }
}