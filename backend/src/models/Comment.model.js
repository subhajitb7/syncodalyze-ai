import mongoose from 'mongoose';

const commentSchema = mongoose.Schema(
  {
    review: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Review',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    text: {
      type: String,
      required: true,
    },
    lineNumber: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
