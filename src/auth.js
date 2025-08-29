import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { connectDB } from './db.js';
import { getUserModel } from './model.js';
import { cookieOptionsByEnv, generateOtpEmailHtml } from './utils/cookies.js';

function reqParam(name, value) {
  if (value === undefined || value === null || value === '')
    throw new Error(`${name} is required`);
}

// Generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create email transporter
function createTransporter(smtpConfig) {
  return nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: smtpConfig.SMTP_PORT,
    secure: false,
    auth: {
      user: smtpConfig.SMTP_USER,
      pass: smtpConfig.SMTP_PASS,
    },
  });
}

// Send OTP email
async function sendOtpEmail(smtpConfig, email, otp, emailTitle, emailDescr) {
  const transporter = createTransporter(smtpConfig);

  const mailOptions = {
    from: smtpConfig.SMTP_USER,
    to: email,
    subject: emailTitle,
    html: generateOtpEmailHtml(otp, emailTitle, emailDescr),
  };

  await transporter.sendMail(mailOptions);
}

export async function register(params = {}) {
  const {
    JWT_SECRET_KEY,
    MONGODB_URI,
    NODE_ENV,
    tableName,
    email,
    password,
    ...restFields
  } = params;

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
  const { JWT_SECRET_KEY, MONGODB_URI, NODE_ENV, tableName, email, password } =
    params;

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

  const token = jwt.sign(
    { id: String(user._id), email: user.email, name: user.name },
    JWT_SECRET_KEY,
    { expiresIn: '1d' }
  );

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
    path: '/',
  });
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'Lax',
    secure: false,
    path: '/',
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

export async function generateRegisterOtp(params = {}) {
  const {
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    MONGODB_URI,
    tableName,
    email,
    email_title,
    email_descr,
  } = params;

  reqParam('SMTP_PORT', SMTP_PORT);
  reqParam('SMTP_USER', SMTP_USER);
  reqParam('SMTP_PASS', SMTP_PASS);
  reqParam('MONGODB_URI', MONGODB_URI);
  reqParam('tableName', tableName);
  reqParam('email', email);
  reqParam('email_title', email_title);
  reqParam('email_descr', email_descr);

  await connectDB(MONGODB_URI);
  const User = getUserModel(tableName);

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }

  // Generate OTP and expiry (5 minutes from now)
  const otp = generateOtp();
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Create temporary user document with OTP
  const tempUser = new User({
    email,
    otp,
    expiry,
  });
  await tempUser.save();

  // Send OTP email
  await sendOtpEmail(
    { SMTP_PORT, SMTP_USER, SMTP_PASS },
    email,
    otp,
    email_title,
    email_descr
  );

  return {
    msg: 'OTP sent successfully for registration',
    email,
  };
}

export async function verifyOtpRegister(params = {}) {
  const { MONGODB_URI, tableName, email, otp, password, ...restFields } =
    params;

  reqParam('MONGODB_URI', MONGODB_URI);
  reqParam('tableName', tableName);
  reqParam('email', email);
  reqParam('otp', otp);
  reqParam('password', password);

  await connectDB(MONGODB_URI);
  const User = getUserModel(tableName);

  // Find user with matching email and OTP
  const user = await User.findOne({ email, otp });
  if (!user) {
    throw new Error('Invalid OTP or email');
  }

  // Check if OTP is expired
  if (user.expiry < new Date()) {
    await User.deleteOne({ email }); // Clean up expired registration
    throw new Error('OTP has expired. Please request a new one.');
  }

  // Hash password
  const hashed = await bcrypt.hash(password, 10);

  // Update user with password and remove OTP fields
  const RESERVED = new Set(['_id', 'password', 'createdAt', 'updatedAt']);
  const safeExtra = {};
  for (const [k, v] of Object.entries(restFields)) {
    if (!RESERVED.has(k)) safeExtra[k] = v;
  }

  await User.updateOne(
    { email },
    {
      password: hashed,
      ...safeExtra,
      $unset: { otp: 1, expiry: 1 },
    }
  );

  return {
    msg: 'Registration completed successfully',
    userId: String(user._id),
  };
}

export async function generateOtpLogin(params = {}) {
  const {
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    MONGODB_URI,
    tableName,
    email,
    email_title,
    email_descr,
  } = params;

  reqParam('SMTP_PORT', SMTP_PORT);
  reqParam('SMTP_USER', SMTP_USER);
  reqParam('SMTP_PASS', SMTP_PASS);
  reqParam('MONGODB_URI', MONGODB_URI);
  reqParam('tableName', tableName);
  reqParam('email', email);
  reqParam('email_title', email_title);
  reqParam('email_descr', email_descr);

  await connectDB(MONGODB_URI);
  const User = getUserModel(tableName);

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  // Generate OTP and expiry (5 minutes from now)
  const otp = generateOtp();
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Update user with new OTP
  await User.updateOne({ email }, { otp, expiry });

  // Send OTP email
  await sendOtpEmail(
    { SMTP_PORT, SMTP_USER, SMTP_PASS },
    email,
    otp,
    email_title,
    email_descr
  );

  return {
    msg: 'OTP sent successfully for login',
    email,
  };
}

export async function verifyOtpLogin(params = {}, res) {
  const { JWT_SECRET_KEY, MONGODB_URI, tableName, email, otp } = params;

  reqParam('JWT_SECRET_KEY', JWT_SECRET_KEY);
  reqParam('MONGODB_URI', MONGODB_URI);
  reqParam('tableName', tableName);
  reqParam('email', email);
  reqParam('otp', otp);
  if (!res) throw new Error('res (Express response) is required for login');

  await connectDB(MONGODB_URI);
  const User = getUserModel(tableName);

  // Find user with matching email and OTP
  const user = await User.findOne({ email, otp });
  if (!user) {
    throw new Error('Invalid OTP or email');
  }

  // Check if OTP is expired
  if (user.expiry < new Date()) {
    await User.updateOne({ email }, { $unset: { otp: 1, expiry: 1 } });
    throw new Error('OTP has expired. Please request a new one.');
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: String(user._id), email: user.email, name: user.name },
    JWT_SECRET_KEY,
    { expiresIn: '1d' }
  );

  // Set cookie
  res.cookie('token', token, cookieOptionsByEnv(params.NODE_ENV));

  // Clear OTP fields
  await User.updateOne({ email }, { $unset: { otp: 1, expiry: 1 } });

  return {
    msg: 'Login successful',
    userId: String(user._id),
    token,
  };
}
