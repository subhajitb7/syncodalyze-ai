import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, RefreshCw } from 'lucide-react';

const VerifyOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const type = location.state?.type; // '2fa' or undefined (registration)

  useEffect(() => {
    if (!email) navigate('/auth');
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      if (next) next.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      if (prev) prev.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const endpoint = type === '2fa' ? '/api/auth/verify-2fa' : '/api/auth/verify-otp';
      const { data } = await axios.post(endpoint, { email, otp: otpString });
      localStorage.setItem('userInfo', JSON.stringify(data));
      window.location.href = '/dashboard'; // Full reload to pick up auth state
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await axios.post('/api/auth/resend-otp', { email });
      setResendCooldown(60);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="glass-panel w-full max-w-md p-8 z-10">
        <h2 className="text-3xl font-bold text-center mb-2">
          {type === '2fa' ? 'Second Factor Auth' : 'Verify Your Email'}
        </h2>
        <p className="text-gray-400 text-center mb-8">
          {type === '2fa' 
            ? 'Enter the security code to access your account' 
            : `We sent a 6-digit code to ${email}`}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold glass-input focus:border-primary-500"
              />
            ))}
          </div>

          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 mb-2">Didn't receive the code?</p>
          {resendCooldown > 0 ? (
            <p className="text-sm text-gray-500">Resend in {resendCooldown}s</p>
          ) : (
            <button onClick={handleResend} className="text-sm text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1 mx-auto">
              <RefreshCw className="h-3 w-3" /> Resend OTP
            </button>
          )}
        </div>

        <button onClick={() => navigate('/auth')} className="mt-4 text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1 mx-auto">
          <ArrowLeft className="h-3 w-3" /> Back to Login
        </button>
      </div>
    </div>
  );
};

export default VerifyOtp;
