import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
      default: 'Untitled Code Snippet',
    },
    codeSnippet: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: 'javascript',
    },
    aiFeedback: {
      type: String,
    },
    bugsFound: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Review', 'Needs Changes', 'Approved'],
      default: 'Pending',
    },
    aiTags: [String],
  },
  {
    timestamps: true,
  }
);

const Review = mongoose.model('Review', reviewSchema);

export default Review;
