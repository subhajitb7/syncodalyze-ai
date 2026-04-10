import Review from '../models/Review.model.js';
import Notification from '../models/Notification.model.js';
import AiLog from '../models/AiLog.model.js';
import CodeFile from '../models/CodeFile.model.js';
import { callGroq } from '../utils/aiHelper.js';

// @desc    Analyze code snippet with AI
// @route   POST /api/reviews/analyze
// @access  Private
export const analyzeCode = async (req, res) => {
  const { title, codeSnippet, language } = req.body;

  if (!codeSnippet) {
    return res.status(400).json({ message: 'Code snippet is required' });
  }

  try {
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const userSocket = onlineUsers.get(req.user._id.toString());

    const sendProgress = (msg) => {
      if (userSocket) io.to(userSocket).emit('aiProgress', msg);
    };

    sendProgress('Analyzing code structure...');

    const prompt = `Please review the following ${language || 'code'} snippet:\n\n\`\`\`${language || ''}\n${codeSnippet}\n\`\`\``;
    const systemPrompt = `You are a Senior Technical Architect and Cyber-Security Auditor. Perform a rigorous, vendor-neutral code analysis. 
               
               STRUCTURE YOUR RESPONSE AS FOLLOWS:
               
               ## Overview
               (Standardize as a 2-sentence formal assessment of architecture and risk.)
               
               ## Analysis Scorecard
               | Metric | Score | Risk Level |
               | :--- | :--- | :--- |
               | Security & Vulnerabilities | X/10 | [High/Mid/Low] |
               | Performance & Efficiency | X/10 | [High/Mid/Low] |
               | Maintainability & Style | X/10 | [High/Mid/Low] |
               
               ## Security & Integrity
               (Detail unsafe operations, potential leaks, or vulnerabilities. Use technical documentation references.)
               
               ## Technical Findings
               | Line Range | Finding | Impact | Actionable Mitigation |
               | :--- | :--- | :--- | :--- |
               | [Lx-Ly] | Brief technical description | [High/Low] | Specific code refactor suggestion |
               
               ## Performance Benchmarks
               (Identify complexity issues, memory management, or execution bottlenecks.)
               
               ## Architectural Recommendations
               (High-level suggestions for improved design patterns or scalability.)
               
               ---
               
               ### OVERALL RATING: X/10
               
               STRICT ANALYTICAL RULES:
               - Use a formal, objective technical tone. No conversational filler.
               - Ensure tables are perfectly aligned Markdown.
               - Standardize line references as [Lx-Ly].
               - DO NOT include "Code Review" at the top.
               
               METADATA (Srictly hidden at the end):
               [ISSUES_COUNT]: X
               [TAGS]: tag1, tag2, tag3`;

    sendProgress('Detecting vulnerabilities...');

    const { content: aiFeedback, usage, responseTimeMs } = await callGroq(systemPrompt, prompt, 0.2, 2000);

    if (!aiFeedback) {
      return res.status(500).json({ message: 'Failed to communicate with AI service' });
    }

    sendProgress('Generating suggestions...');

    const tokensUsed = usage?.total_tokens || 0;
    const saveToHistory = req.body.saveToHistory !== false;

    // Extract Issues Count
    let bugsFound = 0;
    const bugsMatch = aiFeedback.match(/\[ISSUES_COUNT\]:\s*(\d+)/i);
    if (bugsMatch) {
      bugsFound = parseInt(bugsMatch[1]);
    }

    // Priority 3: Extract Tags
    let aiTags = [];
    const tagsMatch = aiFeedback.match(/\[TAGS\]:\s*(.*)/i);
    if (tagsMatch) {
      aiTags = tagsMatch[1].split(',').map(t => t.trim().replace(/^#/, ''));
    }

    // Remove structured tags from the final feedback shown to user for cleaner UI
    const finalFeedback = aiFeedback
      .replace(/\[ISSUES_COUNT\]:\s*\d+/gi, '')
      .replace(/\[TAGS\]:\s*(.*)/gi, '')
      .trim();

    let review = null;
    const { fileId } = req.body;

    if (saveToHistory) {
      review = await Review.create({
        user: req.user._id,
        title,
        codeSnippet,
        language,
        aiFeedback: finalFeedback,
        bugsFound,
        aiTags,
        fileId: req.body.fileId || null,
      });

      // Link to file version if fileId is provided
      if (fileId) {
        console.log(`Attempting to link review ${review._id} to file ${fileId}`);
        try {
          const file = await CodeFile.findById(fileId);
          if (file) {
            const currentV = file.versions.find(v => Number(v.versionNumber) === Number(file.currentVersion));
            if (currentV) {
              currentV.reviewId = review._id;
              file.markModified('versions');
              await file.save();
              console.log(`Successfully linked review ${review._id} to version ${file.currentVersion}`);
            } else {
              console.warn(`Version ${file.currentVersion} not found in file ${fileId}`);
            }
          }
        } catch (linkErr) {
          console.error('Failed to link review to file version:', linkErr);
        }
      }

      // Notification
      const notification = await Notification.create({
        user: req.user._id,
        type: 'review_complete',
        message: `AI review completed for "${title || 'Untitled'}". ${bugsFound > 0 ? bugsFound + ' issue(s) found.' : 'No issues found!'}`,
        link: `/review/${review._id}`,
      });

      if (userSocket) {
        io.to(userSocket).emit('liveNotification', notification);
      }
    } else {
      // Create a temporary object mocking the Review schema
      review = {
        _id: 'temporary_' + Date.now(),
        user: req.user._id,
        title: (title || 'Untitled Review') + ' (Unsaded Session)',
        codeSnippet,
        language,
        aiFeedback: finalFeedback,
        bugsFound,
        status: 'Unsaved',
        isTemporary: true,
        createdAt: new Date(),
      };
    }

    // Log the AI call (always for audit, but link only if saved)
    await AiLog.create({
      user: req.user._id,
      review: saveToHistory ? review?._id : null,
      prompt,
      response: aiFeedback,
      model: 'llama-3.3-70b-versatile',
      language,
      tokensUsed,
      responseTimeMs,
      status: 'success',
      isTemporary: !saveToHistory,
    });

    if (userSocket) {
      io.to(userSocket).emit('aiProgress', 'Done');
    }

    res.status(saveToHistory ? 201 : 200).json(review);
  } catch (error) {
    console.error('ANALYSIS_CRASH:', error);

    // Specific Handling for Rate Limits (Error 429)
    if (error.response?.status === 429) {
      return res.status(429).json({
        message: 'AI Capacity Reached. Please wait 60 seconds and try again.',
        debug: 'Groq API Rate Limit'
      });
    }

    res.status(500).json({
      message: 'Server error during analysis',
      debug: error.message,
      stack: error.stack
    });
  }
};

// @desc    Get user reviews
// @route   GET /api/reviews
// @access  Private
export const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single review by ID
// @route   GET /api/reviews/:id
// @access  Private
export const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('user', 'name email');
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get review stats for dashboard
// @route   GET /api/reviews/stats
// @access  Private
export const getReviewStats = async (req, res) => {
  try {
    const userId = req.user._id;
    // Only count ad-hoc (scratchpad) reviews for dashboard stats
    const filter = { user: userId, fileId: { $exists: false } };
    
    const totalReviews = await Review.countDocuments(filter);
    const bugsAgg = await Review.aggregate([
      { $match: { user: userId, fileId: { $exists: false } } },
      { $group: { _id: null, totalBugs: { $sum: '$bugsFound' } } },
    ]);
    const cleanReviews = await Review.countDocuments({ ...filter, bugsFound: 0 });
    const cleanPercent = totalReviews > 0 ? Math.round((cleanReviews / totalReviews) * 100) : 100;

    res.json({
      totalReviews,
      totalBugs: bugsAgg[0]?.totalBugs || 0,
      cleanPercent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update review status
// @route   PATCH /api/reviews/:id/status
// @access  Private
export const updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const reviewId = req.params.id;

    if (!['Pending', 'In Review', 'Needs Changes', 'Approved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    review.status = status;
    await review.save();

    const io = req.app.get('io');
    io.to(`review:${reviewId}`).emit('statusUpdated', status);

    res.json({ status: review.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Chat with AI for coding help
 * @route   POST /api/reviews/chat
 */
export const chatWithAi = async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: 'Messages are required' });
  }

  try {
    const systemPrompt = 'You are an elite Full-Stack Coding Mentor. Provide precise, technically dense assistance. Use modern best practices, provide high-quality snippets, and eliminate conversational filler. Format your responses in clean Markdown.';
    const { content: reply } = await callGroq(systemPrompt, messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n'), 0.7, 1024);

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during AI chat' });
  }
};
