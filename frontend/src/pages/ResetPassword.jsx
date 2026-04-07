import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Lock, RefreshCw, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  useEffect(() => {
    if (!email) navigate('/forgot-password');
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`reset-otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`reset-otp-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/reset-password', { email, otp: otpString, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setResendCooldown(60);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend');
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="glass-panel w-full max-w-md p-8 z-10 text-center">
          <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Password Reset Successful!</h2>
          <p className="text-gray-400 mb-6">You can now sign in with your new password.</p>
          <Link to="/auth" className="btn-primary inline-block">Go to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="glass-panel w-full max-w-md p-8 z-10">
        <div className="h-14 w-14 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="h-7 w-7 text-primary-400" />
        </div>
        <h2 className="text-3xl font-bold text-center mb-2">Reset Password</h2>
        <p className="text-gray-400 text-center mb-8">
          Enter the code sent to <span className="text-primary-400 font-medium">{email}</span>
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* OTP Input */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Reset Code</label>
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`reset-otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold glass-input focus:border-primary-500"
                />
              ))}
            </div>
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="glass-input" placeholder="Min 6 characters" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="glass-input" placeholder="Confirm new password" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-2 disabled:opacity-50">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 mb-2">Didn't receive the code?</p>
          {resendCooldown > 0 ? (
            <p className="text-sm text-gray-500">Resend in {resendCooldown}s</p>
          ) : (
            <button onClick={handleResend} className="text-sm text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1 mx-auto">
              <RefreshCw className="h-3 w-3" /> Resend Code
            </button>
          )}
        </div>

        <Link to="/auth" className="mt-4 text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1 justify-center">
          <ArrowLeft className="h-3 w-3" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
