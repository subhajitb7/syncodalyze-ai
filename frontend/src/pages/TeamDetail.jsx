import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Users, Trash2, Crown, ShieldCheck, User as UserIcon, FolderOpen, X, UserPlus, MessageSquare, Plus, ChevronRight } from 'lucide-react';

import TeamChatDrawer from '../components/TeamChatDrawer';
import { SocketPubSubContext } from '../context/SocketPubSubContext';
import ConfirmModal from '../components/ConfirmModal';
import KernelAuditTrail from '../components/KernelAuditTrail';

const TeamDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [showLinkProject, setShowLinkProject] = useState(false);
  const [myProjects, setMyProjects] = useState([]);
  const [error, setError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Unified Confirmation State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  const fetchTeam = async () => {
    try {
      const { data } = await axios.get(`/api/teams/${id}`);
      setTeam(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeam(); }, [id]);

  const myRole = team?.members?.find((m) => (m.user?._id || m.user) === user?._id)?.role;
  const canManage = myRole === 'owner' || myRole === 'admin';

  const handleInvite = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await axios.post(`/api/teams/${id}/invite`, { identifier: inviteIdentifier });
      setTeam(data);
      setShowInvite(false);
      setInviteIdentifier('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to invite');
    }
  };

  const handleRemove = (userId) => {
    setConfirmConfig({
      isOpen: true,
      title: "Remove Member?",
      message: "Are you sure you want to remove this member from the team? They will lose access to team projects and chat.",
      onConfirm: async () => {
        try {
          const { data } = await axios.delete(`/api/teams/${id}/members/${userId}`);
          setTeam(data);
        } catch (err) {
          alert(err.response?.data?.message || 'Error');
        }
      }
    });
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { data } = await axios.put(`/api/teams/${id}/members/${userId}/role`, { role: newRole });
      setTeam(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleLinkProject = async (projectId) => {
    try {
      const { data } = await axios.post(`/api/teams/${id}/projects`, { projectId });
      setTeam(data);
      setShowLinkProject(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleRemoveProject = (projectId) => {
    setConfirmConfig({
      isOpen: true,
      title: "Un-link Project?",
      message: "This project will no longer be visible to the team, but it will remain in its owner's personal projects.",
      onConfirm: async () => {
        try {
          const { data } = await axios.delete(`/api/teams/${id}/projects/${projectId}`);
          setTeam(data);
        } catch (err) {
          alert(err.response?.data?.message || 'Error');
        }
      }
    });
  };

  const openLinkProject = async () => {
    try {
      const { data } = await axios.get('/api/projects');
      setMyProjects(data);
      setShowLinkProject(true);
    } catch (err) {
      console.error(err);
    }
  };

  const roleIcon = (role) => {
    if (role === 'owner') return <Crown className="h-3.5 w-3.5 text-yellow-600" />;
    if (role === 'admin') return <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />;
    return <UserIcon className="h-3.5 w-3.5 text-sec" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!team) return <div className="text-center py-20 text-sec font-medium">Team not found.</div>;

  return (
    <div className="min-h-screen grid-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Breadcrumb / Back Link */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link to="/teams" className="flex items-center gap-2 text-sec hover:text-primary-500 font-black uppercase tracking-[0.3em] transition-all text-[9px] group">
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" /> 
            Return to Personnel Hub
          </Link>
        </motion.div>

        {/* Dashboard Header - Tactical Style */}
        <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-10 mb-12">
           <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className="flex-1"
           >
              <div className="flex items-center gap-2 mb-4">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Status: Active_Node</span>
              </div>
              
              <div className="flex items-center gap-6 mb-4">
                 <div className="h-16 w-16 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-inner">
                    <Users className="h-8 w-8 text-purple-600" />
                 </div>
                 <div>
                    <h1 className="text-4xl font-black text-main tracking-tighter sm:text-5xl leading-[0.9]">
                       Unit: <span className="text-primary-500">{team.name}</span>
                    </h1>
                 </div>
              </div>

              <div className="max-w-2xl px-4 py-3 bg-ter/30 border-l-2 border-primary-500/30 rounded-r-xl">
                 <p className="text-[10px] font-black text-sec uppercase tracking-[0.2em] mb-1 opacity-60">Operational Directive</p>
                 <p className="text-sm text-sec font-medium leading-relaxed italic">
                    {team.description || 'Secure collaborative cluster for encrypted technical analysis and team-based review cycles.'}
                 </p>
              </div>
           </motion.div>

           {/* Command Suite */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-wrap items-center gap-3 p-3 bg-ter/30 rounded-3xl backdrop-blur-3xl shadow-2xl"
            >
              {myRole && (
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="h-12 w-12 flex items-center justify-center bg-ter hover:bg-primary-500/10 border border-col rounded-xl text-sec hover:text-primary-500 transition-all group"
                  title="Secure Communications"
                >
                  <MessageSquare className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </button>
              )}
              {canManage && (
                <>
                  <button 
                    onClick={() => setShowInvite(true)} 
                    className="btn-primary flex items-center gap-2 h-12 px-6 shadow-xl shadow-primary-500/20 text-[11px] font-black uppercase tracking-wider"
                  >
                    <UserPlus className="h-4 w-4" /> Recruit Specialist
                  </button>
                  <button 
                    onClick={openLinkProject} 
                    className="bg-ter hover:bg-ter/80 text-main border border-col flex items-center gap-2 h-12 px-6 rounded-xl transition-all text-[11px] font-black uppercase tracking-wider hover:border-primary-500/30"
                  >
                    <FolderOpen className="h-4 w-4 text-primary-500" /> Link Asset
                  </button>
                </>
              )}
           </motion.div>
        </div>

        {/* Tactical Grid: Members and Assets */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
           
           {/* Section 1: Authorized Operators (3/5) */}
           <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-[11px] font-black text-main uppercase tracking-[0.4em] flex items-center gap-3">
                    Authorized Operators <span className="h-5 px-2 bg-primary-500/10 border border-primary-500/20 text-primary-500 rounded flex items-center justify-center tracking-normal text-[10px]">{team.members?.length || 0}</span>
                 </h2>
                 <div className="h-[1px] flex-1 mx-6 bg-gradient-to-r from-col/30 to-transparent"></div>
              </div>

              <motion.div 
                 variants={{
                   hidden: { opacity: 0 },
                   visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                 }}
                 initial="hidden"
                 animate="visible"
                 className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                 {team.members?.map((m) => {
                    const isUser = (m.user?._id || m.user) === user?._id;
                    return (
                      <motion.div 
                        variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                        key={m.user?._id || m.user || Math.random()} 
                        className="glass-panel p-5 flex items-center gap-6 bg-ter/30 border-col/50 hover:border-primary-500/30 group transition-all relative overflow-hidden"
                      >
                         {/* Avatar Node */}
                         <div className="h-14 w-14 rounded-2xl bg-sec border border-col flex items-center justify-center relative shadow-2xl overflow-hidden group-hover:bg-ter transition-colors shrink-0">
                            <span className="text-base font-black text-primary-500">{m.user?.name?.charAt(0).toUpperCase() || '?'}</span>
                            {!isUser && (
                              <div className="absolute top-1.5 right-1.5 h-3 w-3 flex items-center justify-center">
                                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500/40 to-transparent"></div>
                         </div>

                         {/* Identity Stack */}
                         <div className="flex flex-col gap-2 min-w-0 flex-1 transition-all">
                            <div className="flex items-center gap-3">
                               <span className="text-sm font-black text-main group-hover:text-primary-500 transition-colors tracking-tight uppercase whitespace-nowrap">{m.user?.name || 'Unknown'}</span>
                               {m.role === 'owner' ? (
                                 <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                               ) : m.role === 'admin' ? (
                                 <ShieldCheck className="h-3.5 w-3.5 text-primary-500 shrink-0" />
                               ) : null}
                            </div>
                            
                             <div className="flex flex-col gap-1.5">
                               <div className="flex items-center gap-2">
                                 {canManage && m.role !== 'owner' && !isUser ? (
                                   <div className="relative group/role">
                                     <select
                                       value={m.role}
                                       onChange={(e) => handleRoleChange(m.user?._id || m.user || m._id, e.target.value)}
                                       className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded border leading-none bg-main/40 cursor-pointer hover:border-primary-500 transition-all outline-none appearance-none pr-6 ${
                                         m.role === 'admin' ? 'text-primary-600 border-primary-500/20' : 'text-sec/60 border-col'
                                       }`}
                                     >
                                       <option value="member">MEMBER</option>
                                       <option value="admin">ADMIN</option>
                                     </select>
                                     <ChevronRight className="h-2.5 w-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-sec/40 rotate-90" />
                                   </div>
                                 ) : (
                                   <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded border leading-none shrink-0 ${
                                     m.role === 'owner' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                     m.role === 'admin' ? 'bg-primary-500/10 text-primary-600 border-primary-500/20' :
                                     'bg-sec/50 text-sec/60 border-col'
                                   }`}>
                                     {m.role || 'Member'}
                                   </span>
                                 )}
                               </div>
                               <span className="text-[10px] text-sec font-bold opacity-30 italic break-all tracking-tighter leading-none">
                                 {m.user?.email || 'OFFLINE_NODE'}
                               </span>
                            </div>
                         </div>

                         {/* Minimalist Removal Action */}
                         {canManage && m.role !== 'owner' && !isUser && (
                           <button 
                             onClick={() => handleRemove(m.user?._id || m.user || m._id)}
                             className="absolute right-4 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-sec/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-rose-500/20"
                             title="Revoke Permissions"
                           >
                             <Trash2 className="h-4.5 w-4.5" />
                           </button>
                         )}
                      </motion.div>
                    );
                 })}
              </motion.div>
           </div>

           {/* Section 2: Integrated Asset Cluster (2/5) */}
           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-[11px] font-black text-main uppercase tracking-[0.4em] flex items-center gap-3">
                    Asset Cluster <span className="text-sec opacity-20 font-medium">/ SYNC_ACTIVE</span>
                 </h2>
                 <div className="h-[1px] flex-1 ml-6 bg-gradient-to-r from-col/30 to-transparent"></div>
              </div>

              <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="space-y-3"
              >
                 {!team.projects || team.projects.length === 0 ? (
                    <div className="glass-panel p-16 text-center border-dashed border-2 border-col grayscale opacity-40">
                       <FolderOpen className="h-10 w-10 mx-auto text-sec mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-main">Zero Assets Linked</p>
                       <p className="text-[9px] font-bold text-sec italic mt-1">Pending terminal integration...</p>
                    </div>
                 ) : (
                    team.projects.map((p) => (
                      <Link key={p._id} to={`/projects/${p._id}`}
                        className="glass-panel p-5 box-border flex items-center justify-between bg-ter/30 border-col/50 hover:border-primary-500/50 hover:bg-sec group transition-all"
                      >
                         <div className="flex items-center gap-5">
                            <div className="h-12 w-12 bg-sec/50 border border-col/50 rounded-2xl flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-all shadow-lg overflow-hidden relative">
                               <FolderOpen className="h-5 w-5 text-sec group-hover:text-white relative z-10" />
                               <div className="absolute inset-0 bg-primary-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                            </div>
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-black text-sm text-main group-hover:text-primary-500 transition-colors tracking-tight">{p.name}</h3>
                                  <span className="text-[9px] font-black text-primary-500 px-1.5 py-0.5 bg-primary-500/10 rounded uppercase tracking-tighter">{p.language}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <span className="text-[9px] text-sec font-bold opacity-30 italic">Cluster: {p.owner?.name || 'ROOT'}</span>
                                  <div className="h-1 w-1 rounded-full bg-col/50"></div>
                                  <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest flex items-center gap-1">
                                     <ShieldCheck className="h-2.5 w-2.5" /> High Integrity
                                  </span>
                                </div>
                            </div>
                         </div>
                         
                         <div className="flex items-center gap-3">
                            {canManage && (
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveProject(p._id); }}
                                className="h-9 w-9 flex items-center justify-center text-sec hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                title="Sever Asset Link"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            <div className="h-8 w-8 rounded-xl border border-col flex items-center justify-center group-hover:border-primary-500/50 group-hover:bg-primary-500/5 transition-all">
                               <ArrowLeft className="h-4 w-4 rotate-180 text-sec group-hover:text-primary-500" />
                            </div>
                         </div>
                      </Link>
                    ))
                 )}
              </motion.div>
           </div>
        </div>

      <TeamChatDrawer
        teamId={id}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Optimized Layout for Modals */}
      <AnimatePresence>
        {showInvite && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel w-full max-w-xl p-0 relative shadow-[0_50px_100px_rgba(0,0,0,0.6)] border-col"
            >
              <div className="p-8 border-b border-col bg-ter/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500"></div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em]">Authorized Personnel Intake</span>
                  <button onClick={() => { setShowInvite(false); setError(null); }} className="p-2 text-sec hover:text-main transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <h2 className="text-3xl font-black text-main tracking-tighter">Recruit <span className="text-primary-500">Specialist</span></h2>
              </div>
              
              <form onSubmit={handleInvite} className="p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-sec uppercase tracking-widest px-1">Network Identifier (Email / ID)</label>
                  <input 
                    type="text" value={inviteIdentifier} onChange={(e) => setInviteIdentifier(e.target.value)} 
                    required className="glass-input h-14 w-full font-black text-lg tracking-tight" placeholder="specialist@sync.internal or NODE_H_8829" 
                  />
                  <p className="text-[9px] text-sec/40 font-bold uppercase tracking-widest px-1 italic">Identity verification required before clearance grant.</p>
                </div>
                {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest">{error}</div>}
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 btn-primary h-14 font-black uppercase tracking-widest px-8">Dispatch Request</button>
                  <button type="button" onClick={() => setShowInvite(false)} className="px-10 btn-secondary h-14 font-black uppercase tracking-widest border-col">Abort</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showLinkProject && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="glass-panel w-full max-w-xl p-0 relative shadow-[0_50px_100px_rgba(0,0,0,0.6)] border-col"
             >
                <div className="p-8 border-b border-col bg-ter/30 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-primary-500 to-purple-500"></div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em]">Asset Cluster Configuration</span>
                    <button onClick={() => setShowLinkProject(false)} className="p-2 text-sec hover:text-main transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <h2 className="text-3xl font-black text-main tracking-tighter">Link <span className="text-purple-500">Repository Cluster</span></h2>
                </div>

                <div className="p-8">
                  {myProjects.length === 0 ? (
                    <div className="py-20 text-center grayscale opacity-40">
                       <FolderOpen className="h-12 w-12 mx-auto mb-4" />
                       <p className="text-xs font-black uppercase tracking-widest">No primary assets detected.</p>
                       <p className="text-[10px] font-medium italic mt-1">Please initialize a project repository first.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                      {myProjects.map((p) => (
                        <button key={p._id} onClick={() => handleLinkProject(p._id)}
                          className="w-full text-left p-4 bg-ter/30 border border-col rounded-2xl hover:border-primary-500/50 hover:bg-sec transition-all flex items-center gap-4 group">
                          <div className="h-10 w-10 bg-sec border border-col rounded-xl flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-all shadow-inner">
                             <FolderOpen className="h-4 w-4 text-sec group-hover:text-white" />
                          </div>
                          <div>
                            <p className="font-black text-sm text-main group-hover:text-primary-500 transition-colors uppercase tracking-tight">{p.name}</p>
                            <p className="text-[9px] text-sec font-bold uppercase tracking-widest opacity-40">{p.language} • INTEGRITY_VERIFIED</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

         {/* Kernel Audit Trail - Scoped to Team */}
         <div className="mt-16 space-y-6">
            <div className="flex items-center justify-between px-2">
               <h2 className="text-[11px] font-black text-main uppercase tracking-[0.4em] flex items-center gap-3">
                  Kernel Audit Trail <span className="text-sec opacity-20 font-medium">/ NODE_SPECIFIC</span>
               </h2>
               <div className="h-[1px] flex-1 mx-6 bg-gradient-to-r from-col/30 to-transparent"></div>
            </div>
            
            <div className="glass-panel overflow-hidden border-col shadow-2xl">
               <div className="p-8 border-b border-col bg-ter/30 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-500/10 rounded-lg"><History className="h-5 w-5 text-primary-500" /></div>
                      <span className="text-[10px] font-black text-main uppercase tracking-widest">Chronological Operational Telemetry</span>
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/5 border border-primary-500/10 rounded-full">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse"></div>
                      <span className="text-[8px] font-black text-primary-500 uppercase tracking-widest italic">Live Feed Synchronized</span>
                   </div>
               </div>
               <div className="p-8">
                  <KernelAuditTrail teamId={id} />
               </div>
            </div>
         </div>
      </div>
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />
    </div>
  );
};

export default TeamDetail;
