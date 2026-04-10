import Comment from '../models/Comment.model.js';
import Review from '../models/Review.model.js';
import Notification from '../models/Notification.model.js';
import Team from '../models/Team.model.js';

// @desc    Add comment to review, project, or team
// @route   POST /api/reviews/:reviewId/comments
// @route   POST /api/projects/:projectId/comments
// @route   POST /api/teams/:teamId/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { text, lineNumber, isTodo } = req.body;
    const { reviewId, projectId, teamId } = req.params;

    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const commentData = {
      user: req.user._id,
      text,
      lineNumber: lineNumber || null,
      isTodo: !!isTodo
    };

    if (reviewId) commentData.review = reviewId;
    else if (projectId) commentData.project = projectId;

    const comment = await Comment.create(commentData);
    const populated = await Comment.findById(comment._id).populate('user', 'name email');

    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');

    // Emit live collaborative comment
    let room = '';
    if (reviewId) room = `review:${reviewId}`;
    else if (projectId) room = `project:${projectId}`;
    
    if (io) io.to(room).emit('newComment', populated);

    // Notify context owner (if Review)
    if (reviewId) {
      const review = await Review.findById(reviewId);
      if (review && review.user.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
          user: review.user,
          type: 'new_comment',
          message: `${req.user.name} commented on your review "${review.title}".`,
          link: `/review/${review._id}`,
        });

        if (onlineUsers) {
          const receiverSocketId = onlineUsers.get(review.user.toString());
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('liveNotification', notification);
          }
        }
      }
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get comments for a review
// @route   GET /api/reviews/:reviewId/comments
// @access  Private
export const getCommentsByReview = async (req, res) => {
  try {
    const comments = await Comment.find({ review: req.params.reviewId })
      .populate('user', 'name email')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isAuthor = comment.user.toString() === req.user._id.toString();
    let isTeamAdmin = false;

    // Check if user is a Team Admin/Owner (if it's a team comment)
    if (!isAuthor && comment.team) {
      const team = await Team.findById(comment.team);
      if (team) {
        const member = team.members.find(m => m.user.toString() === req.user._id.toString());
        if (member && (member.role === 'admin' || member.role === 'owner')) {
          isTeamAdmin = true;
        }
      }
    }

    if (!isAuthor && !isTeamAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update comment (text or completion)
// @route   PUT /api/comments/:id
// @access  Private
export const updateComment = async (req, res) => {
  try {
    const { text, isCompleted } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (text !== undefined) comment.text = text;
    if (isCompleted !== undefined) comment.isCompleted = isCompleted;

    await comment.save();
    const populated = await Comment.findById(comment._id).populate('user', 'name email');

    const io = req.app.get('io');
    if (io) {
      const room = comment.review ? `review:${comment.review}` : `project:${comment.project}`;
      io.to(room).emit('commentUpdated', populated);
    }

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
// ... Review and Project comment controllers remain ...
// @desc    Get comments for a project
// @route   GET /api/projects/:projectId/comments
// @access  Private
export const getCommentsByProject = async (req, res) => {
  try {
    const comments = await Comment.find({ project: req.params.projectId })
      .populate('user', 'name email')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
