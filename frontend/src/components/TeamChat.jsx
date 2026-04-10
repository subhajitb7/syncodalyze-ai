import { useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Trash2, Pencil, Mic, MicOff } from 'lucide-react';
import useSpeechToText from '../hooks/useSpeechToText';
import { AuthContext } from '../context/AuthContext';
import { SocketPubSubContext } from '../context/SocketPubSubContext';

const TeamChat = ({
  teamId,
  placeholder = "Write message...",
  emptyMessage = "No discussions yet. Start the conversation!",
  userRole = 'member'
}) => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketPubSubContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const { isListening, transcript, startListening, stopListening } = useSpeechToText();

  useEffect(() => {
    if (transcript) setText(transcript);
  }, [transcript]);

  const socketRoom = `team:${teamId}`;

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(`/api/messages/${teamId}`);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!teamId) return;
    fetchMessages();

    if (socket) {
      socket.emit('joinRoom', socketRoom);

      const handleNewMessage = (newMessage) => {
        setMessages((prev) => {
          if (prev.find(m => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      };

      socket.on('newTeamMessage', handleNewMessage);

      return () => {
        socket.emit('leaveRoom', socketRoom);
        socket.off('newTeamMessage', handleNewMessage);
      };
    }
  }, [teamId, socket, socketRoom]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const { data } = await axios.post(`/api/messages/${teamId}`, {
        text: text.trim(),
      });
      // Local addition handled by socket or manually if needed
      // setMessages((prev) => [...prev, data]); 
      setText('');
    } catch (err) {
      console.error('Failed to post message:', err);
    }
  };

  const startEditing = (msg) => {
    setEditingId(msg._id);
    setEditText(msg.text);
  };

  const handleUpdate = async (messageId) => {
    if (!editText.trim()) return;
    try {
      await axios.put(`/api/messages/${messageId}`, { text: editText });
      setEditingId(null);
      fetchMessages(); // Refresh or wait for socket event if implemented
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await axios.delete(`/api/messages/${messageId}`);
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div>
      <div
        ref={scrollRef}
        className="space-y-4 mb-8 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth"
      >
        {loading ? (
          <p className="text-sec text-sm italic py-4">Syncing team chat...</p>
        ) : messages.length === 0 ? (
          <p className="text-sec text-sm italic opacity-60 py-4">{emptyMessage}</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className="group glass-panel p-4 border-col/30 hover:bg-sec/20 transition-all shadow-sm"
            >
              <div className="flex-1 min-w-0">
                {/* Header - Sequential Design */}
                <div className="flex items-center gap-2 mb-1 h-4 overflow-hidden">
                  <span className="font-black text-[10px] text-primary-500 uppercase tracking-tighter truncate max-w-[120px]">
                    {msg.user?.name || 'User'}
                  </span>

                  <span className="text-[9px] text-sec font-bold opacity-30 uppercase tracking-tighter shrink-0 whitespace-nowrap flex items-center gap-1">
                    <span className="opacity-50">·</span>
                    {new Date(msg.createdAt).toLocaleDateString()}
                    <span className="opacity-50">/</span>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Content */}
                {editingId === msg._id ? (
                  <div className="flex flex-col gap-2 mt-4">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="glass-input text-sm w-full py-2 min-h-[60px]"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingId(null)} className="p-1 px-3 text-xs font-bold text-sec hover:text-main">Cancel</button>
                      <button onClick={() => handleUpdate(msg._id)} className="btn-primary py-1 px-4 text-xs">Save</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed mt-2 text-sec font-medium">
                    {msg.text}
                  </p>
                )}
              </div>

              {/* Actions */}
              {user && editingId !== msg._id && (
                <div className="flex gap-1 justify-end mt-2 opacity-0 group-hover:opacity-100 transition-all">
                  {msg.user?._id === user._id && (
                    <button
                      onClick={() => startEditing(msg)}
                      className="p-1 text-sec hover:text-primary-500 transition-all"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                  {(msg.user?._id === user._id || userRole === 'admin' || userRole === 'owner') && (
                    <button
                      onClick={() => handleDelete(msg._id)}
                      className="p-1 text-sec hover:text-red-400 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="glass-panel p-2 flex items-end gap-2 border-col/40 group-focus-within:bg-sec/60 transition-all shadow-lg">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium resize-none px-3 py-2.5 min-h-[44px] max-h-40 text-main custom-scrollbar"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="flex items-center gap-2 pb-1 pr-1">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`flex items-center justify-center h-9 w-9 rounded-full transition-all ${isListening
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20'
                : 'text-sec hover:text-main hover:bg-ter/50'
                }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/10 disabled:opacity-30 active:scale-95 transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TeamChat;
