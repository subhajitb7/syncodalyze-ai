import express from 'express';
import { addComment, getCommentsByReview, getCommentsByProject, deleteComment, updateComment } from '../controllers/comment.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/reviews/:reviewId/comments', protect, addComment);
router.get('/reviews/:reviewId/comments', protect, getCommentsByReview);
router.post('/projects/:projectId/comments', protect, addComment);
router.get('/projects/:projectId/comments', protect, getCommentsByProject);
router.delete('/comments/:id', protect, deleteComment);
router.put('/comments/:id', protect, updateComment);

export default router;
