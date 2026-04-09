import { useState, useRef, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import axios from 'axios';
import { MessageSquare, Send, X, Bot, User, Loader2, Minimize2, Mic, MicOff } from 'lucide-react';
import useSpeechToText from '../hooks/useSpeechToText';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AiChatFloating = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Coding Assistant. How can I help you today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const { theme } = useContext(ThemeContext);
  const { isListening, transcript, startListening, stopListening } = useSpeechToText();

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // We pass the last 5 messages for context
      const chatHistory = messages.slice(-5).concat(userMessage);
      const { data } = await axios.post('/api/reviews/chat', { messages: chatHistory });
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] glass-panel flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-2xl border-primary-500/10">
          {/* Header */}
          <div className="p-4 border-b border-col flex items-center justify-between bg-primary-600/5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-main">AI Assistant</h3>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] text-sec">Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-main/5 rounded-lg transition-colors text-sec hover:text-main"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-ter border border-col' : 'bg-primary-600 shadow-md shadow-primary-500/20'}`}>
                    {m.role === 'user' ? <User className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : 'text-primary-600'}`} /> : <Bot className="h-4 w-4 text-white" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-primary-600 text-white rounded-tr-none shadow-lg shadow-primary-500/20' 
                      : 'bg-sec border border-col text-main rounded-tl-none'
                  }`}>
                    <div className={`ai-feedback-content prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[85%]">
                  <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-sec border border-col p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                    <span className="text-xs text-sec">Typing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-col bg-sec">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about coding..."
                className="w-full glass-input pr-12 text-sm py-3"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                   type="button"
                   onClick={isListening ? stopListening : startListening}
                   className={`p-1.5 rounded-lg transition-all ${
                     isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' : 'text-sec hover:text-primary-500'
                   }`}
                   title={isListening ? "Stop Listening" : "Voice Typing"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button 
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-1.5 text-primary-400 hover:text-primary-300 disabled:opacity-30 transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen 
            ? 'glass-panel text-primary-500 rotate-90 border-primary-500/30' 
            : 'bg-primary-600 text-white'
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-main animate-bounce"></span>
        )}
      </button>
    </div>
  );
};

export default AiChatFloating;
