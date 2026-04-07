import express from 'express';
import {
  createTeam, getMyTeams, getTeamById, inviteMember,
  removeMember, updateMemberRole, addProjectToTeam, deleteTeam,
} from '../controllers/team.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createTeam);
router.get('/', protect, getMyTeams);
router.get('/:id', protect, getTeamById);
router.post('/:id/invite', protect, inviteMember);
router.delete('/:id/members/:userId', protect, removeMember);
router.put('/:id/members/:userId/role', protect, updateMemberRole);
router.post('/:id/projects', protect, addProjectToTeam);
router.delete('/:id', protect, deleteTeam);

export default router;
