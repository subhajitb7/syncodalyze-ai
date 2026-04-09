import { Send, Trash2, User, CheckSquare, Square, Pencil, Check, X, ListTodo, Mic, MicOff } from 'lucide-react';
import useSpeechToText from '../hooks/useSpeechToText';

const CommentSection = ({ 
  reviewId, 
  projectId, 
  title = "Comments",
  emptyMessage,
  placeholder
}) => {
  const { user, socket } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [isTodoMode, setIsTodoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const { isListening, transcript, startListening, stopListening } = useSpeechToText();

  useEffect(() => {
    if (transcript) setText(transcript);
  }, [transcript]);

  const isNotes = title.toLowerCase().includes('note');
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
        text, 
        isTodo: isTodoMode 
      });
      setText('');
      // Keep isTodoMode active? User might want to keep adding todos
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleComplete = async (comment) => {
    try {
      await axios.put(`/api/comments/${comment._id}`, { isCompleted: !comment.isCompleted });
    } catch (err) {
      console.error(err);
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

  const handleDelete = async (commentId) => {
    try {
      await axios.delete(`/api/comments/${commentId}`);
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* List */}
      <div className="space-y-3 mb-8">
        {loading ? (
          <p className="text-sec text-sm italic">Loading...</p>
        ) : comments.length === 0 ? (
          <p className="text-sec text-sm italic opacity-60">
            {emptyMessage || (isNotes ? "No notes found. Capture your project flow." : "No discussions yet.")}
          </p>
        ) : (
          comments.map((comment) => (
            <div 
              key={comment._id} 
              className={`flex gap-3 p-4 rounded-xl border transition-all group ${
                isNotes 
                  ? 'bg-sec/40 border-col/50 hover:border-primary-500/30' 
                  : 'bg-dark-900/50 border-dark-600'
              }`}
            >
              {/* Profile or Checkbox */}
              {comment.isTodo ? (
                <button 
                  onClick={() => handleToggleComplete(comment)}
                  className={`shrink-0 mt-0.5 transition-colors ${comment.isCompleted ? 'text-primary-500' : 'text-sec hover:text-primary-600'}`}
                >
                  {comment.isCompleted ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                </button>
              ) : (
                !isNotes && (
                  <div className="h-8 w-8 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-4 w-4 text-primary-400" />
                  </div>
                )
              )}

              <div className="flex-1 min-w-0">
                {/* Header for Chat Mode */}
                {!isNotes && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-main">{comment.user?.name || 'User'}</span>
                    <span className="text-[10px] text-sec font-bold opacity-60 uppercase tracking-tighter">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Content */}
                {editingId === comment._id ? (
                  <div className="flex flex-col gap-2">
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
                  <>
                    <p className={`text-sm leading-relaxed ${isNotes ? 'text-main font-medium' : 'text-sec'} ${comment.isCompleted ? 'line-through opacity-50' : ''}`}>
                      {comment.text}
                    </p>
                    {isNotes && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-sec font-black uppercase tracking-widest opacity-40">
                          {comment.isTodo ? (comment.isCompleted ? 'Done' : 'Pending Task') : 'Captured'} · {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              {user && comment.user?._id === user._id && editingId !== comment._id && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0 self-start">
                  <button
                    onClick={() => startEditing(comment)}
                    className="p-1.5 text-sec hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(comment._id)}
                    className="p-1.5 text-sec hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="glass-panel p-2 flex flex-col gap-2 border-col group-focus-within:border-primary-500/50 transition-all shadow-xl">
            <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isTodoMode ? "Add a task to your list..." : (placeholder || (isNotes ? "Take a note..." : "Start a discussion..."))}
            className="w-full bg-transparent border-none outline-none text-sm font-medium resize-none px-3 py-2 min-h-[44px] max-h-40 text-main"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="flex items-center justify-between px-2 pb-1 border-t border-col pt-2">
            <div className="flex items-center gap-1">
              <button 
                type="button"
                onClick={() => setIsTodoMode(!isTodoMode)}
                className={`p-2 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  isTodoMode 
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                    : 'text-sec hover:bg-sec/50'
                }`}
              >
                <ListTodo className="h-3.5 w-3.5" />
                {isTodoMode ? 'Task Mode' : (isNotes ? 'Note Mode' : 'Chat Mode')}
              </button>
              <button 
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-2 rounded-lg transition-all ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' 
                    : 'text-sec hover:bg-sec/50'
                }`}
                title={isListening ? "Stop Listening" : "Voice Typing"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
            <button 
              type="submit" 
              disabled={!text.trim()} 
              className="btn-primary w-9 h-9 flex items-center justify-center rounded-xl disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CommentSection;
