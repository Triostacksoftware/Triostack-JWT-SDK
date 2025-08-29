# TrioStack JWT SDK

A plug-and-play JWT authentication SDK for Node.js backends using cookies and MongoDB. Provides ready-to-use functions for user registration, login, logout, OTP verification, and token verification.

## Features

- 🔐 **JWT-based authentication** with secure cookie handling
- 🍪 **Cookie-based tokens** for better security
- 🗄️ **MongoDB integration** with Mongoose
- 🚀 **Express.js middleware** ready
- 🔒 **Password hashing** with bcrypt
- 📧 **OTP authentication** with beautiful email templates
- ⚡ **Lightweight** and easy to integrate
- 🛡️ **Environment-aware** cookie settings

## Installation

```bash
npm install triostack-jwt-sdk
```

## Quick Start

### 1. Setup Environment Variables

```bash
JWT_SECRET_KEY=your-super-secret-jwt-key
MONGODB_URI=mongodb://localhost:27017/your-database
NODE_ENV=development

# SMTP Configuration for OTP emails
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Basic Express.js Integration

```javascript
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
  verifyOtpLogin
} from 'triostack-jwt-sdk';

const app = express();
app.use(express.json());
app.use(cookieParser());

// Traditional Registration
app.post('/auth/register', async (req, res) => {
  try {
    const result = await register({
      JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
      MONGODB_URI: process.env.MONGODB_URI,
      NODE_ENV: process.env.NODE_ENV,
      tableName: 'users',
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
      role: req.body.role
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// OTP Registration Flow
app.post('/auth/generate-register-otp', async (req, res) => {
  try {
    const result = await generateRegisterOtp({
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      MONGODB_URI: process.env.MONGODB_URI,
      tableName: 'users',
      email: req.body.email,
      email_title: 'Verify Your Email',
      email_descr: 'Please enter the OTP below to complete your registration:'
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/verify-otp-register', async (req, res) => {
  try {
    const result = await verifyOtpRegister({
      MONGODB_URI: process.env.MONGODB_URI,
      tableName: 'users',
      email: req.body.email,
      otp: req.body.otp,
      password: req.body.password,
      name: req.body.name,
      role: req.body.role
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Traditional Login
app.post('/auth/login', async (req, res) => {
  try {
    const result = await login({
      JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
      MONGODB_URI: process.env.MONGODB_URI,
      NODE_ENV: process.env.NODE_ENV,
      tableName: 'users',
      email: req.body.email,
      password: req.body.password
    }, res);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// OTP Login Flow
app.post('/auth/generate-otp-login', async (req, res) => {
  try {
    const result = await generateOtpLogin({
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      MONGODB_URI: process.env.MONGODB_URI,
      tableName: 'users',
      email: req.body.email,
      email_title: 'Login Verification',
      email_descr: 'Please enter the OTP below to complete your login:'
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/verify-otp-login', async (req, res) => {
  try {
    const result = await verifyOtpLogin({
      JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
      MONGODB_URI: process.env.MONGODB_URI,
      tableName: 'users',
      email: req.body.email,
      otp: req.body.otp,
      NODE_ENV: process.env.NODE_ENV
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

// Protected route example
app.get('/profile', verifyToken(process.env.JWT_SECRET_KEY), (req, res) => {
  res.json({ user: req.user });
});

// Check if user is logged in
app.get('/auth/status', (req, res) => {
  const user = isLoggedIn({ req, JWT_SECRET_KEY: process.env.JWT_SECRET_KEY });
  if (user) {
    res.json({ loggedIn: true, user });
  } else {
    res.json({ loggedIn: false });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## API Reference

### Traditional Authentication

#### `register(params)`

Registers a new user in the database.

**Parameters:**
- `JWT_SECRET_KEY` (string, required): Secret key for JWT signing
- `MONGODB_URI` (string, required): MongoDB connection string
- `NODE_ENV` (string, required): Environment ('development', 'production', etc.)
- `tableName` (string, required): MongoDB collection name for users
- `email` (string, required): User's email address
- `password` (string, required): User's password (will be hashed)
- `...restFields` (any): Additional user fields (name, role, etc.)

**Returns:**
```javascript
{
  msg: "User registered successfully",
  userId: "user_id_string"
}
```

#### `login(params, res)`

Authenticates a user and sets JWT token in cookies.

**Parameters:**
- `params` (object): Same as register + Express response object
- `res` (Express.Response, required): Express response object for setting cookies

**Returns:**
```javascript
{
  msg: "Login successful",
  userId: "user_id_string",
  token: "jwt_token_string"
}
```

### OTP Authentication

#### `generateRegisterOtp(params)`

Generates and sends OTP for user registration.

**Parameters:**
- `SMTP_PORT` (number, required): SMTP server port (e.g., 587 for Gmail)
- `SMTP_USER` (string, required): SMTP username/email
- `SMTP_PASS` (string, required): SMTP password/app password
- `MONGODB_URI` (string, required): MongoDB connection string
- `tableName` (string, required): MongoDB collection name for users
- `email` (string, required): User's email address
- `email_title` (string, required): Email subject title
- `email_descr` (string, required): Email description/content

**Returns:**
```javascript
{
  msg: "OTP sent successfully for registration",
  email: "user@example.com"
}
```

#### `verifyOtpRegister(params)`

Verifies OTP and completes user registration.

**Parameters:**
- `MONGODB_URI` (string, required): MongoDB connection string
- `tableName` (string, required): MongoDB collection name for users
- `email` (string, required): User's email address
- `otp` (string, required): 6-digit OTP code
- `password` (string, required): User's password (will be hashed)
- `...restFields` (any): Additional user fields (name, role, etc.)

**Returns:**
```javascript
{
  msg: "Registration completed successfully",
  userId: "user_id_string"
}
```

#### `generateOtpLogin(params)`

Generates and sends OTP for user login.

**Parameters:**
- `SMTP_PORT` (number, required): SMTP server port
- `SMTP_USER` (string, required): SMTP username/email
- `SMTP_PASS` (string, required): SMTP password/app password
- `MONGODB_URI` (string, required): MongoDB connection string
- `tableName` (string, required): MongoDB collection name for users
- `email` (string, required): User's email address
- `email_title` (string, required): Email subject title
- `email_descr` (string, required): Email description/content

**Returns:**
```javascript
{
  msg: "OTP sent successfully for login",
  email: "user@example.com"
}
```

#### `verifyOtpLogin(params, res)`

Verifies OTP and completes user login.

**Parameters:**
- `JWT_SECRET_KEY` (string, required): Secret key for JWT signing
- `MONGODB_URI` (string, required): MongoDB connection string
- `tableName` (string, required): MongoDB collection name for users
- `email` (string, required): User's email address
- `otp` (string, required): 6-digit OTP code
- `NODE_ENV` (string, required): Environment setting
- `res` (Express.Response, required): Express response object

**Returns:**
```javascript
{
  msg: "Login successful",
  userId: "user_id_string",
  token: "jwt_token_string"
}
```

### Utility Functions

#### `logout({ res })`

Logs out a user by clearing the JWT cookie.

**Parameters:**
- `res` (Express.Response, required): Express response object

**Returns:**
```javascript
{
  msg: "Logged out"
}
```

#### `verifyToken(JWT_SECRET_KEY)`

Express middleware to verify JWT tokens from cookies.

**Parameters:**
- `JWT_SECRET_KEY` (string, required): Secret key for JWT verification

**Returns:** Express middleware function

#### `isLoggedIn({ req, JWT_SECRET_KEY })`

Checks if a user is currently logged in.

**Parameters:**
- `req` (Express.Request, required): Express request object
- `JWT_SECRET_KEY` (string, required): Secret key for JWT verification

**Returns:** Decoded JWT payload or `null` if not logged in

## Database Schema

The SDK automatically creates a MongoDB schema with the following structure:

```javascript
{
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  otp: { type: String }, // For OTP verification
  expiry: { type: Date }, // OTP expiration time
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
  // ... any additional fields you pass during registration
}
```

## OTP Features

- **6-digit numeric OTP**: Secure random generation
- **5-minute expiration**: Automatic cleanup of expired OTPs
- **Beautiful email templates**: Responsive HTML design with gradients
- **SMTP integration**: Works with Gmail, Outlook, and other SMTP providers
- **Automatic cleanup**: Expired OTPs are automatically removed

## Email Template

The OTP emails feature a beautiful, responsive design with:
- Gradient backgrounds and modern styling
- Mobile-responsive layout
- Security warnings and branding
- Professional appearance

## Cookie Configuration

Cookies are automatically configured based on your environment:

- **Development**: `secure: false`, `sameSite: "Lax"`
- **Production**: `secure: true`, `sameSite: "None"`

All cookies are `httpOnly: true` and expire in 24 hours.

## Error Handling

The SDK throws descriptive errors for common issues:

- Missing required parameters
- Invalid credentials
- User already exists
- Database connection issues
- Invalid JWT tokens
- Invalid or expired OTP
- Email sending failures

## Security Features

- **Password Hashing**: Uses bcrypt with salt rounds of 10
- **JWT Expiration**: Tokens expire after 24 hours
- **HttpOnly Cookies**: Prevents XSS attacks
- **Secure Cookies**: Automatically enabled in production
- **Input Validation**: Validates all required parameters
- **OTP Expiration**: 5-minute automatic expiration
- **Email Security**: Beautiful templates with security warnings

## Requirements

- Node.js >= 18.0.0
- MongoDB database
- Express.js (for middleware usage)
- SMTP email provider (for OTP functionality)

## Dependencies

- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT token handling
- `mongoose`: MongoDB ODM
- `nodemailer`: SMTP email functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/Triostacksoftware/Triostack-JWT-SDK/issues) on GitHub.
