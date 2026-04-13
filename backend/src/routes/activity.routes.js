import express from 'express';
import { getPersonalActivity, getTeamActivity } from '../controllers/activity.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/activity/personal
router.get('/personal', protect, getPersonalActivity);

// @route   GET /api/activity/team/:id
router.get('/team/:id', protect, getTeamActivity);

export default router;
