import { Router } from 'express';

const router = Router();

// File upload endpoint
router.post('/file', async (req, res) => {
  res.json({ message: 'File upload endpoint - implementation needed' });
});

export default router;
