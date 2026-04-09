import express from 'express';
import { 
  summarizeFile, 
  getDeveloperInsights, 
  generateReviewEmail 
} from '../controllers/ai.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/summarize-file', protect, summarizeFile);
router.get('/insights', protect, getDeveloperInsights);
router.post('/generate-email', protect, generateReviewEmail);

export default router;
