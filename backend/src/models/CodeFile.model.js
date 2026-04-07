import mongoose from 'mongoose';

const versionSchema = mongoose.Schema({
  versionNumber: { type: Number, required: true },
  content: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
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
  },
  {
    timestamps: true,
  }
);

const CodeFile = mongoose.model('CodeFile', codeFileSchema);

export default CodeFile;
