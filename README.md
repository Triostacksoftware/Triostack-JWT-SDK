# TrioStack JWT SDK

A plug-and-play JWT authentication SDK for Node.js backends using cookies and MongoDB. Provides ready-to-use functions for user registration, login, logout, and token verification.

## Features

- 🔐 **JWT-based authentication** with secure cookie handling
- 🍪 **Cookie-based tokens** for better security
- 🗄️ **MongoDB integration** with Mongoose
- 🚀 **Express.js middleware** ready
- 🔒 **Password hashing** with bcrypt
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
```

### 2. Basic Express.js Integration

```javascript
import express from 'express';
import cookieParser from 'cookie-parser';
import { register, login, logout, verifyToken, isLoggedIn } from 'triostack-jwt-sdk';

const app = express();
app.use(express.json());
app.use(cookieParser());

// Register a new user
app.post('/auth/register', async (req, res) => {
  try {
    const result = await register({
      JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
      MONGODB_URI: process.env.MONGODB_URI,
      NODE_ENV: process.env.NODE_ENV,
      tableName: 'users',
      email: req.body.email,
      password: req.body.password,
      name: req.body.name, // Additional fields are supported
      role: req.body.role
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login user
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

### `register(params)`

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

### `login(params, res)`

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

### `logout({ res })`

Logs out a user by clearing the JWT cookie.

**Parameters:**
- `res` (Express.Response, required): Express response object

**Returns:**
```javascript
{
  msg: "Logged out"
}
```

### `verifyToken(JWT_SECRET_KEY)`

Express middleware to verify JWT tokens from cookies.

**Parameters:**
- `JWT_SECRET_KEY` (string, required): Secret key for JWT verification

**Returns:** Express middleware function

### `isLoggedIn({ req, JWT_SECRET_KEY })`

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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
  // ... any additional fields you pass during registration
}
```

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

## Security Features

- **Password Hashing**: Uses bcrypt with salt rounds of 10
- **JWT Expiration**: Tokens expire after 24 hours
- **HttpOnly Cookies**: Prevents XSS attacks
- **Secure Cookies**: Automatically enabled in production
- **Input Validation**: Validates all required parameters

## Requirements

- Node.js >= 18.0.0
- MongoDB database
- Express.js (for middleware usage)

## Dependencies

- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT token handling
- `mongoose`: MongoDB ODM

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
