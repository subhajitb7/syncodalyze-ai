import { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketPubSubContext } from '../context/SocketPubSubContext';
import useSpeechToText from '../hooks/useSpeechToText';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, User, Sparkles, MessageSquare, 
  Mic, MicOff 
} from 'lucide-react';


const TeamChatDrawer = ({ teamId, isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketPubSubContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
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
    if (!isOpen || !teamId) return;
    
    fetchMessages();

    if (socket) {
      socket.emit('joinRoom', socketRoom);

      const handleNewMessage = (newMessage) => {
        setMessages((prev) => {
          if (prev.find(m => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      };

      const handleTyping = ({ userName }) => {
        if (userName !== user?.name) setTypingUser(userName);
      };

      const handleStopTyping = () => {
        setTypingUser(null);
      };

      socket.on('newTeamMessage', handleNewMessage);
      socket.on('userTyping', handleTyping);
      socket.on('userStopTyping', handleStopTyping);

      return () => {
        socket.emit('leaveRoom', socketRoom);
        socket.off('newTeamMessage', handleNewMessage);
        socket.off('userTyping', handleTyping);
        socket.off('userStopTyping', handleStopTyping);
      };
    }
  }, [teamId, socket, socketRoom, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser, isOpen]);

  const handleTypingEvent = () => {
    if (!user || !socket) return;
    socket.emit('typing', { roomId: socketRoom, userName: user.name });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { roomId: socketRoom, userName: user.name });
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const { data } = await axios.post(`/api/messages/${teamId}`, { text: text.trim() });
      setMessages(prev => {
        if (prev.find(m => m._id === data._id)) return prev;
        return [...prev, data];
      });
      setText('');
      if (socket) socket.emit('stopTyping', { roomId: socketRoom, userName: user.name });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-main/98 backdrop-blur-3xl border-l border-col shadow-[0_0_80px_rgba(0,0,0,0.4)] z-[200] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
      
      {/* Refined Minimalist Header */}
      <div className="px-8 py-6 border-b border-col flex items-center justify-between bg-sec/10">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-sec border border-col rounded-xl flex items-center justify-center shadow-sm">
            <MessageSquare className="h-5 w-5 text-primary-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-main tracking-widest uppercase">Sync_Chat</h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                 <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
              </div>
            </div>
            <p className="text-[9px] text-sec font-bold uppercase tracking-[0.2em] opacity-30 mt-0.5">Communication Cluster</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-sec hover:text-main hover:bg-sec/50 rounded-lg transition-all">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Message Stream with Logic-Based Grouping */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-2 scroll-smooth custom-scrollbar"
      >
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && !loading ? (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-20 grayscale"
            >
              <Sparkles className="h-8 w-8 text-sec" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Awaiting Uplink...</p>
            </motion.div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.user?._id === user?._id;
              const prevMsg = messages[index - 1];
              const isSameUserAsPrev = prevMsg && (prevMsg.user?._id === msg.user?._id);
              const isNextSameUser = messages[index + 1] && (messages[index + 1].user?._id === msg.user?._id);
              
              const msgDate = new Date(msg.createdAt).toDateString();
              const prevMsgDate = prevMsg ? new Date(prevMsg.createdAt).toDateString() : null;
              const showDateDivider = msgDate !== prevMsgDate;

              return (
                <div key={msg._id || index} className="flex flex-col">
                  {showDateDivider && (
                    <div className="flex items-center gap-4 py-8 opacity-20">
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-col"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
                        {new Date(msg.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-col"></div>
                    </div>
                  )}

                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isSameUserAsPrev ? 'mt-1' : 'mt-6'}`}
                  >
                    <div className={`flex items-start gap-4 w-full ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Fixed Left Time Display */}
                      <div className="w-10 shrink-0 flex items-center justify-center mt-3">
                         <span className="text-[9px] font-black text-sec tracking-tighter opacity-20 group-hover:opacity-40 transition-opacity">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </div>

                      <div className={`flex items-start gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Conditional Avatar Profile */}
                        {!isSameUserAsPrev ? (
                          <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border shadow-md text-[10px] font-black relative ${
                            isMe ? 'bg-primary-500/10 border-primary-500/20 text-primary-500' : 'bg-ter border-col text-sec'
                          }`}>
                            {msg.user?.name?.charAt(0).toUpperCase() || '?'}
                            <div className={`absolute -bottom-0.5 ${isMe ? '-left-0.5' : '-right-0.5'} h-2 w-2 rounded-full border-2 border-main bg-emerald-500`}></div>
                          </div>
                        ) : (
                          <div className="w-8 shrink-0"></div>
                        )}
                        
                        {/* Minimalist Glass Bubble */}
                        <div className={`group relative px-4 py-3 rounded-2xl text-[13px] font-medium leading-relaxed transition-all duration-300 ${
                          isMe 
                            ? `bg-primary-500/5 text-main border border-primary-500/10 hover:border-primary-500/30 ${isSameUserAsPrev ? 'rounded-tr-lg' : 'rounded-tr-none'}` 
                            : `bg-ter/30 text-main border border-col hover:border-col*2 ${isSameUserAsPrev ? 'rounded-tl-lg' : 'rounded-tl-none'}`
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                    
                    {/* Detailed Meta */}
                    {!isNextSameUser && (
                      <div className={`flex items-center gap-2 mt-1.5 px-24 text-[8px] font-black uppercase tracking-[0.1em] opacity-20 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                         <span>{isMe ? 'OPERATOR' : msg.user?.name?.split(' ')[0]}</span>
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })
          )}
        </AnimatePresence>

        {typingUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-11 flex items-center gap-2 mt-4"
          >
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce"></span>
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
            <p className="text-[8px] font-black text-primary-500/60 uppercase tracking-widest italic">
              {typingUser.split(' ')[0]} transmitting...
            </p>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Redesigned Floating Input Console */}
      <div className="p-6 bg-ter/5 pb-10">
        <form onSubmit={handleSendMessage} className="relative group">
          <div className="glass-panel rounded-2xl border-col/30 focus-within:border-primary-500/40 transition-all bg-main/40 overflow-hidden shadow-2xl">
             <div className="px-4 pt-3 flex items-center justify-between opacity-30">
               <span className="text-[8px] font-black uppercase tracking-widest">{isListening ? 'Streaming_Voice' : 'Ready_for_input'}</span>
               <span className="text-[8px] font-black uppercase tracking-widest font-mono">ENCRYPTED_LINE_O8</span>
             </div>
             
             <textarea
               value={text}
               onChange={(e) => {
                 setText(e.target.value);
                 handleTypingEvent();
               }}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   handleSendMessage(e);
                 }
               }}
               placeholder="Write a message..."
               className="w-full bg-transparent px-5 py-4 text-sm font-medium outline-none transition-all resize-none min-h-[80px]"
               rows={1}
             />
             
             <div className="px-4 pb-4 flex items-center justify-end gap-2">
               <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                    isListening 
                      ? 'bg-rose-500 text-white animate-pulse' 
                      : 'text-sec hover:text-primary-500 hover:bg-sec/50'
                  }`}
                  title="Voice Command"
               >
                 {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
               </button>
               <button
                  type="submit"
                  disabled={!text.trim()}
                  className="h-10 px-5 bg-primary-500 text-white rounded-xl shadow-lg shadow-primary-500/20 flex items-center gap-2 hover:bg-primary-600 transition-all disabled:opacity-30 disabled:grayscale active:scale-95 text-[10px] font-black uppercase tracking-wider"
               >
                 Transmit <Send className="h-3.5 w-3.5" />
               </button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamChatDrawer;
