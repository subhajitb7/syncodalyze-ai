import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, X, Trash2, FolderOpen, Crown, 
  ShieldCheck, User as UserIcon, UsersRound, 
  ChevronRight, ArrowUpRight, Search as SearchIcon,
  Shield, Network, Zap, Calendar, Activity
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ConfirmModal from '../components/ConfirmModal';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  // Deletion State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);

  const fetchTeams = async () => {
    try {
      const { data } = await axios.get('/api/teams');
      setTeams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/teams', form);
      setShowCreate(false);
      setForm({ name: '', description: '' });
      fetchTeams();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleDeleteTrigger = (id) => {
    setTeamToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!teamToDelete) return;
    try {
      await axios.delete(`/api/teams/${teamToDelete}`);
      setTeams(teams.filter((t) => t._id !== teamToDelete));
      setTeamToDelete(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black text-sec uppercase tracking-[0.3em] animate-pulse">Establishing Peer Network...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-8">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <div className="flex items-center gap-2 text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mb-3">
              <Network className="h-3 w-3" /> Personnel Sub-system
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-main sm:text-5xl">
              Collaboration <span className="text-primary-500">Units</span>
            </h1>
            <p className="text-sec font-medium mt-2 max-w-xl">
              Govern access, distribute workloads, and monitor operational synergy across {teams.length} distinct engineering clusters.
            </p>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-wrap items-center gap-3"
          >
            <SearchBar />
            <button 
              onClick={() => setShowCreate(true)} 
              className="btn-primary flex items-center gap-2 h-11 px-6 shadow-xl shadow-primary-500/20"
            >
              <UsersRound className="h-4 w-4" /> Initialize Unit
            </button>
          </motion.div>
        </div>

        {/* Units Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Units Active', val: teams.length, icon: Users, col: 'text-purple-500' },
            { label: 'Total Operators', val: teams.reduce((acc, t) => acc + (t.members?.length || 0), 0), icon: Shield, col: 'text-emerald-500' },
            { label: 'Cross-Sync Projects', val: teams.reduce((acc, t) => acc + (t.projects?.length || 0), 0), icon: FolderOpen, col: 'text-primary-500' },
            { label: 'Auth Protocols', val: 'Active', icon: ShieldCheck, col: 'text-amber-500' },
          ].map((s, i) => (
            <motion.div 
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-4 flex items-center gap-4 bg-ter/30 border-col/50 group hover:border-primary-500/30 transition-all cursor-default"
            >
              <div className="p-2 rounded-xl bg-sec/50 border border-col group-hover:bg-primary-500/10 transition-colors">
                <s.icon className={`h-4 w-4 ${s.col}`} />
              </div>
              <div>
                 <p className="text-[9px] font-black text-sec uppercase tracking-widest">{s.label}</p>
                 <p className="text-xl font-black text-main">{s.val}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {teams.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-20 text-center flex flex-col items-center justify-center grayscale opacity-50 border-dashed border-2 border-col"
          >
            <div className="h-20 w-20 bg-ter rounded-[2rem] flex items-center justify-center mb-6 text-sec">
               <Users className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-black text-main tracking-tighter mb-2">Standalone Operator</h3>
            <p className="text-sec font-medium max-w-sm mb-8 leading-relaxed text-sm italic">
              No collaborative nodes detected. Form a cluster to distribute analysis tasks and share intelligence across your organization.
            </p>
            <button onClick={() => setShowCreate(true)} className="btn-primary px-8 h-12 shadow-2xl">Create Intelligence Unit</button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {teams.map((team) => (
              <motion.div key={team._id} variants={itemVariants}>
                <Link
                  to={`/teams/${team._id}`}
                  className="glass-panel p-0 group overflow-hidden border-col transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex flex-col min-h-[260px]"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                           <div className="h-12 w-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-all duration-500">
                             <Users className="h-6 w-6 text-purple-600" />
                           </div>
                           <div className="absolute -top-1 -right-1 h-3 w-3 bg-purple-500 rounded-full border-2 border-main ring-1 ring-purple-500/30 shadow-lg"></div>
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-main group-hover:text-primary-500 transition-colors tracking-tight leading-none mb-1.5">{team.name}</h3>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-purple-600 px-2 py-0.5 bg-purple-500/10 rounded border border-purple-500/20 uppercase tracking-widest">Team Node</span>
                             <span className="text-[9px] font-bold text-sec uppercase tracking-widest opacity-40">{team.members?.length || 0} Connected</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteTrigger(team._id); }}
                        className="p-2 text-sec hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 -mr-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="text-xs text-sec font-medium leading-relaxed group-hover:text-main transition-colors mb-8 line-clamp-2">
                      {team.description || 'Secure collaborative cluster for encrypted technical analysis and team-based review cycles.'}
                    </p>

                    <div className="mt-auto pt-6 border-t border-col/50 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black text-sec uppercase tracking-[0.2em] mb-1 opacity-50">Authorized Members</span>
                               <div className="flex -space-x-1.5">
                                  {team.members?.slice(0, 4).map((m, i) => (
                                    <div key={i} className="h-6 w-6 rounded-lg bg-ter border border-col flex items-center justify-center text-[8px] font-black text-sec shadow-sm ring-2 ring-main">
                                      {m.user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                  ))}
                                  {team.members?.length > 4 && (
                                    <div className="h-6 w-6 rounded-lg bg-primary-500 text-white border border-primary-500 flex items-center justify-center text-[7px] font-black tracking-tighter ring-2 ring-main">
                                      +{team.members.length - 4}
                                    </div>
                                  )}
                               </div>
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black text-sec uppercase tracking-[0.2em] mb-1 opacity-50">Shared Infra</span>
                               <div className="flex items-center gap-1.5 font-black text-main text-xs">
                                  <FolderOpen className="h-3 w-3 text-primary-500" /> {team.projects?.length || 0}
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Synced</span>
                         </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-sec font-bold opacity-30 group-hover:opacity-60 transition-opacity uppercase tracking-widest">
                         <div className="flex items-center gap-2">
                           <Calendar className="h-3 w-3" /> {new Date(team.createdAt).toLocaleDateString()}
                         </div>
                         <ArrowUpRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Create Team Modal */}
        <AnimatePresence>
          {showCreate && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[150] p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-panel w-full max-w-xl p-0 relative shadow-2xl overflow-hidden border-col"
              >
                <div className="p-8 border-b border-col bg-ter/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Initialize Cluster</span>
                    <button onClick={() => setShowCreate(false)} className="p-2 text-sec hover:text-main transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <h2 className="text-3xl font-black text-main tracking-tighter">New <span className="text-primary-500">Personnel Unit</span></h2>
                </div>

                <form onSubmit={handleCreate} className="p-8 space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-sec uppercase tracking-[0.2em] px-1">Unit Assignment Name</label>
                    <input 
                      type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} 
                      required className="glass-input h-14 w-full font-black text-lg tracking-tight" placeholder="ALPHA_CLUSTER_SYNC" 
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-sec uppercase tracking-[0.2em] px-1">Operational Directive</label>
                    <textarea 
                      value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} 
                      className="glass-input h-32 w-full font-medium p-4 resize-none" placeholder="Define the primary focus and access constraints for this unit..." 
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 btn-primary h-14 font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 px-8">Authorize Formation</button>
                    <button type="button" onClick={() => setShowCreate(false)} className="px-8 btn-secondary h-14 font-black uppercase tracking-widest border-col text-sec">Abort</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <ConfirmModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Deconstruct Unit?"
          message="This will dissolve the personnel cluster and revoke all shared infrastructure access. This action cannot be reversed."
        />
      </div>
    </div>
  );
};

export default Teams;
