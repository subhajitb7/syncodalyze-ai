import crypto from 'crypto';
import User from '../models/User.model.js';
import generateToken from '../utils/generateToken.js';
import { sendOtpEmail } from '../utils/sendEmail.js';
import AuditLog from '../models/AuditLog.model.js';

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateNodeId = () => `SYN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const validatePassword = (password) => {
  // At least 6 characters, at least one uppercase, one lowercase, one number and one special character
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  return regex.test(password);
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      console.warn(`[AUTH] REJECTED: User not found for email: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: 'Account Suspended: Please contact support for assistance.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.warn(`[AUTH] REJECTED: Password mismatch for user: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!validatePassword(password)) {
      console.warn(`[AUTH] PASS-WARNING: Valid password used but format is legacy for: ${email}`);
    }

    console.info(`[AUTH] SUCCESS: Credentials verified for: ${email}. Triggering 2FA flow...`);

    if (!user.isVerified) {
      // Resend OTP and tell frontend to redirect
      const otp = generateOtp();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendOtpEmail(user.email, otp);

      return res.status(403).json({
        message: 'Email not verified. A new OTP has been sent.',
        needsVerification: true,
        email: user.email,
      });
    }

    // Check if legacy password meets new rules
    user.mustUpdatePassword = !validatePassword(password);

    // Always require 2FA after password check
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendOtpEmail(user.email, otp);

    return res.status(202).json({
      message: 'Two-factor authentication required',
      requires2fa: true,
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!validatePassword(password)) {
      return res.status(400).json({
        message: 'Password must be 6-8 characters and contain Uppercase, Lowercase, Number and Special Character (@$!%*?&)'
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = generateOtp();
    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      nodeId: generateNodeId(),
    });

    await sendOtpEmail(email, otp);

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      needsVerification: true,
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please resend.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: 'Account Suspended: Please contact support for assistance.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    
    // Auto-Elevation Hook for Primary Admin
    if (user.email === process.env.MASTER_ADMIN_EMAIL) {
      user.role = 'admin';
    }
    
    await user.save();

    generateToken(res, user._id);

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      nodeId: user.nodeId,
      isMaster: user.email === process.env.MASTER_ADMIN_EMAIL,
      mustUpdatePassword: user.mustUpdatePassword
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Already verified' });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(email, otp);
    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
export const logoutUser = (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
  });

  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (user) {
    if (user.isSuspended) {
      return res.status(403).json({ message: 'Account Suspended: Please contact support for assistance.' });
    }

    // Auto-Elevation Hook for Primary Admin (Session Refresh)
    if (user.email === process.env.MASTER_ADMIN_EMAIL && user.role !== 'admin') {
      user.role = 'admin';
      user.isVerified = true;
      await user.save();
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      nodeId: user.nodeId,
      isMaster: user.email === process.env.MASTER_ADMIN_EMAIL,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = req.body.name || user.name;
    // We can also allow email updates here later if needed

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// @desc    Upgrade legacy password
// @route   PUT /api/auth/profile/upgrade-password
// @access  Private
export const upgradePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message: 'Password must be 6-8 characters and contain Uppercase, Lowercase, Number and Special Character (@$!%*?&)'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    user.mustUpdatePassword = false;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustUpdatePassword: false
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error upgrading password' });
  }
};

// @desc    Forgot password — send reset OTP
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found with that email' });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(email, otp);

    res.json({ message: 'Password reset code sent to your email', email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message: 'Password must be 6-8 characters and contain Uppercase, Lowercase, Number and Special Character (@$!%*?&)'
      });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now sign in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify 2FA OTP and login
// @route   POST /api/auth/verify-2fa
export const verify2fa = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isSuspended) {
      return res.status(403).json({ message: 'Account Suspended: Please contact support for assistance.' });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    user.otp = undefined;
    user.otpExpiry = undefined;

    // Auto-Elevation Hook for Primary Admin
    if (user.email === process.env.MASTER_ADMIN_EMAIL) {
      user.role = 'admin';
      user.isVerified = true;
    }

    await user.save();

    generateToken(res, user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      nodeId: user.nodeId,
      isMaster: user.email === process.env.MASTER_ADMIN_EMAIL,
      mustUpdatePassword: user.mustUpdatePassword
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during 2FA' });
  }
};

// @desc    Delete user profile
// @route   DELETE /api/auth/profile
// @access  Private
export const deleteUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Safeguard: Master Admin cannot delete themselves
    if (user.email === process.env.MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ 
        message: 'Master Admin identity cannot be terminated directly. Transfer sovereignty or downgrade before deletion.' 
      });
    }

    // Capture metadata before deletion
    const userId = user._id;
    const userName = user.name;
    const userEmail = user.email;

    await User.findByIdAndDelete(userId);

    // Create Audit Log
    await AuditLog.create({
      action: 'ACCOUNT_TERMINATED',
      actor: userId,
      details: `Identity Node [${userName} (${userEmail})] terminated by self. All access credentials revoked.`,
      ipAddress: req.ip
    });

    // Clear session
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('jwt', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      expires: new Date(0),
    });

    res.status(200).json({ message: 'Identity Node successfully terminated. Redirecting to landing...' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during account termination' });
  }
};
