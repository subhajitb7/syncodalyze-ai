import express from 'express';
import {
  createProject,
  getUserProjects,
  getProjectById,
  uploadFile,
  getProjectFiles,
  deleteProject,
  syncProjectFromRepo,
  deleteFile,
  bulkUploadFiles,
  getProjectComments,
  addProjectComment
} from '../controllers/project.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createProject);
router.get('/', protect, getUserProjects);
router.get('/:id', protect, getProjectById);
router.delete('/:id', protect, deleteProject);
router.post('/:id/repo-sync', protect, syncProjectFromRepo);
router.post('/:id/files', protect, uploadFile);
router.post('/:id/bulk-files', protect, bulkUploadFiles);
router.get('/:id/files', protect, getProjectFiles);
router.delete('/:id/files/:fileId', protect, deleteFile);
router.get('/:id/comments', protect, getProjectComments);
router.post('/:id/comments', protect, addProjectComment);

export default router;
