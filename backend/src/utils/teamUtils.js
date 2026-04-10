import Team from '../models/Team.model.js';

/**
 * Standardized population for Team objects
 * @param {string} teamId - The team ID to fetch and populate
 * @returns {Promise<Object>} - The populated team object
 */
export const getPopulatedTeam = async (teamId) => {
  return await Team.findById(teamId)
    .populate('owner', 'name email')
    .populate('members.user', 'name email')
    .populate({
      path: 'projects',
      populate: { path: 'owner', select: 'name' }
    });
};

