import Project from '../models/Project.model.js';
import CodeFile from '../models/CodeFile.model.js';
import Notification from '../models/Notification.model.js';
import Team from '../models/Team.model.js';
import User from '../models/User.model.js';
import Comment from '../models/Comment.model.js';
import axios from 'axios';
import { getProjectAccess } from '../utils/projectUtils.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * Local helper to post a system message to the project discussion
 */
const postSystemMessage = async (req, projectId, text) => {
  try {
    const io = req.app.get('io');
    const systemMessage = await Comment.create({
      project: projectId,
      user: req.user._id,
      text,
      isTodo: false
    });
    const populated = await Comment.findById(systemMessage._id).populate('user', 'name');
    if (io) io.to(`project:${projectId}`).emit('newComment', populated);
  } catch (e) {
    console.error('Failed to post system message:', e);
  }
};


// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res) => {
  try {
    const { name, description, language, repoUrl } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    let repoProvider = 'other';
    if (repoUrl?.includes('github.com')) repoProvider = 'github';
    else if (repoUrl?.includes('gitlab.com')) repoProvider = 'gitlab';

    const project = await Project.create({
      name,
      description,
      language,
      repoUrl: repoUrl || '',
      repoProvider,
      owner: req.user._id,
    });

    await Notification.create({
      user: req.user._id,
      type: 'project_created',
      message: `Project "${name}" was created successfully.`,
      link: `/projects/${project._id}`,
    });

    // Log Project Creation
    await logActivity('PROJECT_CREATED', req.user._id, `Initialized project node: ${name}`, {
      metadata: { projectId: project._id, language, repoProvider },
      ipAddress: req.ip || req.connection.remoteAddress
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
    const userId = req.user._id;

    // Get personal projects OR projects linked to my teams
    const myTeams = await Team.find({ 'members.user': userId }).select('_id');
    const teamIds = myTeams.map(t => t._id);

    // Find teams that have any projects linked
    const linkedTeams = await Team.find({ _id: { $in: teamIds } }).select('projects');
    const linkedProjectIds = linkedTeams.reduce((acc, t) => [...acc, ...t.projects], []);

    const projects = await Project.find({
      $or: [
        { owner: userId },
        { _id: { $in: linkedProjectIds } }
      ]
    }).populate('owner', 'name').sort({ createdAt: -1 });

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
    const access = await getProjectAccess(req.params.id, req.user._id);

    if (!access.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!access.canEdit && !access.canDelete) {
      // Potentially they might have "read only" access if they are just a member
      // but if access.exists is true and they are not an owner/team-member, then 403
      // Here, getProjectAccess returns exists:true only if they have some access context
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    const files = await CodeFile.find({ project: access.project._id })
      .select('-content -versions')
      .populate('updatedBy createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ 
      ...access.project.toObject(), 
      files, 
      canDelete: access.canDelete,
      team: access.team ? { _id: access.team._id, name: access.team.name } : null
    });
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

    const access = await getProjectAccess(req.params.id, req.user._id);
    if (!access.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!access.canEdit) {
      return res.status(403).json({ message: 'Not authorized to upload files to this project' });
    }

    const project = access.project;

    const codeFile = await CodeFile.create({
      project: project._id,
      filename,
      content,
      language: language || project.language,
      currentVersion: 1,
      versions: [{ versionNumber: 1, content }],
    });

    res.status(201).json(codeFile);

    await postSystemMessage(req, project._id, `🚀 uploaded new file: ${filename}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Bulk upload files to project
// @route   POST /api/projects/:id/bulk-files
// @access  Private
export const bulkUploadFiles = async (req, res) => {
  try {
    const { files } = req.body; // Array of { filename, content, language }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: 'Files array is required' });
    }

    const access = await getProjectAccess(req.params.id, req.user._id);
    if (!access.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!access.canEdit) {
      return res.status(403).json({ message: 'Not authorized to upload files' });
    }

    const project = access.project;
    const uploadedFiles = [];

    for (const fileData of files) {
      const { filename, content, language } = fileData;
      
      // Check if file exists
      let codeFile = await CodeFile.findOne({ project: project._id, filename });

      if (codeFile) {
        // OVERWRITE / NEW VERSION (As per "Big Platforms" request)
        codeFile.currentVersion += 1;
        codeFile.content = content; // Update main content to newest
        codeFile.versions.push({
          versionNumber: codeFile.currentVersion,
          content
        });
        await codeFile.save();
      } else {
        // NEW FILE
        codeFile = await CodeFile.create({
          project: project._id,
          filename,
          content,
          language: language || project.language,
          currentVersion: 1,
          versions: [{ versionNumber: 1, content }],
        });
      }
      uploadedFiles.push(codeFile);
    }

    res.status(201).json({ message: `Successfully uploaded ${uploadedFiles.length} files`, files: uploadedFiles });

    await postSystemMessage(req, project._id, `🚀 bulk uploaded ${uploadedFiles.length} files`);

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
    const access = await getProjectAccess(req.params.id, req.user._id);
    if (!access.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!access.canDelete) {
      return res.status(403).json({ message: 'Not authorized to delete this project. Requires Owner or Team Admin permission.' });
    }

    const project = access.project;

    await CodeFile.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    // Log Project Deletion
    await logActivity('PROJECT_DELETED', req.user._id, `Permanently purged project node: ${project.name}`, {
      metadata: { projectId: project._id },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Sync project from GitHub/GitLab
// @route   POST /api/projects/:id/repo-sync
// @access  Private
export const syncProjectFromRepo = async (req, res) => {
  try {
    const { repoUrl } = req.body;
    const access = await getProjectAccess(req.params.id, req.user._id);

    if (!access.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!access.canEdit) {
      return res.status(403).json({ message: 'Not authorized to sync this project' });
    }

    const project = access.project;
    const user = await User.findById(req.user._id);
    const githubToken = user?.githubAccessToken;

    let provider = 'other';
    let apiUrl = '';

    if (repoUrl.includes('github.com')) {
      provider = 'github';
      const parts = repoUrl.split('github.com/')[1].split('/');
      const owner = parts[0];
      const repo = parts[1].replace('.git', '');
      apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
      
      console.log(`Starting sync for ${owner}/${repo}...`);
      
      try {
        const headers = githubToken ? { Authorization: `token ${githubToken}` } : {};

        // 1. Get default branch
        const repoRes = await axios.get(apiUrl, { headers });
        const defaultBranch = repoRes.data.default_branch;
        console.log(`Found default branch: ${defaultBranch}`);

        // 2. Get recursive tree
        const treeRes = await axios.get(`${apiUrl}/git/trees/${defaultBranch}?recursive=1`, { headers });
        console.log(`Fetched tree with ${treeRes.data.tree.length} items`);

        const files = treeRes.data.tree.filter(item => 
          item.type === 'blob' && 
          /\.(js|jsx|ts|tsx|py|java|cpp|c|h|cs|go|rb|php|rs|md|html|css|json)$/i.test(item.path) &&
          !item.path.includes('node_modules') &&
          !item.path.includes('vendor') &&
          !item.path.includes('.git')
        );

        console.log(`Filtered to ${files.length} code files. syncing top 30...`);

        // 3. Fetch each file content and save
        const syncLimit = 30;
        const filesToSync = files.slice(0, syncLimit);

        for (const file of filesToSync) {
          try {
            const blobRes = await axios.get(file.url, { headers });
            const content = Buffer.from(blobRes.data.content, 'base64').toString('utf8');

            const existingFile = await CodeFile.findOne({ project: project._id, filename: file.path });
            if (existingFile) {
              if (existingFile.content !== content) {
                existingFile.content = content;
                existingFile.currentVersion += 1;
                existingFile.versions.push({ 
                  versionNumber: existingFile.currentVersion, 
                  content,
                  updatedBy: req.user._id
                });
                existingFile.updatedBy = req.user._id;
                await existingFile.save();
              }
            } else {
              await CodeFile.create({
                project: project._id,
                filename: file.path,
                content,
                language: file.path.split('.').pop() || project.language,
                currentVersion: 1,
                versions: [{ versionNumber: 1, content, updatedBy: req.user._id }],
                updatedBy: req.user._id,
                createdBy: req.user._id
              });
            }
          } catch (fileErr) {
            console.error(`Failed to sync file ${file.path}:`, fileErr.message);
          }
        }
        
        project.description = repoRes.data.description || project.description;
        console.log('Project sync completed successfully.');
      } catch (syncErr) {
        console.error('GitHub API Sync failed:', syncErr.response?.data || syncErr.message);
        // Fallback to meta sync via fetch if axios fails
        const response = await fetch(apiUrl);
        if (response.ok) {
          const repoData = await response.json();
          project.description = repoData.description || project.description;
        }
      }
      
      project.repoUrl = repoUrl;
      project.repoProvider = provider;
      await project.save();

      await postSystemMessage(req, project._id, `🔄 synchronized project with ${provider} repository`);
    } else if (repoUrl.includes('gitlab.com')) {
      provider = 'gitlab';
      const path = repoUrl.split('gitlab.com/')[1].replace(/\//g, '%2F');
      apiUrl = `https://gitlab.com/api/v4/projects/${path}`;
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const repoData = await response.json();
        project.repoUrl = repoUrl;
        project.repoProvider = provider;
        if (!project.description && repoData.description) {
          project.description = repoData.description;
        }
        await project.save();
      }
    }

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during sync' });
  }
};

