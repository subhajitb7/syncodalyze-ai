import mongoose from 'mongoose';

const versionSchema = mongoose.Schema({
  versionNumber: { type: Number, required: true },
  content: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
  aiSummary: { type: String },
});

const codeFileSchema = mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Project',
    },
    filename: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: 'javascript',
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    versions: [versionSchema],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const CodeFile = mongoose.model('CodeFile', codeFileSchema);

export default CodeFile;
