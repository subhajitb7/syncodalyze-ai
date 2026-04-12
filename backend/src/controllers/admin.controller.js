import User from '../models/User.model.js';
import Review from '../models/Review.model.js';
import Project from '../models/Project.model.js';
import CodeFile from '../models/CodeFile.model.js';
import Comment from '../models/Comment.model.js';
import Notification from '../models/Notification.model.js';
import AiLog from '../models/AiLog.model.js';
import SystemSettings from '../models/SystemSettings.model.js';
import AuditLog from '../models/AuditLog.model.js';

// @desc    Get all users
// @route   GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    const usersWithMaster = users.map(user => ({
      ...user._doc,
      isMaster: user.email === process.env.MASTER_ADMIN_EMAIL
    }));
    res.json(usersWithMaster);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a user and all their data
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    // Master-Only Deletion Guard
    if (req.user.email !== process.env.MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Forbidden: Only the Sovereign Master Admin can delete users from the platform.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }
    if (user.email === process.env.MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Forbidden: Cannot delete the Sovereign Master Admin account' });
    }

    // Cascade delete
    const projects = await Project.find({ owner: user._id });
    for (const p of projects) {
      await CodeFile.deleteMany({ project: p._id });
    }
    await Project.deleteMany({ owner: user._id });
    await Review.deleteMany({ user: user._id });
    await Comment.deleteMany({ user: user._id });
    await Notification.deleteMany({ user: user._id });
    await User.findByIdAndDelete(req.params.id);

    // Create Audit Log
    await AuditLog.create({
      action: 'DELETE_USER',
      actor: req.user._id,
      details: `Permanently deleted user: ${user.name} (${user.email})`,
      metadata: { targetEmail: user.email },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({ message: 'User and all associated data deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Master-Only Promotion Guard
    if (role === 'admin' && req.user.email !== process.env.MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Forbidden: Only the Sovereign Master Admin can grant administrative privileges.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot update your own role' });
    }
    if (user.email === process.env.MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Forbidden: Cannot demote the Sovereign Master Admin account' });
    }
    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Create Audit Log
    await AuditLog.create({
      action: 'UPDATE_ROLE',
      actor: req.user._id,
      targetUser: user._id,
      details: `Updated role for ${user.name} from ${oldRole} to ${role}`,
      metadata: { oldRole, newRole: role },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all reviews (platform-wide)
// @route   GET /api/admin/reviews
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete any review
// @route   DELETE /api/admin/reviews/:id
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    await Comment.deleteMany({ review: review._id });
    await Review.findByIdAndDelete(req.params.id);
    
    // Create Audit Log
    await AuditLog.create({
      action: 'PURGE_ANALYSIS',
      actor: req.user._id,
      details: `Purged analysis node: ${review.title} (Owner: ${review.user?.name || 'Unknown'})`,
      metadata: { reviewId: review._id, reviewTitle: review.title },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({ message: 'Review and comments deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get platform-wide admin stats
// @route   GET /api/admin/stats
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalProjects = await Project.countDocuments();
    const totalFiles = await CodeFile.countDocuments();
    const totalComments = await Comment.countDocuments();

    // AI Metrics Aggregation
    const aiStats = await AiLog.aggregate([
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$tokensUsed' },
          avgResponseTime: { $avg: '$responseTimeMs' },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          errorCount: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
          },
          totalRequests: { $sum: 1 }
        }
      }
    ]);

    const bugsAgg = await Review.aggregate([
      { $group: { _id: null, totalBugs: { $sum: '$bugsFound' } } },
    ]);

    const recentUsers = await User.find({}).select('-password').sort({ createdAt: -1 }).limit(5);

    res.json({
      totalUsers,
      totalReviews,
      totalProjects,
      totalFiles,
      totalComments,
      totalBugs: bugsAgg[0]?.totalBugs || 0,
      recentUsers,
      aiMetrics: aiStats[0] || { totalTokens: 0, avgResponseTime: 0, successCount: 0, errorCount: 0, totalRequests: 0 }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get global system settings
// @route   GET /api/admin/settings
export const getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne({});
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update global system settings
// @route   PUT /api/admin/settings
export const updateSystemSettings = async (req, res) => {
  try {
    // Master-Only System Orchestration Guard
    if (req.user.email !== process.env.MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Forbidden: Only the Sovereign Master Admin can modify global platform configurations.' });
    }

    let settings = await SystemSettings.findOne({});
    if (!settings) {
      settings = new SystemSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    settings.updatedBy = req.user._id;
    await settings.save();

    // Create Audit Log
    await AuditLog.create({
      action: 'UPDATE_SETTINGS',
      actor: req.user._id,
      details: `Updated platform settings`,
      metadata: { updates: req.body },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle user suspension status
// @route   PUT /api/admin/users/:id/suspend
export const toggleUserSuspension = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Sovereignty Guard: Master Admin cannot be suspended
    if (user.email === process.env.MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Forbidden: The Sovereign Master Admin account cannot be suspended.' });
    }

    // Hierarchy Guard: Standard admins cannot suspend other admins
    if (user.role === 'admin' && req.user.email !== process.env.MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Forbidden: Only the Sovereign Master Admin can suspend other administrators.' });
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    // Create Audit Log
    const logAction = user.isSuspended ? 'SUSPEND_USER' : 'UNSUSPEND_USER';
    await AuditLog.create({
      action: logAction,
      actor: req.user._id,
      targetUser: user._id,
      details: `${user.isSuspended ? 'Suspended' : 'Unsuspended'} user ${user.name}`,
      metadata: { isSuspended: user.isSuspended },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({ _id: user._id, name: user.name, email: user.email, isSuspended: user.isSuspended });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all audit logs
// @route   GET /api/admin/audit-logs
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate('actor', 'name email')
      .populate('targetUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching audit logs' });
  }
};
