import Project from '../models/Project.model.js';
import CodeFile from '../models/CodeFile.model.js';
import Notification from '../models/Notification.model.js';

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res) => {
  try {
    const { name, description, language } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const project = await Project.create({
      name,
      description,
      language,
      owner: req.user._id,
    });

    await Notification.create({
      user: req.user._id,
      type: 'project_created',
      message: `Project "${name}" was created successfully.`,
      link: `/projects/${project._id}`,
    });

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user projects
// @route   GET /api/projects
// @access  Private
export const getUserProjects = async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user._id }).sort({ createdAt: -1 });

    // Add file count for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const fileCount = await CodeFile.countDocuments({ project: project._id });
        return { ...project.toObject(), fileCount };
      })
    );

    res.json(projectsWithCounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const files = await CodeFile.find({ project: project._id }).select('-content -versions').sort({ createdAt: -1 });
    res.json({ ...project.toObject(), files });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload a file to project
// @route   POST /api/projects/:id/files
// @access  Private
export const uploadFile = async (req, res) => {
  try {
    const { filename, content, language } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ message: 'Filename and content are required' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const codeFile = await CodeFile.create({
      project: project._id,
      filename,
      content,
      language: language || project.language,
      currentVersion: 1,
      versions: [{ versionNumber: 1, content }],
    });

    res.status(201).json(codeFile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get project files
// @route   GET /api/projects/:id/files
// @access  Private
export const getProjectFiles = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const files = await CodeFile.find({ project: project._id }).select('-versions').sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await CodeFile.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
