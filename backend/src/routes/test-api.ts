import { Router } from 'express';

const router = Router();

// Simple test endpoints that don't require database
router.get('/test/ping', (req, res) => {
  res.json({ message: 'Backend is running!', timestamp: new Date().toISOString() });
});

router.get('/test/auth', (req, res) => {
  const token = req.headers.authorization;
  res.json({ 
    message: 'Auth test endpoint', 
    hasToken: !!token,
    token: token ? token.substring(0, 20) + '...' : null
  });
});

// Test user creation endpoint (simplified)
router.post('/test/create-user', async (req, res) => {
  try {
    const { name, email, uid, role, password } = req.body;
    
    // Basic validation
    if (!name || !email || !uid || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Simulate successful user creation
    const newUser = {
      id: 'test-' + Date.now(),
      name,
      email,
      uid,
      role,
      hasPassword: !!password,
      created: new Date().toISOString()
    };
    
    res.status(201).json({
      success: true,
      message: 'User created successfully (test mode)',
      user: newUser
    });
    
  } catch (error) {
    console.error('Test create user error:', error);
    res.status(500).json({ error: 'Failed to create user (test mode)' });
  }
});

export default router;
