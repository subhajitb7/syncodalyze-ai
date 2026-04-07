import Review from '../models/Review.model.js';
import Project from '../models/Project.model.js';
import CodeFile from '../models/CodeFile.model.js';

// @desc    Global search
// @route   GET /api/search?q=term
export const globalSearch = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.trim().length < 2) {
      return res.json({ reviews: [], projects: [], files: [] });
    }

    const regex = new RegExp(query, 'i');
    const userId = req.user._id;

    const [reviews, projects, files] = await Promise.all([
      Review.find({
        user: userId,
        $or: [{ title: regex }, { language: regex }],
      })
        .select('title language bugsFound createdAt')
        .sort({ createdAt: -1 })
        .limit(10),

      Project.find({
        owner: userId,
        $or: [{ name: regex }, { description: regex }],
      })
        .select('name language createdAt')
        .sort({ createdAt: -1 })
        .limit(10),

      CodeFile.find({ filename: regex })
        .select('filename language project currentVersion')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({ reviews, projects, files });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
