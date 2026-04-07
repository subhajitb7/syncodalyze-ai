import express from 'express';
import {
  createProject,
  getUserProjects,
  getProjectById,
  uploadFile,
  getProjectFiles,
  deleteProject,
} from '../controllers/project.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createProject);
router.get('/', protect, getUserProjects);
router.get('/:id', protect, getProjectById);
router.delete('/:id', protect, deleteProject);
router.post('/:id/files', protect, uploadFile);
router.get('/:id/files', protect, getProjectFiles);

export default router;
