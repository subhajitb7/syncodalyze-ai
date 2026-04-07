import { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
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
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s as fallback

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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
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

  const typeColors = {
    review_complete: 'text-emerald-400',
    new_comment: 'text-primary-400',
    file_updated: 'text-yellow-400',
    project_created: 'text-purple-400',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {data.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
            {data.unreadCount > 9 ? '9+' : data.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 glass-panel shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-dark-700">
            <span className="font-semibold text-sm">Notifications</span>
            {data.unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {data.notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
            ) : (
              data.notifications.slice(0, 15).map((notif) => (
                <button
                  key={notif._id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left p-3 border-b border-dark-700/50 hover:bg-dark-700/50 transition-colors ${!notif.read ? 'bg-dark-800' : ''}`}
                >
                  <p className={`text-sm ${!notif.read ? 'text-white font-medium' : 'text-gray-400'}`}>{notif.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs capitalize ${typeColors[notif.type] || 'text-gray-500'}`}>
                      {notif.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-600">{new Date(notif.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
