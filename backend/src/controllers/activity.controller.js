import AuditLog from '../models/AuditLog.model.js';
import Team from '../models/Team.model.js';

/**
 * @desc    Get current user's personal activity
 * @route   GET /api/activity/personal
 * @access  Private
 */
export const getPersonalActivity = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find({ actor: req.user._id })
      .populate('team', 'name')
      .populate('targetUser', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments({ actor: req.user._id });

    res.json({
      logs,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching personal operational logs' });
  }
};

/**
 * @desc    Get activity for a specific team
 * @route   GET /api/activity/team/:id
 * @access  Private (Team Members)
 */
export const getTeamActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id);

    if (!team) return res.status(404).json({ message: 'Team node not found' });

    // Check membership
    const isMember = team.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Clearance denied: Not a member of this node' });

    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find({ team: id })
      .populate('actor', 'name email')
      .populate('targetUser', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments({ team: id });

    res.json({
      logs,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching team operational logs' });
  }
};
