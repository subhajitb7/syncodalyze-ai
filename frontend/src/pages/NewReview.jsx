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
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ThemeContext } from '../context/ThemeContext';
import { AlertTriangle, CheckCircle, Loader2, Send, Code, Sparkles, ChevronDown, History, ZapOff, ShieldOff } from 'lucide-react';
import Editor from '@monaco-editor/react';

SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('javascript', jsx);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('typescript', typescript);


const NewReview = () => {
  const { theme } = useContext(ThemeContext);
  const [title, setTitle] = useState(localStorage.getItem('draft_title') || '');
  const [language, setLanguage] = useState(localStorage.getItem('draft_lang') || 'javascript');
  const [codeSnippet, setCodeSnippet] = useState(localStorage.getItem('draft_code') || '');
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(() => {
    const saved = localStorage.getItem('draft_result');
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError] = useState(null);
  const { socket } = useContext(AuthContext);
  const [aiProgressText, setAiProgressText] = useState('Uploading code snippet for AI processing...');
  const [saveHistory, setSaveHistory] = useState(true);

  const languages = [
    { id: 'javascript', name: 'JavaScript / React' },
    { id: 'python', name: 'Python' },
    { id: 'typescript', name: 'TypeScript' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' },
    { id: 'go', name: 'Go' },
    { id: 'ruby', name: 'Ruby' },
    { id: 'php', name: 'PHP' },
    { id: 'rust', name: 'Rust' },
    { id: 'kotlin', name: 'Kotlin' },
    { id: 'swift', name: 'Swift' },
    { id: 'csharp', name: 'C#' },
    { id: 'sql', name: 'SQL' },
    { id: 'shell', name: 'Shell / Bash' },
    { id: 'dart', name: 'Dart' },
    { id: 'scala', name: 'Scala' }
  ];

  useEffect(() => {
    if (socket) {
      const handleProgress = (msg) => setAiProgressText(msg);
      socket.on('aiProgress', handleProgress);
      return () => socket.off('aiProgress', handleProgress);
    }
  }, [socket]);

  // Persistence logic
  useEffect(() => {
    localStorage.setItem('draft_title', title);
  }, [title]);

  useEffect(() => {
    localStorage.setItem('draft_code', codeSnippet);
  }, [codeSnippet]);

  useEffect(() => {
    localStorage.setItem('draft_lang', language);
  }, [language]);

  useEffect(() => {
    if (result) {
      localStorage.setItem('draft_result', JSON.stringify(result));
    } else {
      localStorage.removeItem('draft_result');
    }
  }, [result]);

  useEffect(() => {
    if (isManualOverride) return;

    const timer = setTimeout(() => {
      if (codeSnippet.length > 5) {
        try {
          const detect = hljs.highlightAuto(codeSnippet);
          if (detect.language) {
            let lang = detect.language.toLowerCase();
            const mapping = {
              'js': 'javascript', 'javascript': 'javascript', 'jsx': 'javascript', 'node': 'javascript',
              'ts': 'typescript', 'typescript': 'typescript', 'tsx': 'typescript',
              'py': 'python', 'python': 'python',
              'java': 'java',
              'cpp': 'cpp', 'c++': 'cpp', 'c': 'cpp',
              'go': 'go', 'golang': 'go',
              'rb': 'ruby', 'ruby': 'ruby',
              'php': 'php',
              'rs': 'rust', 'rust': 'rust',
              'kt': 'kotlin', 'kotlin': 'kotlin',
              'swift': 'swift',
              'cs': 'csharp', 'csharp': 'csharp',
              'sql': 'sql',
              'sh': 'shell', 'bash': 'shell', 'shell': 'shell',
              'dart': 'dart',
              'scala': 'scala'
            };
            
            const standardLang = mapping[lang];
            if (standardLang && standardLang !== language) {
              setLanguage(standardLang);
            }
          }
        } catch (e) {}
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [codeSnippet, language, isManualOverride]);

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
        saveToHistory: saveHistory,
      });
      setResult(data);
      // We no longer remove items here immediately, 
      // so they stay on refresh until user starts a new draft or closes it.
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze code.');
    } finally {
      setLoading(false);
    }
  };

  const currentLangName = languages.find(l => l.id === language)?.name || language;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-main">
      {!saveHistory && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-500">
           <ZapOff className="h-3.5 w-3.5 text-amber-500" />
           <p className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-widest">Temporary Mode is ON — <span className="font-medium text-sec lowercase tracking-normal normal-case">Reviews will not be stored in your history.</span></p>
        </div>
      )}
      <div className="border-b border-col bg-sec p-4 shadow-sm relative z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex w-full sm:w-auto items-center gap-4 flex-1">
             <input
               type="text"
               placeholder="Review Title (e.g. Authentication Bug)"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               className="glass-input flex-1 sm:max-w-xs font-bold"
             />
             
             {/* Smart Language Badge */}
             <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 font-bold text-xs whitespace-nowrap shadow-sm group ${
                    isManualOverride 
                      ? 'border-primary-500/50 bg-primary-500/5 text-primary-600' 
                      : 'border-col bg-ter/30 text-sec hover:border-primary-500/30'
                  }`}
                  title="Click to manually change language"
                >
                  {!isManualOverride && <Sparkles className="h-3 w-3 text-primary-500 animate-pulse" />}
                  {isManualOverride ? 'Manual' : 'Detected'}: {currentLangName}
                  <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${showLanguageMenu ? 'rotate-180' : ''}`} />
                </button>

                {showLanguageMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLanguageMenu(false)}></div>
                    <div className="absolute top-full mt-2 left-0 w-48 glass-panel shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                      <div className="px-3 py-2 border-b border-col/50 bg-ter/50">
                         <p className="text-[10px] uppercase font-black text-sec tracking-wider">Select Language</p>
                      </div>
                      <div className="p-1">
                        {languages.map((l) => (
                          <button
                            key={l.id}
                            onClick={() => {
                              setLanguage(l.id);
                              setIsManualOverride(true);
                              setShowLanguageMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between group ${
                              language === l.id ? 'bg-primary-500 text-white shadow-lg' : 'text-sec hover:bg-sec hover:text-main'
                            }`}
                          >
                            {l.name}
                            {language === l.id && <CheckCircle className="h-3 w-3" />}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            setIsManualOverride(false);
                            setShowLanguageMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 mt-1 border-t border-col text-[10px] font-black uppercase text-primary-500 hover:bg-primary-500/5 transition-all"
                        >
                          Reset to Auto-Detect
                        </button>
                      </div>
                    </div>
                  </>
                )}
             </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold transition-colors ${saveHistory ? 'text-sec' : 'text-amber-500'}`}>
                 {saveHistory ? 'History ON' : 'Temporary Chat'}
              </span>
              <button 
                onClick={() => setSaveHistory(!saveHistory)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
                  !saveHistory ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-dark-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    !saveHistory ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !codeSnippet.trim()}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-primary-500/20"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" /> Analyze Code</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side - Editor */}
        <div className={`flex-1 flex flex-col ${result ? 'lg:w-1/2 border-r border-col' : 'w-full'} transition-all`}>
          <div className="bg-sec border-b border-col px-4 py-2 flex justify-between items-center">
             <div className="flex items-center gap-2 text-sm text-sec font-bold uppercase tracking-wider">
               <Code className="h-4 w-4" />
               Source Code
             </div>
          </div>
          <div className="flex-1 bg-main relative">
             <Editor
               height="100%"
               language={language}
               theme={theme === 'dark' ? 'vs-dark' : 'vs'}
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
          <div className="flex-1 flex flex-col lg:w-1/2 bg-ter/30 overflow-hidden relative">
            <div className="bg-sec border-b border-col px-4 py-2 flex justify-between items-center shadow-sm">
               <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 uppercase tracking-wider">
                 <Sparkles className="h-4 w-4" />
                 AI Analysis Results
               </div>
               {result && (
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${result.bugsFound > 0 ? 'bg-red-500/20 text-red-600 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'}`}>
                    {result.bugsFound > 0 ? <><AlertTriangle className="h-3 w-3" /> Issues Detected</> : <><CheckCircle className="h-3 w-3" /> Looks Good</>}
                  </div>
               )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-transparent pb-8">
               {loading && (
                 <div className="flex flex-col items-center justify-center h-full text-sec gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                    <p className="animate-pulse font-bold">{aiProgressText}</p>
                 </div>
               )}

               {error && (
                 <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-600 flex items-start gap-3">
                   <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                   <div>
                     <h4 className="font-bold mb-1">Analysis Failed</h4>
                     <p className="text-sm font-medium">{error}</p>
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
                      {result.aiFeedback.trim().replace(/^#+\s*(Code Review|AI Code Review).*\n/i, '')}
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
