import Review from '../models/Review.model.js';
import Notification from '../models/Notification.model.js';
import AiLog from '../models/AiLog.model.js';

// @desc    Analyze code snippet with AI
// @route   POST /api/reviews/analyze
// @access  Private
export const analyzeCode = async (req, res) => {
  const { title, codeSnippet, language } = req.body;

  if (!codeSnippet) {
    return res.status(400).json({ message: 'Code snippet is required' });
  }

  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey || groqApiKey === 'your_groq_api_key_here') {
      return res.status(500).json({ message: 'Groq API Key is not configured on the server.' });
    }

    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const userSocket = onlineUsers.get(req.user._id.toString());

    const sendProgress = (msg) => {
      if (userSocket) io.to(userSocket).emit('aiProgress', msg);
    };

    sendProgress('Analyzing code structure...');

    const prompt = `Please review the following ${language || 'code'} snippet:\n\n\`\`\`${language || ''}\n${codeSnippet}\n\`\`\``;
    const startTime = Date.now();

    sendProgress('Detecting vulnerabilities...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert code reviewer. Analyze the provided code, find any bugs or vulnerabilities, suggest improvements, and give an overall rating out of 10. Format your response clearly in Markdown. Point out specific lines if possible. \n\nAt the very end of your response, strictly include these two metadata tags:\n1. [ISSUES_COUNT]: X (where X is the number of bugs/vulnerabilities)\n2. [TAGS]: tag1, tag2, tag3 (where tags are categories like #Security, #Performance, #UI, #Logic, #React, etc. Provide at least 3 relevant tags). \n\nDo NOT include a main title/heading like "Code Review" or "Analysis" at the top of your response, just start directly with your observations.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API Error:', errorData);

      // Log the failed AI call
      await AiLog.create({
        user: req.user._id,
        prompt,
        response: errorData,
        language,
        responseTimeMs,
        status: 'error',
        errorMessage: errorData,
      });

      return res.status(500).json({ message: 'Failed to communicate with AI service' });
    }

    const data = await response.json();
    
    sendProgress('Generating suggestions...');
    
    const aiFeedback = data.choices[0]?.message?.content || 'No feedback generated.';
    const tokensUsed = data.usage?.total_tokens || 0;
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
    console.error(error);
    res.status(500).json({ message: 'Server error during analysis' });
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
    const totalReviews = await Review.countDocuments({ user: userId });
    const bugsAgg = await Review.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, totalBugs: { $sum: '$bugsFound' } } },
    ]);
    const cleanReviews = await Review.countDocuments({ user: userId, bugsFound: 0 });
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
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return res.status(500).json({ message: 'Groq API Key is not configured' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert coding assistant. Help the user with their code, provide snippets if needed, and be concise and helpful. Format your responses in Markdown.',
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return res.status(500).json({ message: 'AI Chat Error: ' + errorData });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || 'No response generated.';
    
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during AI chat' });
  }
};
