import Review from '../models/Review.model.js';
import Project from '../models/Project.model.js';
import CodeFile from '../models/CodeFile.model.js';

// @desc    Get analytics data
// @route   GET /api/analytics
// @access  Private
export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Total counts
    const totalReviews = await Review.countDocuments({ user: userId });
    const totalProjects = await Project.countDocuments({ owner: userId });
    const totalFiles = await CodeFile.countDocuments();
    const bugsTotal = await Review.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, totalBugs: { $sum: '$bugsFound' } } },
    ]);

    // Reviews by language
    const byLanguage = await Review.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$language', count: { $sum: 1 }, bugs: { $sum: '$bugsFound' } } },
      { $sort: { count: -1 } },
    ]);

    // Reviews over time (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reviewsOverTime = await Review.aggregate([
      { $match: { user: userId, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          bugs: { $sum: '$bugsFound' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Clean code percentage
    const cleanReviews = await Review.countDocuments({ user: userId, bugsFound: 0 });
    const cleanPercent = totalReviews > 0 ? Math.round((cleanReviews / totalReviews) * 100) : 100;

    // Recent reviews
    const recentReviews = await Review.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title language bugsFound createdAt');

    res.json({
      totalReviews,
      totalProjects,
      totalFiles,
      totalBugs: bugsTotal[0]?.totalBugs || 0,
      cleanPercent,
      byLanguage,
      reviewsOverTime,
      recentReviews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
