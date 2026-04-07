import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, Sparkles, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('javascript', jsx);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('typescript', typescript);
import CommentSection from '../components/CommentSection';
import Editor from '@monaco-editor/react';
import { AuthContext } from '../context/AuthContext';

const ReviewDetail = () => {
  const { id } = useParams();
  const { user, socket } = useContext(AuthContext);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (socket && id) {
      const handleStatusUpdated = (newStatus) => {
        setReview((prev) => (prev ? { ...prev, status: newStatus } : prev));
      };
      
      socket.on('statusUpdated', handleStatusUpdated);

      return () => {
        socket.off('statusUpdated', handleStatusUpdated);
      };
    }
  }, [socket, id]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    // Optimistic UI update
    setReview(prev => prev ? { ...prev, status: newStatus } : prev);
    try {
      await axios.patch(`/api/reviews/${id}/status`, { status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!review) return <div className="text-center py-20 text-gray-400">Review not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{review.title}</h1>
            <select 
               value={review.status || 'Pending'} 
               onChange={handleStatusChange}
               className={`text-xs font-semibold px-2.5 py-1 rounded-md outline-none bg-dark-700/50 border cursor-pointer ${
                 review.status === 'Approved' ? 'border-emerald-500/30 text-emerald-400' :
                 review.status === 'Needs Changes' ? 'border-red-500/30 text-red-400' :
                 'border-yellow-500/30 text-yellow-400'
               }`}
            >
               <option value="Pending" className="text-gray-200 bg-dark-800">Pending</option>
               <option value="In Review" className="text-gray-200 bg-dark-800">In Review</option>
               <option value="Needs Changes" className="text-gray-200 bg-dark-800">Needs Changes</option>
               <option value="Approved" className="text-gray-200 bg-dark-800">Approved</option>
            </select>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            <span className="uppercase text-primary-400">{review.language}</span> · {new Date(review.createdAt).toLocaleString()}
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${review.bugsFound > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
          {review.bugsFound > 0 ? <><AlertTriangle className="h-4 w-4" /> {review.bugsFound} Issues</> : <><CheckCircle className="h-4 w-4" /> Clean Code</>}
        </div>
      </div>

      {/* Code + Feedback Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Code Panel */}
        <div className="glass-panel overflow-hidden">
          <div className="bg-dark-800 border-b border-dark-700 px-4 py-2 text-sm text-gray-400 font-medium">Source Code</div>
          <div className="bg-black h-[500px]">
             <Editor
               height="100%"
               language={review.language}
               theme="vs-dark"
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
          <div className="bg-dark-800 border-b border-dark-700 px-4 py-2 text-sm text-emerald-400 font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> AI Feedback
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
                        style={vscDarkPlus}
                        customStyle={{ background: '#000000' }}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-md my-4 text-sm"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-dark-700 text-primary-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
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

      {/* Comment Section */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary-400" /> Discussion
        </h2>
        <CommentSection reviewId={id} />
      </div>
    </div>
  );
};

export default ReviewDetail;
