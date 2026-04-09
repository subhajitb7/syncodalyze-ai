import Review from '../models/Review.model.js';
import CodeFile from '../models/CodeFile.model.js';

// @desc    Summarize a source file
// @route   POST /api/ai/summarize-file
export const summarizeFile = async (req, res) => {
  const { fileId } = req.body;
  try {
    const file = await CodeFile.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const groqApiKey = process.env.GROQ_API_KEY;
    const prompt = `Summarize the logic and purpose of the following code in exactly 3 concise bullet points. Be technical but understandable.\n\nFilename: ${file.filename}\nCode:\n\`\`\`${file.language}\n${file.content}\n\`\`\``;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a technical document analyzer. Provide 3 bullet points summarizing the code provided.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) throw new Error('AI summary failed');
    const data = await response.json();
    const summary = data.choices[0]?.message?.content || 'No summary generated.';

    // Save summary to current version
    console.log(`Persisting summary for file ${fileId}`);
    try {
      const currentV = file.versions.find(v => Number(v.versionNumber) === Number(file.currentVersion));
      if (currentV) {
        currentV.aiSummary = summary;
        file.markModified('versions');
        await file.save();
        console.log(`Summary persisted for version ${file.currentVersion}`);
      } else {
        console.warn(`Version ${file.currentVersion} not found in file ${fileId} for summary`);
      }
    } catch (saveError) {
      console.error('Failed to save AI summary to file:', saveError);
    }

    res.json({ summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
};

// @desc    Get AI personalized insights for a developer
// @route   GET /api/ai/insights
export const getDeveloperInsights = async (req, res) => {
  try {
    const userId = req.user._id;
    const reviews = await Review.find({ user: userId }).select('aiFeedback aiTags bugsFound createdAt').sort({ createdAt: -1 }).limit(10);

    if (reviews.length === 0) {
      return res.json({ insights: "Start reviewing code to see personalized AI growth insights!" });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    const reviewContext = reviews.map(r => `Review Tags: ${r.aiTags?.join(', ') || 'N/A'}, Bugs: ${r.bugsFound}, Feedback snippet: ${r.aiFeedback.substring(0, 100)}`).join('\n---\n');

    const prompt = `Based on the following history of code reviews, provide a personalized growth insight for this developer. What is their recurring weakness? What have they improved? Provide a 3-sentence summary.\n\nReview History:\n${reviewContext}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a senior engineering mentor. Analyze history and provide 3-sentenced growth insights.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) throw new Error('AI insights failed');
    const data = await response.json();
    const insights = data.choices[0]?.message?.content || 'Keep coding to unlock more insights!';

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
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const groqApiKey = process.env.GROQ_API_KEY;
    const prompt = `Generate a professional, concise email summary for a code review. The developer has analyzed a code snippet titled "${review.title}". 
    Findings: ${review.bugsFound} issues found.
    AI Feedback summary: ${review.aiFeedback.substring(0, 300)}...
    
    The email should be addressed to "Team Lead" and should maintain a collaborative, expert tone.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a professional technical communicator. Generate email bodies based on review data.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) throw new Error('AI email generation failed');
    const data = await response.json();
    const emailBody = data.choices[0]?.message?.content || 'No email generated.';

    res.json({ emailBody });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate email' });
  }
};
