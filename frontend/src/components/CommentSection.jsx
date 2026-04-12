import { useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Trash2, User, CheckSquare, Square, Pencil, Check, X, ListTodo, Mic, MicOff, Activity } from 'lucide-react';
import useSpeechToText from '../hooks/useSpeechToText';
import { AuthContext } from '../context/AuthContext';
import { SocketPubSubContext } from '../context/SocketPubSubContext';
import { motion } from 'framer-motion';
import ConfirmModal from './ConfirmModal';

const CommentSection = ({
  reviewId,
  projectId,
  title = "Discussion",
  placeholder,
  emptyMessage,
  isNotes = false,
  userRole = 'member' // Pass role for admin powers
}) => {
  const { user } = useContext(AuthContext);
  const { subscribe } = useContext(SocketPubSubContext);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const scrollRef = useRef(null);
  const { isListening, transcript, startListening, stopListening } = useSpeechToText();

  // Deletion State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  useEffect(() => {
    if (transcript) setText(transcript);
  }, [transcript]);

  const contextId = reviewId || projectId;
  const contextType = reviewId ? 'reviews' : 'projects';
  const socketRoom = reviewId ? `review:${reviewId}` : `project:${projectId}`;

  const fetchComments = async () => {
    try {
      const { data } = await axios.get(`/api/${contextType}/${contextId}/comments`);
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!contextId) return;
    fetchComments();

    console.info(`[TELEMETRY] Subscribing to node: ${socketRoom}`);
    const unsubscribe = subscribe(socketRoom, (event) => {
      const { type, data } = event;
      if (type === 'NEW_MESSAGE') {
        setComments((prev) => {
          if (prev.find(c => c._id === data._id)) return prev;
          console.log(`[TELEMETRY] NEW_MESSAGE pulse received for ${data._id}`);
          return [...prev, data];
        });
      } else if (type === 'UPDATE_MESSAGE') {
        console.log(`[TELEMETRY] UPDATE_MESSAGE pulse received for ${data._id}`);
        setComments((prev) => prev.map(c => c._id === data._id ? data : c));
      }
    });

    return () => {
      console.info(`[TELEMETRY] Unsubscribing from node: ${socketRoom}`);
      unsubscribe();
    };
  }, [contextId, socketRoom, subscribe]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const { data } = await axios.post(`/api/${contextType}/${contextId}/comments`, {
        text: text.trim(),
      });
      setComments(prev => {
        if (prev.find(c => c._id === data._id)) return prev;
        return [...prev, data];
      });
      setText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const startEditing = (comment) => {
    setEditingId(comment._id);
    setEditText(comment.text);
  };

  const handleUpdate = async (commentId) => {
    if (!editText.trim()) return;
    try {
      await axios.put(`/api/comments/${commentId}`, { text: editText });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTrigger = (commentId) => {
    setCommentToDelete(commentId);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!commentToDelete) return;
    try {
      await axios.delete(`/api/comments/${commentToDelete}`);
      fetchComments();
      setCommentToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-scroll to bottom on new comments
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments, loading]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* List - Tactical Comms Log */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 space-y-2 mb-6 overflow-y-auto pr-3 custom-scrollbar scroll-smooth relative"
      >
        {/* Signal Path Decoration */}
        <div className="absolute left-[11px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-emerald-500/50 via-col/30 to-transparent pointer-events-none"></div>

        {loading ? (
          <div className="flex items-center gap-3 py-6 px-4">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-[10px] font-black text-sec uppercase tracking-[0.2em] italic">Decrypting incoming packets...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Activity className="h-8 w-8 text-sec mb-4" />
            <p className="text-[10px] font-black text-sec uppercase tracking-widest text-center leading-relaxed">
              {emptyMessage || (isNotes ? "Primary Archive Empty\nAwait manual transmission" : "Secure Channel Open\nNo traffic detected")}
            </p>
          </div>
        ) : (
          <div className="relative">
            {comments.map((comment, idx) => (
              <motion.div
                key={comment._id}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`group relative pl-8 py-1.5 transition-all hover:bg-emerald-500/5 rounded-r-xl border-l-2 border-transparent hover:border-emerald-500/20`}
              >
                {/* Visual Anchor Dot */}
                <div className="absolute left-[7.5px] top-5 h-2 w-2 rounded-full bg-ter border border-col group-hover:border-emerald-500/50 group-hover:bg-emerald-500/20 transition-all z-10">
                   <div className="h-full w-full rounded-full bg-emerald-500 scale-0 group-hover:scale-50 transition-transform"></div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-emerald-500/60 font-medium">
                        [{new Date(comment.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace(/\//g, '.')} | {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}]
                      </span>
                      <span className="font-black text-[10px] uppercase tracking-widest text-main group-hover:text-emerald-500 transition-colors">
                        {comment.user?.name || 'Unknown_Node'}
                      </span>
                    </div>

                    {/* Actions - Subtle Hover Trigger */}
                    {user && editingId !== comment._id && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        {comment.user?._id === user._id && (
                          <button
                            onClick={() => startEditing(comment)}
                            className="p-1 text-sec hover:text-primary-500 transition-all"
                            title="Edit Transaction"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                        {(comment.user?._id === user._id || userRole === 'admin' || userRole === 'owner') && (
                          <button
                            onClick={() => handleDeleteTrigger(comment._id)}
                            className="p-1 text-sec hover:text-red-500 transition-all"
                            title="Purge Packet"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  {editingId === comment._id ? (
                    <div className="flex flex-col gap-2 mt-2 bg-ter/50 p-2 rounded-lg border border-primary-500/20">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs text-main font-medium resize-none min-h-[60px]"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="text-[9px] font-black uppercase text-sec hover:text-main">Cancel</button>
                        <button onClick={() => handleUpdate(comment._id)} className="bg-primary-500 text-white px-3 py-1 rounded text-[9px] font-black uppercase shadow-lg shadow-primary-500/20">Sync</button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                       <p className="text-[12px] leading-relaxed text-sec font-medium group-hover:text-main transition-colors whitespace-pre-wrap">
                        {comment.text}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Input - Secure Transmitter */}
      <form onSubmit={handleSubmit} className="relative group mt-auto px-1">
        <div className="glass-panel p-1.5 flex flex-col gap-1 border-col/30 bg-ter/40 group-focus-within:border-emerald-500/30 group-focus-within:bg-ter/60 transition-all shadow-xl rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1 opacity-40 group-focus-within:opacity-100 transition-opacity">
             <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-500">Transmitter Enabled</span>
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder || "ENCRYPTED TRANSMISSION..."}
              className="flex-1 bg-transparent border-none outline-none text-xs font-semibold resize-none px-3 py-2 min-h-[44px] max-h-32 text-main custom-scrollbar placeholder:text-sec/30"
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
                className={`flex items-center justify-center h-9 w-9 rounded-xl transition-all ${isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20'
                  : 'text-sec hover:text-emerald-500 hover:bg-emerald-500/10'
                  }`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <button
                type="submit"
                disabled={!text.trim()}
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-500 text-white shadow-xl shadow-primary-500/20 disabled:opacity-20 transition-all group/send"
              >
                <Send className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </form>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Purge Communication?"
        message="This will permanently delete the selected packet from the tactical record."
      />
    </div>
  );
};

export default CommentSection;
