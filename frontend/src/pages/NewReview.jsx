import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import hljs from 'highlight.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AlertTriangle, CheckCircle, Loader2, Send, Code, Sparkles } from 'lucide-react';

SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('javascript', jsx);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('typescript', typescript);
import Editor from '@monaco-editor/react';


const NewReview = () => {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [codeSnippet, setCodeSnippet] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { socket } = useContext(AuthContext);
  const [aiProgressText, setAiProgressText] = useState('Uploading code snippet for AI processing...');

  useEffect(() => {
    if (socket) {
      const handleProgress = (msg) => setAiProgressText(msg);
      socket.on('aiProgress', handleProgress);
      return () => socket.off('aiProgress', handleProgress);
    }
  }, [socket]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (codeSnippet.length > 10) {
        try {
          const detect = hljs.highlightAuto(codeSnippet);
          if (detect.language) {
            let lang = detect.language.toLowerCase();
            if (['js', 'javascript', 'jsx', 'node'].includes(lang)) lang = 'javascript';
            else if (['ts', 'typescript', 'tsx'].includes(lang)) lang = 'typescript';
            else if (['py', 'python'].includes(lang)) lang = 'python';
            else if (['java'].includes(lang)) lang = 'java';
            else if (['cpp', 'c++', 'c'].includes(lang)) lang = 'cpp';
            else if (['go', 'golang'].includes(lang)) lang = 'go';
            
            if (['javascript', 'python', 'typescript', 'java', 'cpp', 'go'].includes(lang) && lang !== language) {
              setLanguage(lang);
            }
          }
        } catch (e) {}
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [codeSnippet, language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!codeSnippet.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setAiProgressText('Uploading code snippet for AI processing...');

    try {
      const { data } = await axios.post('/api/reviews/analyze', {
        title: title || 'Untitled Review',
        language,
        codeSnippet,
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <div className="border-b border-dark-700 bg-dark-800 p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex w-full sm:w-auto items-center gap-4 flex-1">
             <input
               type="text"
               placeholder="Review Title (e.g. Authentication Bug)"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               className="glass-input flex-1 sm:max-w-xs"
             />
             <select
               value={language}
               onChange={(e) => setLanguage(e.target.value)}
               className="glass-input outline-none pr-8 cursor-pointer"
             >
               <option value="javascript">JavaScript / React</option>
               <option value="python">Python</option>
               <option value="typescript">TypeScript</option>
               <option value="java">Java</option>
               <option value="cpp">C++</option>
               <option value="go">Go</option>
             </select>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !codeSnippet.trim()}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Analyze Code</>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side - Editor */}
        <div className={`flex-1 flex flex-col ${result ? 'lg:w-1/2 border-r border-dark-700' : 'w-full'} transition-all`}>
          <div className="bg-dark-800 border-b border-dark-700 px-4 py-2 flex justify-between items-center">
             <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
               <Code className="h-4 w-4" />
               Source Code
             </div>
          </div>
          <div className="flex-1 bg-black relative">
             <Editor
               height="100%"
               language={language}
               theme="vs-dark"
               value={codeSnippet}
               onChange={(value) => setCodeSnippet(value || '')}
               options={{
                 minimap: { enabled: false },
                 fontSize: 14,
                 fontFamily: "'Fira Code', Consolas, monospace",
                 wordWrap: "on",
                 padding: { top: 16 },
               }}
             />
          </div>
        </div>

        {/* Right Side - Results */}
        {(result || error || loading) && (
          <div className="flex-1 flex flex-col lg:w-1/2 bg-dark-800/30 overflow-hidden relative">
            <div className="bg-dark-800 border-b border-dark-700 px-4 py-2 flex justify-between items-center shadow-sm">
               <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                 <Sparkles className="h-4 w-4" />
                 AI Analysis Results
               </div>
               {result && (
                  <div className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${result.bugsFound > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                    {result.bugsFound > 0 ? <><AlertTriangle className="h-3 w-3" /> Issues Detected</> : <><CheckCircle className="h-3 w-3" /> Looks Good</>}
                  </div>
               )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
               {loading && (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                    <p className="animate-pulse">{aiProgressText}</p>
                 </div>
               )}

               {error && (
                 <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-400 flex items-start gap-3">
                   <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                   <div>
                     <h4 className="font-semibold mb-1">Analysis Failed</h4>
                     <p className="text-sm opacity-90">{error}</p>
                   </div>
                 </div>
               )}

               {result && (
                 <div className="ai-feedback-content mt-2">
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
                      {result.aiFeedback.replace(/^#+\s*(Code Review|AI Code Review).*\n/i, '')}
                    </ReactMarkdown>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewReview;
