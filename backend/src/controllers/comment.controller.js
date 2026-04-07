import Comment from '../models/Comment.model.js';
import Review from '../models/Review.model.js';
import Notification from '../models/Notification.model.js';

// @desc    Add comment to review
// @route   POST /api/reviews/:reviewId/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { text, lineNumber } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const comment = await Comment.create({
      review: req.params.reviewId,
      user: req.user._id,
      text,
      lineNumber: lineNumber || null,
    });

    const populated = await Comment.findById(comment._id).populate('user', 'name email');

    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');

    // Emit live collaborative comment
    io.to('review:' + req.params.reviewId).emit('newComment', populated);

    // Notify review owner
    if (review.user.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        user: review.user,
        type: 'new_comment',
        message: `${req.user.name} commented on your review "${review.title}".`,
        link: `/review/${review._id}`,
      });

      // Emit live notification
      const receiverSocketId = onlineUsers.get(review.user.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('liveNotification', notification);
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

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
