import express from 'express';
import { sendMessage, getTeamMessages, deleteMessage } from '../controllers/message.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/:teamId', protect, sendMessage);
router.get('/:teamId', protect, getTeamMessages);
router.delete('/:id', protect, deleteMessage);

export default router;
