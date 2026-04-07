import User from '../models/User.model.js';
import Review from '../models/Review.model.js';
import Project from '../models/Project.model.js';
import CodeFile from '../models/CodeFile.model.js';
import Comment from '../models/Comment.model.js';
import Notification from '../models/Notification.model.js';

// @desc    Get all users
// @route   GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a user and all their data
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
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

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot update your own role' });
    }
    user.role = role;
    await user.save();

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
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
