import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  User, Mail, Shield, Key, Save, Send, CheckCircle2,
  AlertCircle, Loader2, ArrowRight, Settings, Camera, UserPlus
} from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || '');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  // Password Reset State
  const [resetStep, setResetStep] = useState(1); // 1: Request, 2: Verify
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);

  const isAdmin = user?.role === 'admin';

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);
    try {
      const { data } = await axios.put('/api/auth/profile', { name });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setMessage({ type: 'success', text: 'Display name updated!' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestOTP = async () => {
    setResetLoading(true);
    setResetMessage(null);
    try {
      await axios.post('/api/auth/forgot-password', { email: user.email });
      setResetStep(2);
      setResetMessage({ type: 'info', text: 'Verification code sent.' });
    } catch (err) {
      setResetMessage({ type: 'error', text: err.response?.data?.message || 'Failed to send OTP' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage(null);
    try {
      await axios.post('/api/auth/reset-password', {
        email: user.email,
        otp,
        newPassword
      });
      setResetStep(1);
      setResetMessage({ type: 'success', text: 'Password reset successful!' });
      setOtp('');
      setNewPassword('');
      setTimeout(() => setResetMessage(null), 5000);
    } catch (err) {
      setResetMessage({ type: 'error', text: err.response?.data?.message || 'Reset failed' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header section with User Context */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="relative group">
          <div className={`h-32 w-32 rounded-3xl flex items-center justify-center text-4xl font-bold border-2 transition-all duration-500 shadow-2xl ${isAdmin ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' : 'bg-primary-500/10 text-primary-500 border-primary-500/30'
            }`}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="absolute -bottom-2 -right-2 p-2 bg-main border border-col rounded-xl shadow-lg group-hover:scale-110 transition-transform cursor-pointer">
            <Camera className="h-4 w-4 text-sec" />
          </div>
        </div>
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <h1 className="text-4xl font-extrabold text-main tracking-tight">{user.name}</h1>
            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${isAdmin ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 'bg-primary-500/10 text-primary-500 border-primary-500/20'
              }`}>
              {user.role}
            </span>
          </div>
          {!user.githubId && (
            <p className="text-sec font-medium flex items-center justify-center md:justify-start gap-2">
              <Mail className="h-4 w-4" /> {user.email}
            </p>
          )}
          {user.githubId && (
            <p className="text-primary-500 font-bold flex items-center justify-center md:justify-start gap-2 text-xs uppercase tracking-widest">
              <Shield className="h-3.5 w-3.5" /> Integrated GitHub Account
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Nav (Visual) */}
        <div className="lg:col-span-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-500/10 text-primary-500 font-bold text-sm border border-primary-500/20">
            <Settings className="h-4 w-4" /> Account Settings
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sec hover:bg-sec/10 font-bold text-sm transition-all grayscale opacity-50 cursor-not-allowed">
            <Shield className="h-4 w-4" /> Security Logs
          </button>
        </div>

        {/* Main Settings Panel */}
        <div className="lg:col-span-9 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="glass-panel overflow-hidden border-col shadow-2xl">
            <div className="p-8 border-b border-col bg-sec/[0.03]">
              <h3 className="text-lg font-bold text-main flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary-500" /> General Profile
              </h3>
              <p className="text-xs text-sec font-medium mt-1">Manage's your public persona on the platform.</p>
            </div>

            <div className="p-8 space-y-8">
              <form onSubmit={handleUpdateName} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-sec uppercase tracking-widest px-1">Display Identity</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sec group-focus-within:text-primary-500 transition-colors" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field pl-12 h-14 font-bold text-lg"
                      placeholder="Display Name"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={updating || name === user?.name}
                    className="flex-grow btn-primary h-14 font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary-500/20 disabled:shadow-none translate-y-[-1px] active:translate-y-[0]"
                  >
                    {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Save Update
                  </button>
                </div>
              </form>

              {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  }`}>
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm font-bold">{message.text}</p>
                </div>
              )}
            </div>
          </div>

          {!user.githubId && (
            <div className="glass-panel overflow-hidden border-col shadow-2xl">
              <div className="p-8 border-b border-col bg-sec/[0.03]">
                <h3 className="text-lg font-bold text-main flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-500" /> Authentication Security
                </h3>
                <p className="text-xs text-sec font-medium mt-1">Change your login credentials securely.</p>
              </div>

              <div className="p-8">
                {resetStep === 1 ? (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-amber-500/[0.03] rounded-3xl border border-amber-500/10">
                    <div className="max-w-md">
                      <h4 className="font-bold text-main mb-1">Rotation Required?</h4>
                      <p className="text-xs text-sec font-medium leading-relaxed">
                        We'll send a 6-digit confirmation code to <span className="text-main font-bold">{user.email}</span> to authorize this password change.
                      </p>
                    </div>
                    <button
                      onClick={handleRequestOTP}
                      disabled={resetLoading}
                      className="whitespace-nowrap btn-secondary px-8 h-14 text-sm font-bold flex items-center justify-center gap-3 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 shadow-lg shadow-amber-500/5"
                    >
                      {resetLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      Initiate Reset
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-sec uppercase tracking-widest px-1">Verification Code</label>
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="input-field h-14 text-xl font-black tracking-[0.5em] text-center placeholder:tracking-normal"
                          placeholder="000000"
                          maxLength={6}
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-sec uppercase tracking-widest px-1">New Secure Password</label>
                        <div className="relative group">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sec" />
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="input-field pl-12 h-14 font-medium"
                            placeholder="At least 6 characters"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="flex-grow bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20 h-14 rounded-2xl font-black transition-all flex items-center justify-center gap-3"
                      >
                        {resetLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                        Finalize Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setResetStep(1)}
                        className="btn-secondary h-14 px-8 font-bold border-col text-sec"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {resetMessage && (
                  <div className={`mt-8 p-4 rounded-2xl flex items-start gap-3 border animate-in slide-in-from-bottom-2 ${resetMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    resetMessage.type === 'info' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                      'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    }`}>
                    {resetMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />}
                    <p className="text-sm font-bold leading-normal">{resetMessage.text}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
