import express from 'express';
import { analyzeCode, getUserReviews, getReviewById, getReviewStats, updateReviewStatus } from '../controllers/review.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, getReviewStats);
router.post('/analyze', protect, analyzeCode);
router.patch('/:id/status', protect, updateReviewStatus);
router.get('/', protect, getUserReviews);
router.get('/:id', protect, getReviewById);

export default router;
