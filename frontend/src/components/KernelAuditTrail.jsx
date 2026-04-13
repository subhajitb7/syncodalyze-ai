import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, FolderPlus, UserPlus, Fingerprint, Lock, 
  Trash2, ShieldCheck, Database, History, ChevronRight, 
  Clock, Server, Globe, Cpu, AlertCircle, Loader2,
  Box, Users, FileCode, CheckCircle2, Info
} from 'lucide-react';

// Native alternative for date-fns helpers
const formatDate = (date, pattern) => {
  const d = new Date(date);
  if (pattern === 'HH:mm:ss') {
    return d.toISOString().split('T')[1].split('.')[0];
  }
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isToday = (date) => {
  const d = new Date(date);
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

const isYesterday = (date) => {
  const d = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.getDate() === yesterday.getDate() &&
         d.getMonth() === yesterday.getMonth() &&
         d.getFullYear() === yesterday.getFullYear();
};

const KernelAuditTrail = ({ teamId = null }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = teamId 
        ? `/api/activity/team/${teamId}?page=${page}`
        : `/api/activity/personal?page=${page}`;
      
      const { data } = await axios.get(url);
      setLogs(data.logs);
      setTotalPages(data.pages);
    } catch (err) {
      console.error('Audit retrieval failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [teamId, page]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'PROJECT_CREATED': return <FolderPlus className="h-4 w-4 text-primary-500" />;
      case 'PROJECT_DELETED': return <Trash2 className="h-4 w-4 text-rose-500" />;
      case 'TEAM_CREATED': return <Box className="h-4 w-4 text-purple-500" />;
      case 'MEMBER_INVITED': return <UserPlus className="h-4 w-4 text-amber-500" />;
      case 'MEMBER_JOINED': return <Users className="h-4 w-4 text-emerald-500" />;
      case 'MEMBER_REMOVED': return <ShieldCheck className="h-4 w-4 text-rose-500" />;
      case 'TEAM_LINK_PROJECT': return <Database className="h-4 w-4 text-primary-400" />;
      case 'ANALYSIS_STARTED': return <Cpu className="h-4 w-4 text-indigo-500" />;
      case 'ANALYSIS_COMPLETED': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'LOGIN_SUCCESS': return <Fingerprint className="h-4 w-4 text-emerald-400" />;
      case 'CREDENTIALS_ROTATED': return <Lock className="h-4 w-4 text-amber-500" />;
      default: return <Zap className="h-4 w-4 text-sec" />;
    }
  };

  const getDayHeading = (date) => {
    const d = new Date(date);
    if (isToday(d)) return 'ACTIVE_CYCLE / TODAY';
    if (isYesterday(d)) return 'ARCHIVE_CYCLE / YESTERDAY';
    return `ARCHIVE_CYCLE / ${formatDate(d, 'dd MMM yyyy').toUpperCase()}`;
  };

  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    const dateKey = new Date(log.createdAt).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {});

  if (loading && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center py-20 grayscale opacity-40">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Synchronizing Audit Trail...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="glass-panel p-20 text-center grayscale opacity-30 border-dashed border-2 border-col flex flex-col items-center justify-center">
        <Server className="h-12 w-12 mb-4" />
        <h3 className="text-xl font-black text-main uppercase tracking-tighter mb-2">Zero Telemetry Detected</h3>
        <p className="text-xs text-sec font-medium italic">Operational logs will manifest here as you navigate the platform and initialize node events.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {Object.entries(groupedLogs).map(([date, dayLogs]) => (
        <div key={date} className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.4em] whitespace-nowrap">
              {getDayHeading(date)}
            </span>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-primary-500/30 to-transparent"></div>
          </div>

          <div className="space-y-3 relative pl-6">
            {/* Vertical Audit Line */}
            <div className="absolute left-[3px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-col via-col to-transparent"></div>

            {dayLogs.map((log, index) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={log._id}
                className="relative group"
              >
                {/* Audit Node Dot */}
                <div className="absolute -left-[27px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-col border-2 border-main group-hover:bg-primary-500 group-hover:border-primary-500/30 transition-all z-10 shadow-[0_0_8px_rgba(0,0,0,0.5)]"></div>

                <div 
                  className={`glass-panel p-4 flex items-center justify-between bg-ter/10 border-col/30 hover:bg-ter/30 hover:border-primary-500/20 transition-all cursor-pointer ${expandedId === log._id ? 'bg-ter/40 border-primary-500/30 ring-1 ring-primary-500/10' : ''}`}
                  onClick={() => setExpandedId(expandedId === log._id ? null : log._id)}
                >
                  <div className="flex items-center gap-5">
                    <div className="h-10 w-10 rounded-xl bg-sec border border-col flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      {getActionIcon(log.action)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-0.5">
                        <span className="text-[10px] font-black text-main uppercase tracking-widest">{log.details}</span>
                        {log.metadata?.repoProvider && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-bold text-sec uppercase tracking-tighter">
                            {log.metadata.repoProvider}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[9px] text-sec font-bold opacity-30 italic">
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {formatDate(new Date(log.createdAt), 'HH:mm:ss')} UTC</span>
                        <span>•</span>
                        <span className="uppercase tracking-widest">{log.action}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${expandedId === log._id ? 'bg-primary-500 text-white rotate-90' : 'text-sec hover:text-main bg-white/5'}`}>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Metadata Inspector (Expanded) */}
                <AnimatePresence>
                  {expandedId === log._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 ml-4 p-5 glass-panel bg-black/40 border-col/50 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                         <div className="space-y-4">
                            <div>
                               <p className="text-[8px] font-black text-sec uppercase tracking-[0.2em] mb-2 opacity-40">Operational Context</p>
                               <div className="flex items-center gap-3 p-3 bg-ter/30 rounded-xl border border-col/50">
                                  <div className="h-6 w-6 rounded-lg bg-main border border-col flex items-center justify-center">
                                     <Globe className="h-3 w-3 text-primary-500" />
                                  </div>
                                  <span className="text-[10px] font-mono text-main tracking-tight italic">{log.ipAddress || 'NODAL_PROXY'}</span>
                               </div>
                            </div>
                            {log.team && (
                              <div>
                                 <p className="text-[8px] font-black text-sec uppercase tracking-[0.2em] mb-2 opacity-40">Affected Node</p>
                                 <div className="flex items-center gap-3 p-3 bg-ter/30 rounded-xl border border-col/50">
                                    <div className="h-6 w-6 rounded-lg bg-main border border-col flex items-center justify-center">
                                       <Box className="h-3 w-3 text-purple-500" />
                                    </div>
                                    <span className="text-[10px] font-black text-main uppercase tracking-widest">{log.team.name}</span>
                                 </div>
                              </div>
                            )}
                         </div>

                         <div className="space-y-4">
                            <div>
                               <p className="text-[8px] font-black text-sec uppercase tracking-[0.2em] mb-2 opacity-40">Technical Payload</p>
                               <pre className="p-4 bg-black/60 rounded-xl border border-col/50 text-[10px] font-mono text-primary-500/80 custom-scrollbar max-h-40 overflow-auto overflow-x-hidden">
                                 {JSON.stringify(log.metadata || {}, null, 2)}
                               </pre>
                            </div>
                         </div>

                         <div className="absolute top-4 right-4 flex items-center gap-2">
                             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Integrity Verified</span>
                         </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-10">
          <button 
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="h-12 px-6 glass-panel flex items-center gap-2 font-black text-[10px] uppercase tracking-widest disabled:opacity-20 hover:border-primary-500 transition-all"
          >
            Prev Cycle
          </button>
          <div className="px-6 py-3 glass-panel text-[10px] font-black text-main bg-ter/30 border-col">
            NODE_PAGE {page} / {totalPages}
          </div>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="h-12 px-6 glass-panel flex items-center gap-2 font-black text-[10px] uppercase tracking-widest disabled:opacity-20 hover:border-primary-500 transition-all"
          >
            Next Cycle
          </button>
        </div>
      )}
    </div>
  );
};

export default KernelAuditTrail;
