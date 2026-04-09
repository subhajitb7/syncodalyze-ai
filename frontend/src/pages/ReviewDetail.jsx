import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, Sparkles, MessageSquare, Mail, Share2, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('javascript', jsx);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('typescript', typescript);
import CommentSection from '../components/CommentSection';
import Editor from '@monaco-editor/react';
import { AuthContext } from '../context/AuthContext';

const ReviewDetail = () => {
  const { theme } = useContext(ThemeContext);
  const { id } = useParams();
  const { user, socket } = useContext(AuthContext);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [emailContent, setEmailContent] = useState('');

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const { data } = await axios.get(`/api/reviews/${id}`);
        setReview(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [id]);

  const handleGenerateEmail = async () => {
    setGeneratingEmail(true);
    try {
      const { data } = await axios.post('/api/ai/generate-email', { reviewId: id });
      setEmailContent(data.emailBody);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingEmail(false);
    }
  };

  if (!review) return <div className="text-center py-20 text-gray-400">Review not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Link to="/dashboard" className="flex items-center gap-2 text-sec hover:text-main transition-colors mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{review.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="text-[10px] bg-primary-500/10 text-primary-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{review.language}</span>
            <span className="h-1 w-1 bg-col rounded-full"></span>
            <span className="text-[10px] text-sec font-bold">{new Date(review.createdAt).toLocaleString()}</span>
            {(review.aiTags || []).map((tag, idx) => (
               <span key={idx} className="text-[10px] bg-emerald-500/5 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-500/10 font-bold uppercase tracking-widest">#{tag}</span>
            ))}
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 ${review.bugsFound > 0 ? 'bg-red-500/15 text-red-600 border border-red-500/30 shadow-sm' : 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 shadow-sm'}`}>
          {review.bugsFound > 0 ? <><AlertTriangle className="h-4 w-4" /> {review.bugsFound} Issues</> : <><CheckCircle className="h-4 w-4" /> Clean Code</>}
        </div>
      </div>

      {/* Code + Feedback Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Code Panel */}
        <div className="glass-panel overflow-hidden">
          <div className="bg-sec border-b border-col px-4 py-2 text-sm text-sec font-medium">Source Code</div>
          <div className="bg-main h-[500px]">
             <Editor
               height="100%"
               language={review.language}
               theme={theme === 'dark' ? 'vs-dark' : 'vs'}
               value={review.codeSnippet}
               options={{
                 readOnly: true,
                 minimap: { enabled: false },
                 fontSize: 14,
                 fontFamily: "'Fira Code', Consolas, monospace",
                 wordWrap: "on",
                 padding: { top: 16, bottom: 16 },
                 scrollBeyondLastLine: false,
               }}
             />
          </div>
        </div>

        {/* AI Feedback Panel */}
        <div className="glass-panel overflow-hidden">
          <div className="bg-sec border-b border-col px-4 py-2 text-sm text-emerald-600 font-bold uppercase tracking-wider flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI Feedback</div>
            <button 
              onClick={handleGenerateEmail} 
              disabled={generatingEmail}
              className="group flex items-center gap-1.5 text-[10px] text-sec hover:text-primary-500 transition-all font-black"
            >
              {generatingEmail ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3 group-hover:scale-110 transition-transform" />}
              Share via Email
            </button>
          </div>
          <div className="p-6 overflow-auto max-h-[500px]">
            <div className="ai-feedback-content">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={theme === 'dark' ? vscDarkPlus : oneLight}
                        customStyle={{ background: 'transparent' }}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-md my-4 text-sm border border-col bg-ter/30 shadow-inner"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-ter text-primary-600 px-1.5 py-0.5 rounded text-sm font-bold font-mono border border-col" {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {(review.aiFeedback || 'No feedback.').replace(/^#+\s*(Code Review|AI Code Review).*\n/i, '')}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* Email Generator Modal */}
      {emailContent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
           <div className="glass-panel w-full max-w-2xl p-8 relative shadow-2xl border-white/5">
              <button onClick={() => setEmailContent('')} className="absolute top-6 right-6 p-2 bg-sec rounded-xl text-sec hover:text-rose-500 transition-all text-xl">&times;</button>
              <h2 className="text-2xl font-bold text-main mb-6 flex items-center gap-3"><Mail className="h-6 w-6 text-primary-500" /> AI Email Draft</h2>
              <div className="bg-ter/50 p-6 rounded-2xl border border-col whitespace-pre-wrap text-sm text-sec font-medium leading-relaxed max-h-96 overflow-y-auto italic">
                {emailContent}
              </div>
              <div className="mt-6 flex justify-end">
                 <button 
                  onClick={() => {
                    navigator.clipboard.writeText(emailContent);
                    alert('Email body copied to clipboard!');
                  }}
                  className="btn-primary flex items-center gap-2 px-6"
                 >
                    <div className="h-10 w-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                      <FileCode className="h-5 w-5" />
                    </div>
                    <div>
                    Copy to Clipboard
                    </div>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Discussion section */}
      <div className="mt-12 pt-12 border-t border-col">
        <CommentSection reviewId={id} title="Review Discussion" emptyMessage="Ask AI or teammates for clarification on these findings." />
      </div>
    </div>
  );
};

export default ReviewDetail;
