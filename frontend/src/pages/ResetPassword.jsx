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

    // Strict password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,8}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('Password must be 6-8 characters with Uppercase, Lowercase, Number & Symbol');
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

  const isPasswordValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,8}$/.test(newPassword);

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Sovereign V2 Background Mesh */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute top-[20%] right-[-5%] w-[35%] h-[35%] bg-purple-600/10 rounded-full blur-[100px] animate-pulse [animation-delay:2s]"></div>
          <div className="absolute bottom-[10%] left-[20%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[150px]"></div>
        </div>
        
        {/* Grid Lines Overlay */}
        <div className="absolute inset-0 grid-background opacity-10 pointer-events-none"></div>
        
        <div className="glass-panel w-full max-w-md p-8 z-10 text-center">
          <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-main">Password Reset Successful!</h2>
          <p className="text-sec font-medium mb-6">You can now sign in with your new password.</p>
          <Link to="/auth" className="btn-primary inline-block">Go to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative">
      {/* Sovereign V2 Background Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[20%] right-[-5%] w-[35%] h-[35%] bg-purple-600/10 rounded-full blur-[100px] animate-pulse [animation-delay:2s]"></div>
        <div className="absolute bottom-[10%] left-[20%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[150px]"></div>
      </div>
      
      {/* Grid Lines Overlay */}
      <div className="absolute inset-0 grid-background opacity-10 pointer-events-none"></div>
      
      <div className="glass-panel w-full max-w-md p-8 z-10 shadow-2xl">
        <div className="h-14 w-14 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="h-7 w-7 text-primary-400" />
        </div>
        <h2 className="text-3xl font-bold text-center mb-2 text-main">Reset Password</h2>
        <p className="text-sec font-medium text-center mb-8">
          Enter the code sent to <span className="text-primary-400 font-bold">{email}</span>
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* OTP Input */}
          <div>
            <label className="text-sm font-bold text-sec mb-2 block tracking-tight">Reset Code</label>
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
          <div className="flex flex-col gap-2 relative">
            <label className="text-sm font-bold text-sec tracking-tight">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="glass-input" placeholder="••••••••" />
            {newPassword && (
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { label: '6-8 Chars', met: newPassword.length >= 6 && newPassword.length <= 8 },
                  { label: 'Uppercase', met: /[A-Z]/.test(newPassword) },
                  { label: 'Lowercase', met: /[a-z]/.test(newPassword) },
                  { label: 'Number', met: /\d/.test(newPassword) },
                  { label: 'Symbol (@$!%*?&)', met: /[@$!%*?&]/.test(newPassword) },
                ].map((req) => (
                  <span
                    key={req.label}
                    className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border transition-colors ${req.met
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : 'bg-red-500/5 text-red-500/40 border-red-500/10'
                      }`}
                  >
                    {req.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-sec tracking-tight">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="glass-input" placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading || !isPasswordValid || newPassword !== confirmPassword} className="btn-primary mt-2 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-primary-500/10">
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
