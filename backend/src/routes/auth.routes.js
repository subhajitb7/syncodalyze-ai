import express from 'express';
import {
  authUser, registerUser, logoutUser, getUserProfile, updateUserProfile,
  verifyOtp, resendOtp, forgotPassword, resetPassword,
  verify2fa
} from '../controllers/auth.controller.js';
import { gitHubRedirect, gitHubCallback } from '../controllers/githubAuth.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/github', gitHubRedirect);
router.get('/github/callback', gitHubCallback);

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-2fa', verify2fa);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

export default router;
