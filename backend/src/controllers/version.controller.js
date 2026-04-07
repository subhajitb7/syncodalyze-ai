import CodeFile from '../models/CodeFile.model.js';
import Notification from '../models/Notification.model.js';
import Project from '../models/Project.model.js';
import { getProjectAccess } from '../utils/projectUtils.js';

// @desc    Update file content (new version)
// @route   PUT /api/files/:id
// @access  Private
export const updateFileContent = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const file = await CodeFile.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check project permissions
    const access = await getProjectAccess(file.project, req.user._id);
    if (!access.exists || !access.canEdit) {
      return res.status(403).json({ message: 'Not authorized to edit this file' });
    }

    const newVersion = file.currentVersion + 1;
    file.content = content;
    file.currentVersion = newVersion;
    file.versions.push({ versionNumber: newVersion, content });

    await file.save();

    // Create notification for project owner if updated by someone else
    if (access.project.owner.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: access.project.owner,
        type: 'file_updated',
        message: `Member ${req.user.name} updated "${file.filename}" to v${newVersion}.`,
        link: `/projects/${access.project._id}/files/${file._id}`,
      });
    }

    res.json(file);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get file by ID (with content)
// @route   GET /api/files/:id
// @access  Private
export const getFileById = async (req, res) => {
  try {
    const file = await CodeFile.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get file version history
// @route   GET /api/files/:id/history
// @access  Private
export const getFileHistory = async (req, res) => {
  try {
    const file = await CodeFile.findById(req.params.id).select('filename versions currentVersion');
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
