import Team from '../models/Team.model.js';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';

// @desc    Create a new team
// @route   POST /api/teams
export const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    const team = await Team.create({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });
    res.status(201).json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get teams I belong to
// @route   GET /api/teams
export const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({ 'members.user': req.user._id })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single team
// @route   GET /api/teams/:id
export const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate('projects');

    if (!team) return res.status(404).json({ message: 'Team not found' });

    const isMember = team.members.some((m) => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Not a member of this team' });

    res.json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Invite a user to team by email
// @route   POST /api/teams/:id/invite
export const inviteMember = async (req, res) => {
  try {
    const { email } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Check permission
    const requester = team.members.find((m) => m.user.toString() === req.user._id.toString());
    if (!requester || !['owner', 'admin'].includes(requester.role)) {
      return res.status(403).json({ message: 'Only owners and admins can invite members' });
    }

    const userToInvite = await User.findOne({ email });
    if (!userToInvite) return res.status(404).json({ message: 'User not found with that email' });

    const alreadyMember = team.members.some((m) => m.user.toString() === userToInvite._id.toString());
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member' });

    team.members.push({ user: userToInvite._id, role: 'member' });
    await team.save();

    // Notify the invited user
    await Notification.create({
      user: userToInvite._id,
      type: 'team_invite',
      message: `You were added to team "${team.name}"`,
    });

    const populated = await Team.findById(team._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove a member
// @route   DELETE /api/teams/:id/members/:userId
export const removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const requester = team.members.find((m) => m.user.toString() === req.user._id.toString());
    if (!requester || !['owner', 'admin'].includes(requester.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.params.userId === team.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove the team owner' });
    }

    team.members = team.members.filter((m) => m.user.toString() !== req.params.userId);
    await team.save();

    const populated = await Team.findById(team._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update member role
// @route   PUT /api/teams/:id/members/:userId/role
export const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the team owner can change roles' });
    }

    const member = team.members.find((m) => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    member.role = role;
    await team.save();

    const populated = await Team.findById(team._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Link a project to team
// @route   POST /api/teams/:id/projects
export const addProjectToTeam = async (req, res) => {
  try {
    const { projectId } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (team.projects.includes(projectId)) {
      return res.status(400).json({ message: 'Project already linked' });
    }

    team.projects.push(projectId);
    await team.save();

    const populated = await Team.findById(team._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate('projects');

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
export const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete this team' });
    }

    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
