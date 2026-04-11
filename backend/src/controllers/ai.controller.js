import Review from '../models/Review.model.js';
import CodeFile from '../models/CodeFile.model.js';
import SystemSettings from '../models/SystemSettings.model.js';
import { callGroq } from '../utils/aiHelper.js';

// Helper to fetch settings with fallback
const getSettings = async () => {
  try {
    let settings = await SystemSettings.findOne({});
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    return settings;
  } catch (err) {
    console.error('Failed to fetch system settings:', err);
    return { maintenanceMode: false, defaultAiModel: 'llama-3.1-8b-instant', maxTokensPerReview: 2000 };
  }
};

// @desc    Summarize a source file
// @route   POST /api/ai/summarize-file
export const summarizeFile = async (req, res) => {
  const { fileId } = req.body;
  try {
    const settings = await getSettings();

    const file = await CodeFile.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Caching check
    const currentV = file.versions.find(v => Number(v.versionNumber) === Number(file.currentVersion));
    if (currentV && currentV.aiSummary) {
      return res.json({ summary: currentV.aiSummary });
    }

    const prompt = `Summarize the logic and purpose of the following code in exactly 3 concise bullet points. Be technical but understandable.\n\nFilename: ${file.filename}\nCode:\n\`\`\`${file.language}\n${file.content}\n\`\`\``;
    const systemPrompt = 'You are an elite Technical Architect. Summarize code logic with extreme precision and technical density. No conversational filler.';
    
    const { content: summary } = await callGroq(
      systemPrompt, 
      prompt, 
      0.3, 
      settings.maxTokensPerReview, 
      settings.defaultAiModel
    );

    // Save summary to current version
    const currentV_upd = file.versions.find(v => Number(v.versionNumber) === Number(file.currentVersion));
    if (currentV_upd) {
      currentV_upd.aiSummary = summary;
      file.markModified('versions');
      await file.save();
    }

    res.json({ summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
};

// @desc    Summarize a raw code snippet (Stateless)
// @route   POST /api/ai/summarize-snippet
export const summarizeSnippet = async (req, res) => {
  const { codeSnippet, language, title } = req.body;
  if (!codeSnippet) return res.status(400).json({ message: 'Code snippet is required' });

  try {
    const settings = await getSettings();

    const prompt = `Summarize the logic and purpose of the following code in exactly 3 concise bullet points. Be technical but understandable.\n\nTitle: ${title || 'Snippet'}\nCode:\n\`\`\`${language || ''}\n${codeSnippet}\n\`\`\``;
    const systemPrompt = 'You are an elite Technical Architect. Summarize code logic with extreme precision and technical density. No conversational filler.';
    
    const { content: summary } = await callGroq(
      systemPrompt, 
      prompt, 
      0.3, 
      settings.maxTokensPerReview, 
      settings.defaultAiModel
    );

    res.json({ summary });
  } catch (error) {
    console.error('Snippet Summary Error:', error);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
};

// @desc    Get AI personalized insights for a developer
// @route   GET /api/ai/insights
export const getDeveloperInsights = async (req, res) => {
  try {
    const settings = await getSettings();

    const userId = req.user._id;
    const reviews = await Review.find({ user: userId }).select('aiFeedback aiTags bugsFound createdAt').sort({ createdAt: -1 }).limit(10);

    if (reviews.length === 0) {
      return res.json({ insights: "Start reviewing code to see personalized AI growth insights!" });
    }

    const reviewContext = reviews.map(r => `Review Tags: ${r.aiTags?.join(', ') || 'N/A'}, Bugs: ${r.bugsFound}, Feedback snippet: ${r.aiFeedback.substring(0, 100)}`).join('\n---\n');

    const prompt = `Based on the following history of code reviews, provide a personalized growth insight for this developer. What is their recurring weakness? What have they improved? Provide a 3-sentence summary.\n\nReview History:\n${reviewContext}`;
    const systemPrompt = 'You are an elite Engineering Mentor. Analyze review history and provide a direct, actionable 3-sentence growth summary. No introductory filler.';
    
    const { content: insights } = await callGroq(
      systemPrompt, 
      prompt, 
      0.5, 
      settings.maxTokensPerReview, 
      settings.defaultAiModel
    );

    res.json({ insights });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate insights' });
  }
};

// @desc    Generate a professional email summary of a review
// @route   POST /api/ai/generate-email
export const generateReviewEmail = async (req, res) => {
  const { reviewId } = req.body;
  try {
    const settings = await getSettings();

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const prompt = `Generate a professional, concise email summary for a code review. The developer has analyzed a code snippet titled "${review.title}". 
    Findings: ${review.bugsFound} issues found.
    AI Feedback summary: ${review.aiFeedback.substring(0, 300)}...
    
    The email should be addressed to "Team Lead" and should maintain a collaborative, expert tone.`;
    const systemPrompt = 'You are an elite Technical Communications Expert. Generate professional, data-driven email summaries of code reviews. Focus on impact and clarity. No filler.';
    
    const { content: emailBody } = await callGroq(
      systemPrompt, 
      prompt, 
      0.5, 
      1024, 
      settings.defaultAiModel
    );

    res.json({ emailBody });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate email' });
  }
};
