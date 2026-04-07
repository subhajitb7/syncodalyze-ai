import express from 'express';
import { updateFileContent, getFileById, getFileHistory } from '../controllers/version.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:id', protect, getFileById);
router.put('/:id', protect, updateFileContent);
router.get('/:id/history', protect, getFileHistory);

export default router;
