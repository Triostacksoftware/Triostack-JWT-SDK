import express from 'express';
import cookieParser from 'cookie-parser';
import { register, login, logout, verifyToken, isLoggedIn } from 'triostack-jwt-sdk';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Environment variables (set these in your .env file)
const config = {
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || 'your-super-secret-jwt-key-change-this',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-demo',
  NODE_ENV: process.env.NODE_ENV || 'development',
  tableName: 'users'
};

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'TrioStack JWT SDK Demo Server', status: 'running' });
});

// Register a new user
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
      role
    });
    
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login user
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await login({
      ...config,
      email,
      password
    }, res);
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

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
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
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
  console.log(`📚 API Documentation:`);
  console.log(`   POST /auth/register - Register a new user`);
  console.log(`   POST /auth/login - Login user`);
  console.log(`   POST /auth/logout - Logout user`);
  console.log(`   GET  /auth/status - Check auth status`);
  console.log(`   GET  /profile - Protected route example`);
});

export default app;
