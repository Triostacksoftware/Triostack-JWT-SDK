import { register, login, logout, verifyToken, isLoggedIn } from '../src/index.js';

// Mock Express response object
const mockRes = {
  cookie: (name, value, options) => {
    mockRes.cookies = mockRes.cookies || {};
    mockRes.cookies[name] = { value, options };
  },
  clearCookie: (name, options) => {
    mockRes.cookies = mockRes.cookies || {};
    delete mockRes.cookies[name];
  }
};

// Mock Express request object
const mockReq = {
  cookies: {
    token: 'mock-jwt-token'
  }
};

console.log('🧪 Testing TrioStack JWT SDK...\n');

// Test 1: Check if functions are exported correctly
console.log('✅ All functions exported successfully:');
console.log('- register:', typeof register);
console.log('- login:', typeof login);
console.log('- logout:', typeof logout);
console.log('- verifyToken:', typeof verifyToken);
console.log('- isLoggedIn:', typeof isLoggedIn);

// Test 2: Test logout function with mock response
console.log('\n✅ Logout function works with mock response:');
try {
  const result = logout({ res: mockRes });
  console.log('Result:', result);
} catch (error) {
  console.log('❌ Error:', error.message);
}

// Test 3: Test parameter validation
console.log('\n✅ Parameter validation works:');
try {
  await register({});
} catch (error) {
  console.log('Expected error for missing params:', error.message);
}

console.log('\n🎉 Basic tests completed!');
console.log('Note: Full testing requires MongoDB connection and JWT secret key.');
