import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Basic middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString() 
  });
});

// Simple login endpoint (without database for now)
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  const { login, password } = req.body;

  // SuperAdmin hardcoded credentials
  if (login === process.env.SUPERADMIN_UID && password === process.env.SUPERADMIN_PASSWORD) {
    return res.json({
      user: {
        id: 'superadmin',
        email: 'superadmin@university.edu',
        name: 'Super Administrator',
        roles: ['SUPERADMIN'],
        defaultDashboard: 'SUPERADMIN'
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token'
    });
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 SuperAdmin UID: ${process.env.SUPERADMIN_UID}`);
});
