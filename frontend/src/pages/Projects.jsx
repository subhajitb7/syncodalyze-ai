import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderOpen, Plus, Trash2, FileCode, X, 
  ChevronRight, LayoutGrid, List, Search as SearchIcon,
  Box, Zap, Calendar, User, ArrowUpRight, Filter
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ConfirmModal from '../components/ConfirmModal';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [form, setForm] = useState({ name: '', description: '', language: 'javascript', repoUrl: '' });

  // Deletion State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const fetchProjects = async () => {
    try {
      const { data } = await axios.get('/api/projects');
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === 'true') {
      setShowModal(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/projects', form);
      setShowModal(false);
      setForm({ name: '', description: '', language: 'javascript', repoUrl: '' });
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTrigger = (id) => {
    setProjectToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await axios.delete(`/api/projects/${projectToDelete}`);
      fetchProjects();
      setProjectToDelete(null);
    } catch (err) {
      console.error(err);
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
        <p className="mt-4 text-[10px] font-black text-sec uppercase tracking-[0.3em] animate-pulse">Syncing Repositories...</p>
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
              <Box className="h-3 w-3" /> Technical Infrastructure
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-main sm:text-5xl">
              Code <span className="text-primary-500">Repositories</span>
            </h1>
            <p className="text-sec font-medium mt-2 max-w-xl">
              Centralized management of your technical capital. Connect, analyze, and monitor {projects.length} distinct workstreams.
            </p>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-wrap items-center gap-3"
          >
            <div className="flex items-center p-1 bg-ter/50 border border-col rounded-xl mr-2">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-sec hover:bg-sec/10'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-sec hover:bg-sec/10'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <SearchBar />
            <button 
              onClick={() => setShowModal(true)} 
              className="btn-primary flex items-center gap-2 h-11 px-6 shadow-xl shadow-primary-500/20"
            >
              <Plus className="h-4 w-4" /> New Repository
            </button>
          </motion.div>
        </div>

        {/* Action / Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Network Active', val: projects.length, icon: Box, col: 'text-primary-500' },
            { label: 'Cloud Versions', val: projects.reduce((acc, p) => acc + (p.currentVersion || 1), 0), icon: Zap, col: 'text-amber-500' },
            { label: 'Files Tracked', val: projects.reduce((acc, p) => acc + (p.fileCount || 0), 0), icon: FileCode, col: 'text-emerald-500' },
            { label: 'System Uptime', val: '99.9%', icon: Calendar, col: 'text-purple-500' },
          ].map((s, i) => (
            <motion.div 
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-4 flex items-center gap-4 bg-ter/30 border-col/50 group hover:border-primary-500/30 transition-all cursor-default"
            >
              <div className={`p-2 rounded-xl bg-sec/50 border border-col group-hover:bg-primary-500/10 transition-colors`}>
                <s.icon className={`h-4 w-4 ${s.col}`} />
              </div>
              <div>
                 <p className="text-[9px] font-black text-sec uppercase tracking-widest">{s.label}</p>
                 <p className="text-xl font-black text-main">{s.val}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {projects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-20 text-center flex flex-col items-center justify-center grayscale opacity-50 border-dashed border-2 border-col"
          >
            <div className="h-20 w-20 bg-ter rounded-[2rem] flex items-center justify-center mb-6">
               <FolderOpen className="h-10 w-10 text-sec" />
            </div>
            <h3 className="text-2xl font-black text-main tracking-tighter mb-2">Zero Indexed Nodes</h3>
            <p className="text-sec font-medium max-w-sm mb-8 leading-relaxed text-sm italic">
              Awaiting first transmission. Synchronize a local repository or connect a cloud-based workstream to initialize indexing.
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary px-8 h-12 shadow-2xl">Initialize First Node</button>
          </motion.div>
        ) : (
          /* Projects Grid/List */
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "flex flex-col gap-4"}
          >
            {projects.map((proj) => (
              <motion.div key={proj._id} variants={itemVariants}>
                <Link
                  to={`/projects/${proj._id}`}
                  className={`glass-panel p-0 group overflow-hidden border-col transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex ${
                    viewMode === 'grid' ? 'flex-col min-h-[280px]' : 'flex-row items-center p-4 h-24'
                  }`}
                >
                  <div className={`p-6 flex-1 flex flex-col ${viewMode === 'grid' ? '' : 'p-0 flex-row items-center gap-6 w-full'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                         <div className="relative">
                           <div className="h-12 w-12 bg-primary-500/10 rounded-2xl flex items-center justify-center border border-primary-500/20 group-hover:bg-primary-500/20 transition-all duration-500">
                             <FolderOpen className="h-6 w-6 text-primary-500" />
                           </div>
                         </div>
                        <div>
                          <h3 className="font-black text-lg text-main group-hover:text-primary-500 transition-colors tracking-tight leading-none mb-1.5">{proj.name}</h3>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-primary-500 px-2 py-0.5 bg-primary-500/10 rounded border border-primary-500/20 uppercase tracking-widest">{proj.language}</span>
                             <span className="text-[9px] font-bold text-sec uppercase tracking-widest opacity-40">v{proj.currentVersion || 1}.0-Stable</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); handleDeleteTrigger(proj._id); }}
                        className="p-2 text-sec hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 -mr-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className={`text-xs text-sec font-medium leading-relaxed group-hover:text-main transition-colors ${
                      viewMode === 'grid' ? 'mb-8 line-clamp-3' : 'max-w-md truncate'
                    }`}>
                      {proj.description || 'System generated container for technical assets. No custom description provided by operator.'}
                    </p>

                    <div className={`mt-auto ${viewMode === 'grid' ? 'pt-6 border-t border-col/50 flex flex-col gap-4' : 'ml-auto flex items-center gap-8'}`}>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black text-sec uppercase tracking-[0.2em] mb-0.5 opacity-50">Stored Files</span>
                               <div className="flex items-center gap-1.5 font-black text-main text-xs">
                                  <FileCode className="h-3 w-3 text-emerald-500" /> {proj.fileCount || 0}
                               </div>
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black text-sec uppercase tracking-[0.2em] mb-0.5 opacity-50">Activity</span>
                               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                            </div>
                         </div>
                         <div className="flex -space-x-1.5">
                            {[1, 2].map(i => (
                              <div key={i} className="h-6 w-6 rounded-lg bg-ter border border-col flex items-center justify-center text-[8px] font-black text-sec shadow-sm">
                                {proj.owner?.name?.charAt(0).toUpperCase() || 'S'}
                              </div>
                            ))}
                         </div>
                      </div>
                      {viewMode === 'grid' && (
                        <div className="flex items-center justify-between text-[10px] text-sec font-bold opacity-30 group-hover:opacity-60 transition-opacity uppercase tracking-widest">
                           <div className="flex items-center gap-2">
                             <Calendar className="h-3 w-3" /> {new Date(proj.createdAt).toLocaleDateString()}
                           </div>
                           <ArrowUpRight className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Create Project Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[150] p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-panel w-full max-w-xl p-0 relative shadow-2xl overflow-hidden border-col"
              >
                <div className="p-8 border-b border-col bg-ter/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Initialize Node</span>
                    <button onClick={() => setShowModal(false)} className="p-2 text-sec hover:text-main transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <h2 className="text-3xl font-black text-main tracking-tighter">New <span className="text-primary-500">Repository</span></h2>
                </div>

                <form onSubmit={handleCreate} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-sec uppercase tracking-[0.2em] px-1">Identifier</label>
                      <input 
                        type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} 
                        required className="glass-input h-12 w-full font-bold" placeholder="sync-engine-v2" 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-sec uppercase tracking-[0.2em] px-1">Architecture</label>
                      <select 
                        value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} 
                        className="glass-input h-12 w-full font-bold appearance-none cursor-pointer"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="typescript">TypeScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="go">Go</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-sec uppercase tracking-[0.2em] px-1">Deep Description</label>
                    <textarea 
                      value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} 
                      className="glass-input h-28 w-full font-medium p-4 resize-none" placeholder="Provide technical context for the AI engine..." 
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-sec uppercase tracking-[0.2em] px-1">External Origin (URL)</label>
                    <input 
                      type="url" value={form.repoUrl} onChange={(e) => setForm({ ...form, repoUrl: e.target.value })} 
                      className="glass-input h-12 w-full font-medium" placeholder="https://github.com/organization/binary" 
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 btn-primary h-14 font-black uppercase tracking-widest shadow-xl shadow-primary-500/20">Finalize Encryption</button>
                    <button type="button" onClick={() => setShowModal(false)} className="px-8 btn-secondary h-14 font-black uppercase tracking-widest border-col text-sec">Abort</button>
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
          title="Purge Node?"
          message="This will permanently delete the repository and all synchronized analysis data. This action is immutable."
        />
      </div>
    </div>
  );
};

export default Projects;
