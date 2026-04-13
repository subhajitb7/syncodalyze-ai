import { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckSquare, MessageSquare, FileUp, Sparkles, Inbox, Trash2, Info, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const NotificationBell = () => {
  const { socket } = useContext(AuthContext);
  const [data, setData] = useState({ notifications: [], unreadCount: 0 });
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data: res } = await axios.get('/api/notifications');
      setData(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    if (socket) {
      const handleLiveNotif = (notification) => {
        setData((prev) => ({
          notifications: [notification, ...prev.notifications],
          unreadCount: prev.unreadCount + 1,
        }));
      };
      socket.on('liveNotification', handleLiveNotif);
      return () => {
        clearInterval(interval);
        socket.off('liveNotification', handleLiveNotif);
      };
    }
    return () => clearInterval(interval);
  }, [socket]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClick = async (notif) => {
    if (!notif.read) {
      try {
        await axios.put(`/api/notifications/${notif._id}/read`);
      } catch (err) {
        console.error(err);
      }
    }
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'review_complete': return <CheckSquare className="h-4 w-4 text-emerald-500" />;
      case 'new_comment': return <MessageSquare className="h-4 w-4 text-primary-500" />;
      case 'file_updated': return <FileUp className="h-4 w-4 text-amber-500" />;
      case 'project_created': return <Sparkles className="h-4 w-4 text-purple-500" />;
      default: return <Info className="h-4 w-4 text-sec" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2.5 rounded-xl transition-all border border-col bg-ter/50 hover:bg-primary-500/10 group ${
          open ? 'border-primary-500 ring-4 ring-primary-500/5 text-primary-500' : 'text-sec hover:text-primary-500'
        }`}
      >
        <Bell className={`h-4 w-4 ${open ? 'fill-current opacity-20' : ''}`} />
        {data.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-[9px] items-center justify-center text-white font-black">
              {data.unreadCount > 9 ? '9+' : data.unreadCount}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(10px)' }}
            className="absolute right-0 mt-4 w-[420px] glass-panel shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] z-[150] overflow-hidden border-col bg-main/90 backdrop-blur-3xl"
          >
            {/* Hub Header - Tactical Style */}
            <div className="p-5 border-b border-primary-500/10 bg-ter/30 flex items-center justify-between relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>
               <div>
                 <div className="flex items-center gap-2 mb-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse"></div>
                    <h3 className="text-[10px] font-black text-main uppercase tracking-[0.3em]">Intelligence Hub</h3>
                 </div>
                 <p className="text-[9px] text-sec font-bold opacity-60 tracking-wider">Awaiting Attention • {data.unreadCount} Concurrent Signals</p>
               </div>
               <button 
                  onClick={handleMarkAllRead} 
                  className="px-3 py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/20 text-[9px] font-black text-primary-500 uppercase tracking-widest hover:bg-primary-500/20 transition-all flex items-center gap-2 group"
                >
                  <Trash2 className="h-3 w-3 group-hover:rotate-12 transition-transform" />
                  Clear All
                </button>
            </div>

            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              {data.notifications.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-center p-8">
                   <div className="relative mb-6">
                      <div className="absolute inset-0 bg-primary-500/20 blur-2xl rounded-full"></div>
                      <div className="relative h-20 w-20 bg-ter/50 border border-col rounded-3xl flex items-center justify-center">
                         <Inbox className="h-10 w-10 text-sec/20" />
                      </div>
                   </div>
                   <h4 className="text-[11px] font-black text-main uppercase tracking-[0.4em] mb-2">Zero Latency</h4>
                   <p className="text-[10px] font-bold text-sec/40 uppercase tracking-widest italic">Status: No incoming transmissions detected.</p>
                </div>
              ) : (
                <div className="divide-y divide-primary-500/10">
                  {data.notifications.slice(0, 15).map((notif, idx) => {
                    const statusColor = 
                      notif.type === 'review_complete' ? 'bg-emerald-500' : 
                      notif.type === 'file_updated' ? 'bg-amber-500' : 
                      notif.type === 'new_comment' ? 'bg-primary-500' : 'bg-sec';
                    
                    return (
                      <motion.button
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        key={notif._id}
                        onClick={() => handleClick(notif)}
                        className={`w-full text-left p-5 hover:bg-primary-500/[0.04] transition-all flex gap-5 group relative overflow-hidden ${!notif.read ? 'bg-primary-500/[0.02]' : ''}`}
                      >
                        {/* Status Bar Indicator */}
                        {!notif.read && (
                           <div className={`absolute left-0 top-0 w-1 h-full ${statusColor} shadow-[0_0_15px_rgba(var(--status-rgb),0.5)]`}></div>
                        )}
                        
                        <div className={`mt-0.5 h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center transition-all ${
                          !notif.read 
                          ? 'bg-sec/20 border border-col/50 shadow-lg' 
                          : 'bg-ter/30 border border-col/10 grayscale'
                        }`}>
                          {getTypeIcon(notif.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2 pr-4">
                             <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border ${
                               !notif.read ? 'text-primary-500 border-primary-500/20 bg-primary-500/5' : 'text-sec/40 border-col/10'
                             }`}>
                               {notif.type.replace('_', ' ')}
                             </span>
                             <span className="text-[9px] font-bold text-sec opacity-40">
                               {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                          <p className={`text-[11px] leading-relaxed tracking-wide ${!notif.read ? 'text-main font-bold' : 'text-sec font-medium'}`}>
                            {notif.message}
                          </p>
                        </div>

                        {/* Quick Mark as Read (Visual Only for now unless endpoint exists) */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all scale-75 hover:scale-100">
                           <div className="p-2 bg-ter/80 rounded-xl border border-col shadow-xl">
                              <CheckSquare className="h-4 w-4 text-primary-500" />
                           </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-primary-500/10 bg-ter/20">
               <button 
                 className="w-full py-3 rounded-xl text-[10px] font-black text-sec uppercase tracking-[0.3em] hover:bg-ter hover:text-main transition-all flex items-center justify-center gap-3 group"
                 onClick={() => setOpen(false)}
               >
                 <X className="h-3 w-3 group-hover:rotate-90 transition-transform" />
                 Dismiss Hub
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
