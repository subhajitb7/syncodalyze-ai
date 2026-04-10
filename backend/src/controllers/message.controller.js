import Message from '../models/Message.model.js';

// @desc    Send a message to team chat
// @route   POST /api/messages/:teamId
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { teamId } = req.params;

    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const message = await Message.create({
      user: req.user._id,
      team: teamId,
      text,
    });

    const populated = await Message.findById(message._id).populate('user', 'name email');

    const io = req.app.get('io');
    if (io) {
      io.to(`team:${teamId}`).emit('newTeamMessage', populated);
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all messages for a team
// @route   GET /api/messages/:teamId
// @access  Private
export const getTeamMessages = async (req, res) => {
  try {
    const messages = await Message.find({ team: req.params.teamId })
      .populate('user', 'name email')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a message (Optional/Self-Cleanup)
// @route   DELETE /api/messages/:id
// @access  Private
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (message.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
