import { useState, useContext } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Layout, ArrowRight, ShieldCheck, Zap, Cpu } from 'lucide-react';
import GithubIcon from '../components/GithubIcon';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shouldRemember, setShouldRemember] = useState(true);

  const { login, register, user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let result;
    if (isLogin) {
      result = await login(email, password, shouldRemember);
    } else {
      result = await register(name, email, password, shouldRemember);
    }

    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else if (result.needsVerification) {
      navigate('/verify-otp', { state: { email: result.email || email, shouldRemember } });
    } else if (result.requires2fa) {
      navigate('/verify-otp', { state: { email: result.email || email, type: '2fa', shouldRemember } });
    } else {
      setError(result.message);
    }
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
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
      
      {/* Left Column: Clinical Brand Sidebar */}
      <div className="hidden lg:flex flex-1 relative flex-col items-center justify-center p-20 overflow-hidden backdrop-blur-3xl">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary-600/5 to-transparent"></div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center"
        >
          <div className="mb-12 inline-block">
             <div className="h-24 w-24 bg-primary-500 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.2)] border border-primary-400/30">
                <img src="/logo.svg" alt="Syncodalyze Logo" className="h-16 w-16" />
             </div>
          </div>
          
          <h2 className="text-4xl xl:text-5xl font-black text-main tracking-tighter mb-6 leading-tight">
            Advanced Audit <br />
            <span className="text-primary-500">Intake Terminal</span>
          </h2>
          
          <div className="flex flex-col gap-4 max-w-sm mx-auto">
             <div className="flex items-start gap-4 p-4 bg-ter/30 border border-col rounded-2xl backdrop-blur-sm">
                <ShieldCheck className="h-5 w-5 text-emerald-500 mt-1" />
                <div className="text-left">
                   <p className="text-[10px] font-black text-sec uppercase tracking-widest mb-1">Integrity Cluster</p>
                   <p className="text-xs text-sec font-medium">Verify your Node ID to access secure communication channels.</p>
                </div>
             </div>
             <div className="flex items-start gap-4 p-4 bg-ter/30 border border-col rounded-2xl backdrop-blur-sm">
                <Zap className="h-5 w-5 text-amber-500 mt-1" />
                <div className="text-left">
                   <p className="text-[10px] font-black text-sec uppercase tracking-widest mb-1">Instant Sync</p>
                   <p className="text-xs text-sec font-medium">Connect your GitLab/GitHub account for automated asset indexing.</p>
                </div>
             </div>
          </div>
        </motion.div>
        
        {/* Footer info for Left side */}
        <div className="absolute bottom-10 left-10 flex flex-col gap-1">
           <p className="text-[10px] font-black text-sec uppercase tracking-[0.4em]">Unit: Syncodalyze_INTERNAL</p>
           <p className="text-[8px] font-bold text-sec opacity-40 uppercase tracking-[0.2em]">Build Revision: 4.8.2.SYNC</p>
        </div>
      </div>

      {/* Right Column: Sovereign Intake Portal */}
      <div className="w-full lg:w-[600px] xl:w-[700px] relative flex flex-col items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-lg glass-panel p-8 sm:p-14 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'register'}
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full relative z-10"
            >
              <div className="mb-10 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-500/20 bg-primary-500/5 mb-6">
                   <div className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse"></div>
                   <span className="text-[10px] font-black tracking-widest text-primary-500 uppercase">
                      {isLogin ? 'Security Handshake Required' : 'Asset Creation Sequence'}
                   </span>
                </div>
                
                <h3 className="text-4xl font-black text-main tracking-tighter mb-4 leading-tight">
                  {isLogin ? 'Initialize Session' : 'Recruit Operator'}
                </h3>
                <p className="text-sm text-sec font-medium leading-relaxed opacity-60">
                  {isLogin ? 'Authenticate your clearance for ' : 'Initialize your engineering node within '} 
                  <span className="text-primary-500 font-black">Syncodalyze AI</span>.
                </p>
              </div>

              {error && (
                <motion.div 
                  initial={{ x: -10, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl mb-6 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {!isLogin && (
                  <div className="group flex flex-col gap-2">
                    <label className="text-[10px] font-black text-sec uppercase tracking-widest px-1 group-focus-within:text-primary-500 transition-colors">Tactical Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sec/40 group-focus-within:text-primary-500 transition-colors" />
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} className="glass-input !pl-14 h-14 w-full" placeholder="e.g. Operator Alpha" />
                    </div>
                  </div>
                )}

                <div className="group flex flex-col gap-2">
                  <label className="text-[10px] font-black text-sec uppercase tracking-widest px-1 group-focus-within:text-primary-500 transition-colors">Network Identifier</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sec/40 group-focus-within:text-primary-500 transition-colors" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="glass-input !pl-14 h-14 w-full" placeholder="identity@sync.io" />
                  </div>
                </div>

                <div className="group flex flex-col gap-2 relative">
                  <label className="text-[10px] font-black text-sec uppercase tracking-widest px-1 group-focus-within:text-primary-500 transition-colors">Verification Hash</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sec/40 group-focus-within:text-primary-500 transition-colors" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="glass-input !pl-14 h-14 w-full" placeholder="••••••••" />
                  </div>
                  
                  {!isLogin && password && (
                    <div className="mt-3 flex flex-wrap gap-2 px-1">
                      {[
                        { label: 'Length: 6-8', met: password.length >= 6 && password.length <= 8 },
                        { label: 'Entropy: [A-Z]', met: /[A-Z]/.test(password) },
                        { label: 'Symbol: @$!', met: /[@$!%*?&]/.test(password) },
                        { label: 'Numeric', met: /\d/.test(password) },
                      ].map((req) => (
                        <span key={req.label} className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${req.met ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/5 text-rose-500/30 border-rose-500/10'}`}>
                          {req.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {isLogin && (
                  <div className="flex justify-between items-center px-1 -mt-1">
                    <label className="flex items-center gap-2 cursor-pointer grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all">
                       <input type="checkbox" className="h-3 w-3 rounded border-col bg-ter accent-primary-500" />
                       <span className="text-[9px] font-black text-sec uppercase tracking-widest">Stay Logged In</span>
                    </label>
                    <Link to="/forgot-password" className="text-[9px] font-black text-primary-500 uppercase tracking-widest hover:text-primary-400 transition-colors">
                      Forgot Password?
                    </Link>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (!isLogin && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,8}$/.test(password))}
                  className="btn-primary h-14 mt-4 disabled:opacity-30 disabled:grayscale transition-all shadow-[0_10px_30px_rgba(59,130,246,0.15)] flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest"
                >
                  {loading ? 'Processing Clearances...' : (
                    <>
                      <span>{isLogin ? 'Establish Session' : 'Register Operator'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-10 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-col"></div></div>
                <span className="relative px-6 text-[9px] font-black text-sec uppercase bg-main tracking-[0.4em]">Fast Track Integration</span>
              </div>

              <a
                href={`${(() => {
                  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                  const SOCKET_URL = isLocal ? 'http://localhost:5007' : 'https://api.subhajitbag.in';
                  return SOCKET_URL;
                })()}/api/auth/github`}
                className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl border border-col bg-ter hover:bg-sec hover:border-primary-500 transition-all font-black text-[10px] uppercase tracking-widest group shadow-sm overflow-hidden relative"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-primary-500 -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                <GithubIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span>Continue with GitHub Authority</span>
              </a>

              <div className="mt-10 text-center">
                 <p className="text-[10px] text-sec font-bold uppercase tracking-widest mb-4 opacity-50">
                    {isLogin ? "New to the Operational Grid?" : 'Already have an Operational Profile?'}
                 </p>
                <button 
                  type="button" 
                  onClick={() => { setIsLogin(!isLogin); setError(null); }}
                  className="w-full py-4 rounded-xl border border-dotted border-col text-primary-500 hover:border-primary-500 hover:bg-primary-500/5 transition-all font-black text-[11px] uppercase tracking-widest"
                >
                  {isLogin ? 'Initiate Node Creation' : 'Acknowledge Clearance'}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
