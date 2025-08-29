import express from 'express';
import cookieParser from 'cookie-parser';
import {
  register,
  login,
  logout,
  verifyToken,
  isLoggedIn,
  generateRegisterOtp,
  verifyOtpRegister,
  generateOtpLogin,
  verifyOtpLogin,
} from 'triostack-jwt-sdk';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Environment variables (set these in your .env file)
const config = {
  JWT_SECRET_KEY:
    process.env.JWT_SECRET_KEY || 'your-super-secret-jwt-key-change-this',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-demo',
  NODE_ENV: process.env.NODE_ENV || 'development',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER || 'your-email@gmail.com',
  SMTP_PASS: process.env.SMTP_PASS || 'your-app-password',
  tableName: 'users',
};

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'TrioStack JWT SDK Demo Server',
    status: 'running',
    features: [
      'Traditional Auth',
      'OTP Authentication',
      'JWT Tokens',
      'MongoDB Integration',
    ],
  });
});

// ===== TRADITIONAL AUTHENTICATION =====

// Register a new user (traditional)
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await register({
      ...config,
      email,
      password,
      name,
      role,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login user (traditional)
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await login(
      {
        ...config,
        email,
        password,
      },
      res
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== OTP AUTHENTICATION =====

// Generate OTP for registration
app.post('/auth/generate-register-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await generateRegisterOtp({
      ...config,
      email,
      email_title: 'Verify Your Email - Registration',
      email_descr:
        'Please enter the OTP below to complete your registration process.',
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify OTP and complete registration
app.post('/auth/verify-otp-register', async (req, res) => {
  try {
    const { email, otp, password, name, role } = req.body;

    if (!email || !otp || !password) {
      return res
        .status(400)
        .json({ error: 'Email, OTP, and password are required' });
    }

    const result = await verifyOtpRegister({
      ...config,
      email,
      otp,
      password,
      name,
      role,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate OTP for login
app.post('/auth/generate-otp-login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await generateOtpLogin({
      ...config,
      email,
      email_title: 'Login Verification',
      email_descr: 'Please enter the OTP below to complete your login process.',
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify OTP and complete login
app.post('/auth/verify-otp-login', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const result = await verifyOtpLogin(
      {
        ...config,
        email,
        otp,
      },
      res
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== UTILITY ROUTES =====

// Logout user
app.post('/auth/logout', (req, res) => {
  const result = logout({ res });
  res.json(result);
});

// Check authentication status
app.get('/auth/status', (req, res) => {
  const user = isLoggedIn({ req, JWT_SECRET_KEY: config.JWT_SECRET_KEY });
  if (user) {
    res.json({ loggedIn: true, user });
  } else {
    res.json({ loggedIn: false });
  }
});

// Protected route example
app.get('/profile', verifyToken(config.JWT_SECRET_KEY), (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((error, req, res, _next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📚 API Documentation:');
  console.log('\n🔐 Traditional Authentication:');
  console.log('   POST /auth/register - Register a new user');
  console.log('   POST /auth/login - Login user');
  console.log('\n📧 OTP Authentication:');
  console.log(
    '   POST /auth/generate-register-otp - Generate OTP for registration'
  );
  console.log(
    '   POST /auth/verify-otp-register - Verify OTP and complete registration'
  );
  console.log('   POST /auth/generate-otp-login - Generate OTP for login');
  console.log('   POST /auth/verify-otp-login - Verify OTP and complete login');
  console.log('\n🛠️ Utility Routes:');
  console.log('   POST /auth/logout - Logout user');
  console.log('   GET  /auth/status - Check auth status');
  console.log('   GET  /profile - Protected route example');
});

export default app;
