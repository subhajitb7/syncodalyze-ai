import Project from '../models/Project.model.js';
import Team from '../models/Team.model.js';

/**
 * Helper to check if a user has access to a project (as owner OR team member)
 */
export const getProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { exists: false };

  // 1. Is the user the direct owner?
  if (project.owner.toString() === userId.toString()) {
    return { exists: true, project, canEdit: true, canDelete: true };
  }

  // 2. Is the user a member of a team that has linked this project?
  const team = await Team.findOne({ 
    projects: projectId, 
    'members.user': userId 
  });

  if (team) {
    const member = team.members.find(m => m.user.toString() === userId.toString());
    const isAdmin = member && ['owner', 'admin'].includes(member.role);
    return { 
      exists: true, 
      project, 
      canEdit: true, // All team members can upload/edit files
      canDelete: isAdmin // Only team admins/owners can delete the project
    };
  }

  return { exists: true, project, canEdit: false, canDelete: false };
};
