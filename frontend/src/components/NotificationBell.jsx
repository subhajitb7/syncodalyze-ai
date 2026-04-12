import { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckSquare, MessageSquare, FileUp, Sparkles, Inbox, Trash2, Info } from 'lucide-react';
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
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="absolute right-0 mt-4 w-96 glass-panel shadow-2xl z-[150] overflow-hidden border-col shadow-primary-500/5"
          >
            <div className="flex items-center justify-between p-5 border-b border-col bg-ter/30">
              <div>
                <h3 className="text-xs font-black text-main uppercase tracking-widest">Inbox Center</h3>
                <p className="text-[10px] text-sec font-bold opacity-60 mt-0.5">Awaiting Attention • {data.unreadCount} New</p>
              </div>
              {data.unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead} 
                  className="text-[10px] uppercase font-black text-primary-500 hover:text-primary-600 tracking-widest border border-primary-500/20 px-3 py-1.5 rounded-lg hover:bg-primary-500/5 transition-all"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
              {data.notifications.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center p-8 grayscale opacity-50">
                   <div className="h-16 w-16 bg-ter rounded-3xl flex items-center justify-center mb-4">
                      <Inbox className="h-8 w-8 text-sec" />
                   </div>
                   <p className="text-xs font-black text-sec uppercase tracking-widest">Zero Latency</p>
                   <p className="text-[10px] font-medium text-sec mt-1">Status: No incoming transmissions detected.</p>
                </div>
              ) : (
                <div className="divide-y divide-col/50">
                  {data.notifications.slice(0, 15).map((notif) => (
                    <button
                      key={notif._id}
                      onClick={() => handleClick(notif)}
                      className={`w-full text-left p-4 hover:bg-primary-500/[0.03] transition-all flex gap-4 group ${!notif.read ? 'bg-primary-500/[0.02]' : ''}`}
                    >
                      <div className={`mt-1 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${
                        !notif.read ? 'bg-primary-500/10 scale-105' : 'bg-ter outline outline-1 outline-col/10'
                      }`}>
                        {getTypeIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-relaxed mb-1.5 ${!notif.read ? 'text-main font-bold pr-4' : 'text-sec font-medium'}`}>
                          {notif.message}
                          {!notif.read && <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-500 ml-2 animate-pulse" />}
                        </p>
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] font-black uppercase text-sec tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">
                             {notif.type.replace('_', ' ')}
                           </span>
                           <span className="text-[9px] font-bold text-sec italic">
                             {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              className="w-full p-4 text-[10px] font-black text-sec uppercase tracking-widest border-t border-col bg-ter/30 hover:text-main transition-colors"
              onClick={() => setOpen(false)}
            >
              Close Event Hub
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
