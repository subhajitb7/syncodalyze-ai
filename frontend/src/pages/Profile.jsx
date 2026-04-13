import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import {
  User, Mail, Shield, Key, Save, Send, CheckCircle2,
  AlertCircle, Loader2, ArrowRight, Settings, Camera, UserPlus,
  ShieldCheck, Activity, Database, Zap, Cpu, History, ChevronRight,
  Fingerprint, CreditCard, Lock, ArrowUpRight, Trash2, ShieldOff,
  Copy, Check
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import KernelAuditTrail from '../components/KernelAuditTrail';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  const [name, setName] = useState(user?.name || '');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [copied, setCopied] = useState(false);

  // Stats (Mocked for premium feel if not in DB, but integrated with user data where possible)
  const [stats, setStats] = useState({
    totalReviews: 0,
    healthImpact: 94,
    uptime: '100%',
    roleLevel: user?.role === 'admin' ? 'Level 5 Admin' : 'Senior Operator'
  });

  // Password Reset State
  const [resetStep, setResetStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [terminating, setTerminating] = useState(false);

  useEffect(() => {
    const fetchProfileStats = async () => {
      try {
        const { data: res } = await axios.get('/api/reviews/stats');
        setStats(prev => ({ 
          ...prev, 
          totalReviews: res.totalReviews || 0,
          healthImpact: res.healthImpact || 94,
          uptime: res.uptime || '100%'
        }));
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfileStats();
  }, []);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);
    try {
      const { data } = await axios.put('/api/auth/profile', { name });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setMessage({ type: 'success', text: 'Operator identity synchronized successfully.' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Synchronization failed.' });
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
      setResetMessage({ type: 'info', text: 'Verification cipher transmitted to your registered email.' });
    } catch (err) {
      setResetMessage({ type: 'error', text: err.response?.data?.message || 'Transmission failed.' });
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
      setResetMessage({ type: 'success', text: 'Authentication credentials rotated successfully.' });
      setOtp('');
      setNewPassword('');
      setTimeout(() => setResetMessage(null), 5000);
    } catch (err) {
      setResetMessage({ type: 'error', text: err.response?.data?.message || 'Verification failed.' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setTerminating(true);
    try {
      await axios.delete('/api/auth/profile');
      // Success: Clear local storage and redirect
      localStorage.removeItem('userInfo');
      window.location.href = '/';
    } catch (err) {
      setResetMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Identity termination failed.' 
      });
      setIsConfirmOpen(false);
    } finally {
      setTerminating(false);
    }
  };

  const menuItems = [
    { id: 'general', label: 'Identity & Persona', icon: User },
    { id: 'security', label: 'Security & Protocols', icon: Lock },
    { id: 'activity', label: 'Operational Logs', icon: History },
  ];

  return (
    <div className="min-h-screen grid-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center gap-10 mb-16 relative">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative group"
          >
            <div className={`h-40 w-40 rounded-[2.5rem] flex items-center justify-center text-5xl font-black border-2 transition-all duration-500 shadow-2xl relative z-10 ${
              isAdmin ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'bg-primary-500/10 text-primary-500 border-primary-500/30'
            }`}>
              {user.name?.charAt(0).toUpperCase()}
              <div className="absolute inset-0 bg-primary-500/5 rounded-[2.5rem] animate-pulse -z-10 group-hover:scale-110 transition-transform"></div>
            </div>
            <div className="absolute -bottom-2 -right-2 p-3 bg-main border border-col rounded-2xl shadow-xl group-hover:scale-110 transition-transform cursor-pointer z-20 hover:border-primary-500">
              <Camera className="h-5 w-5 text-sec" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex-1 text-center md:text-left"
          >
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
              <h1 className="text-5xl font-black text-main tracking-tighter uppercase">{user.name}</h1>
              <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg ${
                isAdmin ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-primary-500/10 text-primary-500 border-primary-500/20'
              }`}>
                {stats.roleLevel}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sec font-bold opacity-60 uppercase tracking-widest text-[10px]">
               <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary-500" /> {user.email}</div>
               <div className="flex items-center gap-2">
                 <ShieldCheck className={`h-4 w-4 ${isAdmin ? 'text-emerald-500' : 'text-primary-400'}`} /> 
                 {isAdmin ? 'Authorized Operator' : 'Verified Member'}
               </div>
               {isAdmin && (
                 <div className="flex items-center gap-2">
                   <Database className="h-4 w-4 text-purple-500" /> Node: Primary-Alpha
                 </div>
               )}
               <div 
                 onClick={() => {
                   if (!user.nodeId) {
                     setMessage({ type: 'info', text: 'Identity synchronization in progress. Please re-authenticate.' });
                     return;
                   }
                   navigator.clipboard.writeText(user.nodeId);
                   setCopied(true);
                   setMessage({ type: 'success', text: 'Node Hash synchronized to clipboard.' });
                   setTimeout(() => { setCopied(false); setMessage(null); }, 3000);
                 }}
                 className="flex items-center gap-2 cursor-pointer group"
                 title="Click to copy unique node hash"
               >
                 <div className="flex items-center gap-2.5 px-3 py-1 bg-white/[0.03] border border-white/10 rounded-full hover:bg-white/10 hover:border-primary-500/30 transition-all shadow-xl">
                   <div className="flex items-center gap-1.5 border-r border-white/10 pr-2 mr-0.5">
                    <Cpu className="h-3 w-3 text-amber-500 group-hover:rotate-90 transition-transform" /> 
                    <span className="text-[9px] font-black text-sec uppercase tracking-[0.1em] opacity-40">Node Hash</span>
                   </div>
                   <span className="font-mono text-[10px] text-main tracking-tight italic">
                     {user.nodeId || 'SYNCING...'}
                   </span>
                   <div className="ml-1 p-1 rounded bg-white/5 group-hover:bg-primary-500/10 transition-colors">
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-primary-500 group-hover:scale-110 transition-transform" />}
                   </div>
                 </div>
               </div>
            </div>
          </motion.div>

          {/* Quick Stats Grid */}
          <div className="hidden xl:grid grid-cols-2 gap-3 w-80">
             <div className="glass-panel p-4 bg-ter/30 border-col/50">
                <p className="text-[10px] font-black text-sec uppercase tracking-widest opacity-60 mb-1">Impact Score</p>
                <p className="text-2xl font-black text-main">+{stats.healthImpact}%</p>
             </div>
             <div className="glass-panel p-4 bg-ter/30 border-col/50">
                <p className="text-[10px] font-black text-sec uppercase tracking-widest opacity-60 mb-1">Uptime</p>
                <p className="text-2xl font-black text-emerald-500">{stats.uptime}</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Navigation */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="lg:col-span-3 space-y-2"
          >
            <div className="glass-panel p-2 flex flex-col gap-1 border-col/50 bg-ter/20">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all group ${
                    activeTab === item.id 
                      ? 'bg-primary-500 text-white shadow-xl shadow-primary-500/20' 
                      : 'text-sec hover:bg-primary-500/5 hover:text-main'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-4 w-4 ${activeTab === item.id ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`} />
                    {item.label}
                  </div>
                  <ChevronRight className={`h-3 w-3 ${activeTab === item.id ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              ))}
            </div>
            <div className="p-4 glass-panel bg-ter/10 border-dashed border-col border-2 grayscale opacity-40">
               <p className="text-[9px] font-black uppercase text-sec tracking-[0.2em] mb-2 leading-relaxed">System Subscription</p>
               <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-main flex items-center gap-2"><Zap className="h-3 w-3 fill-current" /> Enterprise Plan</span>
                  <ArrowUpRight className="h-3 w-3" />
               </div>
            </div>
          </motion.div>

          {/* Main Content Pane */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="lg:col-span-9"
          >
            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div 
                  key="general"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="glass-panel overflow-hidden border-col shadow-2xl relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                       <UserPlus className="h-32 w-32" />
                    </div>
                    <div className="p-8 border-b border-col bg-ter/30">
                       <h3 className="text-xl font-black text-main uppercase tracking-tighter flex items-center gap-3">
                         <div className="p-2 bg-primary-500/10 rounded-lg"><User className="h-5 w-5 text-primary-500" /></div>
                         General Management
                       </h3>
                    </div>

                    <form onSubmit={handleUpdateName} className="p-8 space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-sec uppercase tracking-[0.2em] px-1">Display Name</label>
                             <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sec group-focus-within:text-primary-500 transition-colors" />
                                <input
                                  type="text"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  className="glass-input !pl-14 h-14 w-full font-black text-lg tracking-tight"
                                  placeholder="Your Name"
                                />
                             </div>
                          </div>
                          <div className="space-y-3 opacity-50">
                             <label className="text-[10px] font-black text-sec uppercase tracking-[0.2em] px-1">Primary Email Node</label>
                             <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sec" />
                                <input
                                  type="email"
                                  value={user.email}
                                  disabled
                                  className="glass-input !pl-14 h-14 w-full font-bold cursor-not-allowed bg-ter/30 text-sec"
                                />
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center justify-between pt-6 border-t border-col/50 gap-6">
                          <p className="text-xs text-sec font-medium max-w-sm italic">Note: Changing your display pseudonym will affect how you appear in collaborative peer reviews and team logs.</p>
                          <button
                            type="submit"
                            disabled={updating || name === user?.name}
                            className="btn-primary h-14 px-10 font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 disabled:grayscale flex items-center gap-3"
                          >
                            {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Sync Identity
                          </button>
                       </div>
                    </form>
                  </div>

                  {message && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-5 rounded-[2rem] flex items-center gap-4 border ${
                      message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    }`}>
                      <CheckCircle2 className="h-6 w-6" />
                      <p className="text-sm font-black uppercase tracking-widest">{message.text}</p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div 
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="glass-panel overflow-hidden border-col shadow-2xl">
                    <div className="p-8 border-b border-col bg-ter/30">
                       <h3 className="text-xl font-black text-main uppercase tracking-tighter flex items-center gap-3">
                         <div className="p-2 bg-amber-500/10 rounded-lg"><Lock className="h-5 w-5 text-amber-500" /></div>
                         Security Protocols & Auth
                       </h3>
                    </div>

                    <div className="p-8">
                       {!user.githubId ? (
                         resetStep === 1 ? (
                           <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 bg-amber-500/[0.03] rounded-[2.5rem] border border-amber-500/10">
                             <div className="max-w-md">
                               <h4 className="font-black text-main uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-amber-500" /> Rotate Credentials
                               </h4>
                               <p className="text-xs text-sec font-medium leading-relaxed mb-4">
                                 We will transmit a single-use verification cipher to <span className="text-main font-black underline decoration-amber-500/30">{user.email}</span>. You must enter this cipher to authorize a primary password rotation.
                               </p>
                               <div className="flex items-center gap-2 text-[9px] font-black text-amber-600/60 uppercase">
                                  <Activity className="h-3 w-3" /> Security Level: High
                               </div>
                             </div>
                             <button
                               onClick={handleRequestOTP}
                               disabled={resetLoading}
                               className="btn-secondary h-14 px-10 text-xs font-black uppercase tracking-widest border-amber-500/20 text-amber-500 hover:bg-amber-500/10 shadow-xl shadow-amber-500/5 group"
                             >
                                {resetLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Initialize Transmission
                             </button>
                           </div>
                         ) : (
                           <form onSubmit={handleResetPassword} className="space-y-8 animate-in slide-in-from-top-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-sec uppercase tracking-[0.2em] px-1">Verification Cipher</label>
                                   <input
                                     type="text"
                                     value={otp}
                                     onChange={(e) => setOtp(e.target.value)}
                                     className="glass-input h-14 w-full text-center text-2xl font-black tracking-[0.5em] focus:bg-primary-500/5"
                                     placeholder="000000"
                                     maxLength={6}
                                     required
                                   />
                                </div>
                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-sec uppercase tracking-[0.2em] px-1">New Terminal Password</label>
                                   <div className="relative group">
                                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sec group-focus-within:text-amber-500 transition-all font-black text-lg" />
                                      <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="glass-input pl-12 h-14 w-full font-bold"
                                        placeholder="Min 6 Characters"
                                        required
                                        minLength={6}
                                      />
                                   </div>
                                </div>
                             </div>

                             <div className="flex gap-4 pt-4">
                                <button type="submit" disabled={resetLoading} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-3">
                                   {resetLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                                   Authorize Rotation
                                </button>
                                <button type="button" onClick={() => setResetStep(1)} className="px-10 btn-secondary h-14 font-black uppercase tracking-widest border-col text-sec">Abort</button>
                             </div>
                           </form>
                         )
                       ) : (
                         <div className="p-8 text-center glass-panel border-col/50 bg-primary-500/5">
                            <ShieldCheck className="h-12 w-12 text-primary-500 mx-auto mb-4" />
                            <h4 className="text-lg font-black text-main uppercase tracking-tighter mb-2">SSO-Synchronized Account</h4>
                            <p className="text-xs text-sec font-medium max-w-sm mx-auto leading-relaxed italic">
                               Security protocols are currently governed by your third-party provider (GitHub). Direct password rotation is disabled to maintain synchronization integrity.
                            </p>
                         </div>
                       )}

                       {resetMessage && (
                        <div className={`mt-8 p-5 rounded-[2rem] flex items-center gap-4 border animate-in slide-in-from-bottom-2 ${
                          resetMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                          resetMessage.type === 'info' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                          'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}>
                          {resetMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                          <p className="text-sm font-black uppercase tracking-widest">{resetMessage.text}</p>
                        </div>
                      )}

                      {/* Danger Zone */}
                      <div className="mt-12 pt-8 border-t border-rose-500/20">
                         <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 bg-rose-500/[0.03] rounded-[2.5rem] border border-rose-500/10 transition-all hover:bg-rose-500/[0.05]">
                            <div className="max-w-md">
                               <h4 className="font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <ShieldOff className="h-4 w-4" /> Danger Zone: Identity Termination
                               </h4>
                               <p className="text-xs text-sec font-medium leading-relaxed mb-4">
                                 Executing this command will permanently purge your identity node and all associated telemetry from the Sovereign network. This action is <span className="text-rose-500 font-black underline">irreversible</span>.
                               </p>
                            </div>
                            <button
                              onClick={() => setIsConfirmOpen(true)}
                              className="btn-secondary h-14 px-10 text-xs font-black uppercase tracking-widest border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/40 shadow-xl shadow-rose-500/5 transition-all"
                            >
                              Terminate Node
                            </button>
                         </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <motion.div 
                  key="activity"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                   <div className="glass-panel overflow-hidden border-col shadow-2xl">
                      <div className="p-8 border-b border-col bg-ter/30">
                         <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-main uppercase tracking-tighter flex items-center gap-3">
                              <div className="p-2 bg-primary-500/10 rounded-lg"><History className="h-5 w-5 text-primary-500" /></div>
                              Operational Audit Logs
                            </h3>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Logging Sub-system Online</span>
                            </div>
                         </div>
                      </div>
                      <div className="p-8">
                         <KernelAuditTrail />
                      </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Confirm Account Deletion?"
        message="Are you absolutely sure you want to delete your account? All associated data will be permanently removed and your session will be ended immediately."
      />
    </div>
  );
};

export default Profile;
