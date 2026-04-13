import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, ShieldCheck, Zap } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await axios.post('/api/auth/forgot-password', { email });
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
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
      
      {/* Left Column: Recovery Sidebar */}
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
            Account Integrity <br />
            <span className="text-primary-500">Recovery Hub</span>
          </h2>
          
          <div className="flex flex-col gap-4 max-w-sm mx-auto">
             <div className="flex items-start gap-4 p-4 bg-ter/30 border border-col rounded-2xl backdrop-blur-sm">
                <ShieldCheck className="h-5 w-5 text-emerald-500 mt-1" />
                <div className="text-left">
                   <p className="text-[10px] font-black text-sec uppercase tracking-widest mb-1">Clearance Protocol</p>
                   <p className="text-xs text-sec font-medium">Verified identity recovery via encrypted one-time verification hashes.</p>
                </div>
             </div>
          </div>
        </motion.div>
        
        <div className="absolute bottom-10 left-10 flex flex-col gap-1">
           <p className="text-[10px] font-black text-sec uppercase tracking-[0.4em]">Protocol: RESET_CLEARANCE_V4</p>
           <p className="text-[8px] font-bold text-sec opacity-40 uppercase tracking-[0.2em]">Build Revision: 4.8.2.SYNC</p>
        </div>
      </div>

      {/* Right Column: Sovereign Recovery Portal */}
      <div className="w-full lg:w-[600px] xl:w-[700px] relative flex flex-col items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-lg glass-panel p-8 sm:p-14 relative overflow-hidden text-center lg:text-left">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
           
           <motion.div
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="w-full relative z-10"
           >
              <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-500/20 bg-primary-500/5 mb-6">
                   <div className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse"></div>
                   <span className="text-[10px] font-black tracking-widest text-primary-500 uppercase">
                      Integrity Recovery Protocol
                   </span>
                </div>
                
                <h3 className="text-4xl font-black text-main tracking-tighter mb-4 leading-tight">
                   Initialize Recovery
                </h3>
                <p className="text-sm text-sec font-medium leading-relaxed opacity-60">
                   Enter your <span className="text-primary-500 font-black">Network Identifier</span> to trigger a high-integrity clearance reset code.
                </p>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl mb-6 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="group flex flex-col gap-2">
                  <label className="text-[10px] font-black text-sec uppercase tracking-widest px-1 group-focus-within:text-primary-500 transition-colors">Registered Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sec/40 group-focus-within:text-primary-500 transition-colors" />
                    <input 
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
                      required className="glass-input !pl-14 h-14 w-full" placeholder="identity@sync.io" 
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="btn-primary h-14 mt-2 disabled:opacity-30 disabled:grayscale transition-all shadow-[0_10px_30px_rgba(59,130,246,0.15)] flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest"
                >
                  {loading ? 'Dispatched Hash...' : (
                    <>
                      <span>Transmit Reset Hash</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-10 text-center">
                <Link to="/auth" className="w-full py-4 rounded-xl border border-dotted border-col text-sec hover:border-primary-500 hover:text-primary-500 hover:bg-primary-500/5 transition-all font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2">
                  <ArrowLeft className="h-4 w-4" /> Return to Clearance Portal
                </Link>
              </div>
           </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
