import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, RefreshCw, ShieldCheck, Zap, Lock, Mail } from 'lucide-react';

const VerifyOtp = () => {
  const { setUser } = useContext(AuthContext);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const type = location.state?.type; // '2fa' or undefined (registration)
  const shouldRemember = location.state?.shouldRemember;

  useEffect(() => {
    if (!email) {
      navigate('/auth');
    }
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
      const { data } = await axios.post(endpoint, { email, otp: otpString, shouldRemember });
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      if (data.mustUpdatePassword) {
        navigate('/reset-password', { state: { email, token: data.resetToken } });
      } else {
        setUser(data);
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      }
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
    <div className="flex-1 min-h-[calc(100vh-64px)] flex bg-main overflow-hidden relative">
      {/* Sovereign V2 Background Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[20%] right-[-5%] w-[35%] h-[35%] bg-purple-600/10 rounded-full blur-[100px] animate-pulse [animation-delay:2s]"></div>
        <div className="absolute bottom-[10%] left-[20%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[150px]"></div>
      </div>
      
      {/* Grid Lines Overlay */}
      <div className="absolute inset-0 grid-background opacity-10 pointer-events-none"></div>
      
      {/* Left Column: Verification Sidecar */}
      <div className="hidden lg:flex flex-1 relative flex-col items-center justify-center p-20 overflow-hidden backdrop-blur-3xl">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-600/5 to-transparent"></div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 text-center"
        >
          <div className="mb-12 inline-block">
             <div className="h-24 w-24 bg-primary-500 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.2)] border border-primary-400/30 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <Lock className="h-10 w-10 text-white relative z-10" />
             </div>
          </div>
          
          <h2 className="text-4xl xl:text-5xl font-black text-main tracking-tighter mb-6 leading-tight">
            Clearance <br />
            <span className="text-primary-500">Verification</span>
          </h2>
          
          <div className="flex flex-col gap-4 max-w-sm mx-auto">
             <div className="flex items-start gap-4 p-4 bg-ter/30 border border-col rounded-2xl backdrop-blur-sm">
                <Zap className="h-5 w-5 text-amber-500 mt-1" />
                <div className="text-left">
                   <p className="text-[10px] font-black text-sec uppercase tracking-widest mb-1">Session Handshake</p>
                   <p className="text-xs text-sec font-medium">Verify your session via the one-time hash sent to your secure network endpoint.</p>
                </div>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Right Column: OTP Sovereign Terminal */}
      <div className="w-full lg:w-[600px] xl:w-[700px] relative flex flex-col items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-lg glass-panel p-8 sm:p-14 relative overflow-hidden text-center lg:text-left">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
           
           <motion.div
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="w-full relative z-10"
           >
              <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-6">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">
                      Integrity Handshake Active
                   </span>
                </div>
                
                <h3 className="text-4xl font-black text-main tracking-tighter mb-4 leading-tight">
                   {type === '2fa' ? 'Second Factor Clearance' : 'Identity Verification'}
                </h3>
                <p className="text-sm text-sec font-medium leading-relaxed opacity-60">
                   Enter the 6-digit hash dispatched to <br />
                   <span className="text-primary-500 font-black">{email}</span>.
                </p>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl mb-8 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                <div className="flex justify-between gap-3 px-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index} id={`otp-${index}`} type="text" inputMode="numeric" maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-full h-16 sm:h-20 text-center text-3xl font-black rounded-2xl glass-input focus:border-primary-500 transition-all border-2 border-col !bg-ter/20"
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <button
                    type="submit" disabled={loading}
                    className="w-full btn-primary h-14 disabled:opacity-30 disabled:grayscale transition-all shadow-[0_10px_30px_rgba(59,130,246,0.15)] flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest"
                  >
                    {loading ? 'Verifying Integrity...' : 'Verify Clearance'}
                  </button>

                  <div className="text-center pt-4">
                    <p className="text-[10px] font-black text-sec uppercase tracking-[0.2em] mb-4 opacity-40">Didn't receive the hash?</p>
                    {resendCooldown > 0 ? (
                      <span className="text-[10px] font-black text-primary-500/40 uppercase tracking-widest bg-primary-500/5 px-6 py-2 rounded-full border border-primary-500/10">
                        Resend available in {resendCooldown}s
                      </span>
                    ) : (
                      <button 
                        type="button" onClick={handleResend}
                        className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:text-white hover:bg-primary-500 px-6 py-3 rounded-full border border-primary-500/30 transition-all flex items-center gap-2 mx-auto"
                      >
                        <RefreshCw className="h-3 w-3" /> Dispatch New Hash
                      </button>
                    )}
                  </div>
                </div>
              </form>

              <div className="mt-12 text-center">
                <button onClick={() => navigate('/auth')} className="text-[10px] font-black text-sec uppercase tracking-widest hover:text-white transition-all flex items-center gap-2 mx-auto">
                  <ArrowLeft className="h-3.5 w-3.5" /> Return to Clearance Console
                </button>
              </div>
           </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
