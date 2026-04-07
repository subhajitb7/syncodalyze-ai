import axios from 'axios';
import User from '../models/User.model.js';
import generateToken from '../utils/generateToken.js';

// @desc    Redirect to GitHub OAuth
// @route   GET /api/auth/github
export const gitHubRedirect = (req, res) => {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  if (!GITHUB_CLIENT_ID) {
    return res.status(500).json({ message: 'GitHub Client ID not configured.' });
  }
  const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/auth/github/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email,repo`;
  res.redirect(url);
};

// @desc    GitHub OAuth Callback
// @route   GET /api/auth/github/callback
export const gitHubCallback = async (req, res) => {
  const { code } = req.query;
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?error=No+code+provided`);
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new Error('Failed to obtain access token');
    }

    // 2. Get GitHub User profile
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` },
    });
    
    // 3. Get Public emails (sometimes primary email is hidden)
    const emailRes = await axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `token ${accessToken}` },
    });
    const primaryEmail = emailRes.data.find(e => e.primary)?.email || userRes.data.email || `${userRes.data.id}@github.com`;

    const githubId = userRes.data.id.toString();
    const name = userRes.data.name || userRes.data.login;

    // 4. Find or create user
    let user = await User.findOne({ 
      $or: [{ githubId }, { email: primaryEmail }] 
    });

    if (user) {
      user.githubId = githubId;
      user.githubAccessToken = accessToken;
      user.isVerified = true; // GitHub account is assumed verified
      await user.save();
    } else {
      user = await User.create({
        name,
        email: primaryEmail,
        githubId,
        githubAccessToken: accessToken,
        isVerified: true,
      });
    }

    // 5. Generate platform token and redirect to dashboard
    generateToken(res, user._id);
    
    // Set a temporary cookie or query param so frontend knows OAuth was successful
    // React app checkAuth will handle the rest via /api/auth/profile
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?oauth=success`);
  } catch (error) {
    console.error('GitHub OAuth Error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?error=OAuth+failed`);
  }
};
