import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketPubSubContext } from '../context/SocketPubSubContext';
import { 
  X, Send, User, Sparkles, MessageSquare, 
  Trash2, ListTodo, Plus, Info, Clock, CheckCircle2
} from 'lucide-react';

const ProjectChatDrawer = ({ projectId, isOpen, onClose, initialMessages: messages, setInitialMessages: setMessages, typingUser }) => {
  const { user } = useContext(AuthContext);
  const { emitEvent: emit } = useContext(SocketPubSubContext);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const socketRoom = `project:${projectId}`;

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUser]);

  const handleTyping = () => {
    emit('typing', { roomId: socketRoom, userName: user.name });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emit('stopTyping', { roomId: socketRoom, userName: user.name });
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await axios.post(`/api/projects/${projectId}/comments`, { text: text.trim() });
      setText('');
      emit('stopTyping', { roomId: socketRoom, userName: user.name });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-main border-l border-col shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-6 border-b border-col flex items-center justify-between bg-sec/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-main leading-tight">Project Chat</h3>
            <p className="text-[10px] text-sec font-black uppercase tracking-widest mt-1">Real-time Discussion</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-sec hover:text-main hover:bg-sec rounded-xl transition-all">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[radial-gradient(circle_at_top_right,var(--color-primary-500)_0%,transparent_100%)] bg-[length:200px_200px] bg-no-repeat"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
             <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full"></div>
             <p className="text-xs font-bold uppercase tracking-widest">Waking up the team...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-40">
            <Sparkles className="h-12 w-12 text-primary-500" />
            <div>
                 <p className="text-sm font-bold text-main">No discussion yet</p>
                 <p className="text-xs font-medium text-sec mt-1">Start the conversation below.</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSystem = msg.text.startsWith('🚀') || msg.text.startsWith('🗑️') || msg.text.startsWith('🔄');
            const isMe = msg.user?._id === user._id;
            
            if (isSystem) {
              return (
                <div key={msg._id} className="flex justify-center">
                  <div className="bg-sec/50 border border-col py-1.5 px-4 rounded-full flex items-center gap-2 shadow-sm">
                    <Info className="h-3 w-3 text-primary-500" />
                    <span className="text-[10px] font-bold text-sec italic">{msg.text}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center border shadow-sm ${
                    isMe ? 'bg-primary-500 border-primary-600 text-white' : 'bg-sec border-col text-sec'
                  }`}>
                    {msg.user?.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                  </div>
                  
                  <div className={`p-3 rounded-2xl text-sm font-medium shadow-sm break-words ${
                    isMe 
                      ? 'bg-primary-500 text-white rounded-br-none' 
                      : 'bg-sec text-main border border-col rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
                <div className={`flex items-center gap-2 mt-1.5 px-10 text-[9px] font-black uppercase tracking-tighter opacity-40 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                   <span>{msg.user?.name}</span>
                   <span className="h-1 w-1 bg-current rounded-full"></span>
                   <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Area */}
      <div className="p-6 border-t border-col bg-sec/30 backdrop-blur-md">
        {typingUser && (
          <div className="mb-3 px-2 flex items-center gap-2 animate-pulse">
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce"></span>
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
            <p className="text-[10px] font-bold text-primary-600 italic">
              {typingUser} is typing...
            </p>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="relative group">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Type a message..."
            className="w-full bg-main border border-col rounded-2xl px-4 py-3 pb-12 text-sm font-medium outline-none focus:border-primary-500/50 transition-all resize-none shadow-inner"
            rows={2}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <button
               type="submit"
               disabled={!text.trim()}
               className="h-10 w-10 bg-primary-500 text-white rounded-xl shadow-lg shadow-primary-500/20 flex items-center justify-center hover:bg-primary-600 transition-all disabled:opacity-50 active:scale-95"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute bottom-3 left-4 flex items-center gap-4 text-sec">
             <button type="button" className="hover:text-primary-500 transition-all" title="Attach Code Snip">
                <Plus className="h-4 w-4" />
             </button>
             <button type="button" className="hover:text-primary-500 transition-all" title="Add Task">
                <ListTodo className="h-4 w-4" />
             </button>
          </div>
        </form>
        <p className="text-[9px] text-center text-sec mt-4 font-black uppercase tracking-[0.2em] opacity-30">
          Encrypted Collaborative Stream
        </p>
      </div>
    </div>
  );
};

export default ProjectChatDrawer;
