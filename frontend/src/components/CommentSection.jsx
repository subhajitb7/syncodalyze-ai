import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Send, Trash2, User } from 'lucide-react';

const CommentSection = ({ reviewId }) => {
  const { user, socket } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const { data } = await axios.get(`/api/reviews/${reviewId}/comments`);
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchComments(); 

    if (socket) {
      socket.emit('joinRoom', `review:${reviewId}`);

      const handleNewComment = (newComment) => {
        setComments((prev) => {
          if (prev.find(c => c._id === newComment._id)) return prev;
          return [...prev, newComment];
        });
      };

      socket.on('newComment', handleNewComment);

      return () => {
        socket.emit('leaveRoom', `review:${reviewId}`);
        socket.off('newComment', handleNewComment);
      };
    }
  }, [reviewId, socket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await axios.post(`/api/reviews/${reviewId}/comments`, { text });
      setText('');
      // No need to fetchComments() here as socket will append it instantly
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
      {/* Comment List */}
      <div className="space-y-4 mb-6">
        {loading ? (
          <p className="text-gray-500 text-sm">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 text-sm">No comments yet. Start the discussion!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-3 p-4 bg-dark-900/50 border border-dark-600 rounded-lg group">
              <div className="h-8 w-8 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-4 w-4 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{comment.user?.name || 'User'}</span>
                  <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                  {comment.lineNumber && (
                    <span className="text-xs bg-dark-700 px-1.5 py-0.5 rounded text-gray-400">Line {comment.lineNumber}</span>
                  )}
                </div>
                <p className="text-sm text-gray-300">{comment.text}</p>
              </div>
              {user && comment.user?._id === user._id && (
                <button
                  onClick={() => handleDelete(comment._id)}
                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Comment */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="glass-input flex-1"
        />
        <button type="submit" disabled={!text.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
