import { Router, Request, Response } from 'express';

const router = Router();

// Test endpoint - no auth required
router.get('/test', (req: Request, res: Response) => {
  res.json({ 
    message: 'Backend test endpoint working!',
    timestamp: new Date().toISOString(),
    server: 'LMS Backend'
  });
});

// Protected test endpoint
router.get('/test-auth', (req: Request, res: Response) => {
  res.json({ 
    message: 'Protected endpoint working!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

export default router;
