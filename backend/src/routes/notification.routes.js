import express from 'express';
import { getNotifications, markAsRead, markAllRead } from '../controllers/notification.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markAsRead);

export default router;