// @desc    Delete a file from project
// @route   DELETE /api/projects/:id/files/:fileId
// @access  Private
export const deleteFile = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    const access = await getProjectAccess(id, req.user._id);

    if (!access.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (access.project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can delete files' });
    }

    const file = await CodeFile.findOne({ _id: fileId, project: id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    await CodeFile.findByIdAndDelete(fileId);
    res.json({ message: 'File deleted successfully' });

    await postSystemMessage(req, id, `🗑️ deleted file: ${file.filename}`);
  } catch (error) {
    console.error(error);
  }
};

// @desc    Get project comments/notes
// @route   GET /api/projects/:id/comments
// @access  Private
export const getProjectComments = async (req, res) => {
  try {
    const comments = await Comment.find({ project: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
};

// @desc    Add comment/note to project
// @route   POST /api/projects/:id/comments
// @access  Private
export const addProjectComment = async (req, res) => {
  try {
    const { text, isTodo } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text is required' });

    const access = await getProjectAccess(req.params.id, req.user._id);
    if (!access.exists) return res.status(404).json({ message: 'Project not found' });
    if (!access.canEdit) return res.status(403).json({ message: 'Not authorized' });

    const comment = await Comment.create({
      project: req.params.id,
      user: req.user._id,
      text,
      isTodo: !!isTodo
    });

    const populatedComment = await Comment.findById(comment._id).populate('user', 'name');

    // Emit socket event for real-time collaboration
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.params.id}`).emit('newComment', populatedComment);
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error adding comment' });
  }
};
