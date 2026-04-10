import mongoose from 'mongoose';

const aiLogSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
    },
    prompt: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      default: 'llama-3.3-70b-versatile',
    },
    language: {
      type: String,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    responseTimeMs: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['success', 'error'],
      default: 'success',
    },
    errorMessage: {
      type: String,
    },
    isTemporary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const AiLog = mongoose.model('AiLog', aiLogSchema);

export default AiLog;
