import AiLog from '../models/AiLog.model.js';

// @desc    Get all AI logs for the current user
// @route   GET /api/ai-logs
export const getMyAiLogs = async (req, res) => {
  try {
    const logs = await AiLog.find({ user: req.user._id })
      .populate('review', 'title language')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all AI logs (admin)
// @route   GET /api/ai-logs/all
export const getAllAiLogs = async (req, res) => {
  try {
    const logs = await AiLog.find({})
      .populate('user', 'name email')
      .populate('review', 'title language')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get AI usage stats
// @route   GET /api/ai-logs/stats
export const getAiStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const totalCalls = await AiLog.countDocuments({ user: userId });
    const successCalls = await AiLog.countDocuments({ user: userId, status: 'success' });
    const errorCalls = await AiLog.countDocuments({ user: userId, status: 'error' });

    const agg = await AiLog.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$tokensUsed' },
          avgResponseTime: { $avg: '$responseTimeMs' },
        },
      },
    ]);

    const byLanguage = await AiLog.aggregate([
      { $match: { user: userId, language: { $ne: null } } },
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalCalls,
      successCalls,
      errorCalls,
      totalTokens: agg[0]?.totalTokens || 0,
      avgResponseTime: Math.round(agg[0]?.avgResponseTime || 0),
      byLanguage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
