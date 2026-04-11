import { useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Trash2, User, CheckSquare, Square, Pencil, Check, X, ListTodo, Mic, MicOff } from 'lucide-react';
import useSpeechToText from '../hooks/useSpeechToText';
import { AuthContext } from '../context/AuthContext';
import { SocketPubSubContext } from '../context/SocketPubSubContext';
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
  const { socket } = useContext(SocketPubSubContext);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
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

    if (socket) {
      socket.emit('joinRoom', socketRoom);

      const handleNewComment = (newComment) => {
        setComments((prev) => {
          if (prev.find(c => c._id === newComment._id)) return prev;
          return [...prev, newComment];
        });
      };

      const handleCommentUpdated = (updatedComment) => {
        setComments((prev) => prev.map(c => c._id === updatedComment._id ? updatedComment : c));
      };

      socket.on('newComment', handleNewComment);
      socket.on('commentUpdated', handleCommentUpdated);

      return () => {
        socket.emit('leaveRoom', socketRoom);
        socket.off('newComment', handleNewComment);
        socket.off('commentUpdated', handleCommentUpdated);
      };
    }
  }, [contextId, socket, socketRoom]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await axios.post(`/api/${contextType}/${contextId}/comments`, {
        text: text.trim(),
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

  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new comments
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments, loading]);

  return (
    <div>
      {/* List - Scrollable Viewport (Sized for ~4 comments) */}
      <div
        ref={scrollRef}
        className="space-y-4 mb-8 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth"
      >
        {loading ? (
          <p className="text-sec text-sm italic py-4">Loading insights...</p>
        ) : comments.length === 0 ? (
          <p className="text-sec text-sm italic opacity-60 py-4">
            {emptyMessage || (isNotes ? "No notes found. Capture your project flow." : "No discussions yet.")}
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              className={`flex gap-3 p-4 glass-panel transition-all group border-col/30 ${isNotes
                  ? 'bg-sec/30 hover:bg-sec/50'
                  : 'hover:bg-sec/20 shadow-sm'
                }`}
            >

              <div className="flex-1 min-w-0">
                {/* Header for Context - Sequential Grouping (Rock Solid Consistency) */}
                <div className="flex items-center gap-2 mb-1 h-4 overflow-hidden">
                  <span className={`font-black text-[10px] uppercase tracking-tighter truncate max-w-[120px] ${
                    contextType === 'teams' ? 'text-primary-500' : 'text-emerald-500'
                  }`}>
                    {comment.user?.name || 'User'}
                  </span>
                  
                  <span className="text-[9px] text-sec font-bold opacity-30 uppercase tracking-tighter shrink-0 whitespace-nowrap flex items-center gap-1">
                    <span className="opacity-50">·</span>
                    {new Date(comment.createdAt).toLocaleDateString()}
                    <span className="opacity-50">/</span>
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Content */}
                {editingId === comment._id ? (
                  <div className="flex flex-col gap-2 mt-4">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="glass-input text-sm w-full py-2 min-h-[60px]"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingId(null)} className="p-1 px-3 text-xs font-bold text-sec hover:text-main">Cancel</button>
                      <button onClick={() => handleUpdate(comment._id)} className="btn-primary py-1 px-4 text-xs">Save</button>
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm leading-relaxed mt-2 ${isNotes ? 'text-main font-medium' : 'text-sec font-medium'}`}>
                    {comment.text}
                  </p>
                )}
              </div>

              {/* Actions */}
              {user && editingId !== comment._id && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0 self-start">
                  {comment.user?._id === user._id && (
                    <button
                      onClick={() => startEditing(comment)}
                      className="p-1.5 text-sec hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition-all"
                      title="Edit Comment"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {(comment.user?._id === user._id || userRole === 'admin' || userRole === 'owner') && (
                    <button
                      onClick={() => handleDeleteTrigger(comment._id)}
                      className="p-1.5 text-sec hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      title="Delete Comment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
            placeholder={placeholder || "Write message..."}
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
              title={isListening ? "Stop Listening" : "Voice Message"}
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
      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Comment?"
        message="Are you sure you want to remove this project note or discussion point?"
      />
    </div>
  );
};

export default CommentSection;
