import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import hljs from 'highlight.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ThemeContext } from '../context/ThemeContext';
import { AlertTriangle, CheckCircle, Loader2, Code, Sparkles, ChevronDown, ZapOff, FileCode, Upload, History, X, ChevronRight, Trash2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const hasReset = useRef(false);
  const fileInputRef = useRef(null);

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

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data } = await axios.get('/api/reviews');
      // Filter for ad-hoc reviews only
      setHistory(data.filter(r => !r.fileId).slice(0, 15));
    } catch (err) {
      console.error('Failed to fetch ad-hoc history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

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
      fetchHistory(); // Refresh history on new result
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
        } catch (e) { }
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!codeSnippet.trim()) return;
    setSummarizing(true);
    setSummary('');
    try {
      const { data } = await axios.post('/api/ai/summarize-snippet', {
        title: title || 'Untitled Snippet',
        codeSnippet,
        language,
      });
      setSummary(data.summary);
    } catch (err) {
      console.error('Summary Error:', err);
    } finally {
      setSummarizing(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setTitle(file.name.split('.')[0]);
    setIsManualOverride(false);

    const reader = new FileReader();

    // Sovereign Extension Guard: Neutralize media, PDFs, and binary artifacts
    const forbiddenExts = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'mp3', 'wav', 'zip', 'tar', 'gz', 'exe', 'bin'];
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (forbiddenExts.includes(ext)) {
      setError(`File type ".${ext}" is not supported for analysis. Please upload a source code file.`);
      return;
    }

    reader.onload = (ev) => {
      setCodeSnippet(ev.target.result);
      
      const langMap = {
        js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
        py: 'python', java: 'java', cpp: 'cpp', c: 'cpp', go: 'go',
        rb: 'ruby', php: 'php', rs: 'rust', kt: 'kotlin', swift: 'swift',
        cs: 'csharp', sql: 'sql', sh: 'shell', bash: 'shell',
        dart: 'dart', scala: 'scala'
      };
      if (langMap[ext]) {
        setLanguage(langMap[ext]);
        setIsManualOverride(true);
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    setCodeSnippet('');
    setTitle('');
    setResult(null);
    setError(null);
    setSummary('');
    setIsManualOverride(false);
    // Persist the clear to localStorage
    localStorage.removeItem('draft_code');
    localStorage.removeItem('draft_title');
    localStorage.removeItem('draft_result');
  };

  useEffect(() => {
    // Sovereign Guard: Ensure reset logic only runs once per mount
    if (hasReset.current) return;
    
    const isNewIntent = searchParams.get('new') === 'true';
    const isUploadIntent = searchParams.get('upload') === 'true';

    if (isNewIntent) {
      hasReset.current = true;
      
      // Liquidate Draft Cache
      localStorage.removeItem('draft_title');
      localStorage.removeItem('draft_code');
      localStorage.removeItem('draft_lang');
      localStorage.removeItem('draft_result');
      
      // Reset State Hub
      setTitle('');
      setCodeSnippet('');
      setLanguage('javascript');
      setResult(null);
      setSummary('');
      
      // Navigate/Clean URL without triggering reload
      if (isUploadIntent) {
        setSearchParams({ upload: 'true' }, { replace: true });
        // Immediate trigger for better browser trust
        if (fileInputRef.current) fileInputRef.current.click();
      } else {
        setSearchParams({}, { replace: true });
      }
    } else if (isUploadIntent) {
      hasReset.current = true;
      // Handle direct upload intent if it bypasses the "new" flag
      setSearchParams({}, { replace: true });
      if (fileInputRef.current) fileInputRef.current.click();
    }
  }, [searchParams, setSearchParams]);

  const currentLangName = languages.find(l => l.id === language)?.name || language;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-main relative">
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-sec/95 backdrop-blur-xl border-l border-col/30 shadow-2xl z-[1000] flex flex-col"
            >
              <div className="p-6 border-b border-col/30 flex items-center justify-between">
                <h3 className="text-xs font-black text-sec uppercase tracking-[0.2em] flex items-center gap-2">
                  <History className="h-4 w-4 text-primary-500" />
                  Audit History
                </h3>
                <button 
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-2 hover:bg-ter rounded-lg text-sec transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {historyLoading ? (
                  <div className="flex flex-col gap-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-16 bg-ter/30 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-20 opacity-20">
                     <FileCode className="h-10 w-10 text-sec mx-auto mb-4" />
                     <p className="text-[10px] text-sec font-bold uppercase tracking-widest text-center">Archive Empty</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {history.map((h) => (
                      <div 
                        key={h._id} 
                        className="group bg-ter/20 hover:bg-ter/40 border border-col/30 hover:border-primary-500/30 rounded-xl p-4 transition-all cursor-pointer relative"
                        onClick={() => window.open(`/review/${h._id}`, '_blank')}
                      >
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <h4 className="text-[11px] font-bold text-main truncate pr-6 leading-tight uppercase">
                            {h.title || 'Untitled Session'}
                          </h4>
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <div className={`h-1.5 w-1.5 rounded-full ${h.bugsFound > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                <span className="text-[9px] font-bold text-sec uppercase opacity-60">
                                  {h.language}
                                </span>
                             </div>
                             <span className={`text-[9px] font-bold uppercase ${h.bugsFound > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                               {h.bugsFound > 0 ? `${h.bugsFound} Issues` : 'Integrated'}
                             </span>
                          </div>
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <ChevronRight className="h-3 w-3 text-primary-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-col/30">
                 <Link to="/reviews" className="flex items-center justify-center gap-2 w-full h-10 bg-ter/30 hover:bg-ter border border-col/50 rounded-xl text-[10px] uppercase font-bold text-main transition-all">
                    Full Records Archive <ChevronRight className="h-3 w-3" />
                 </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!saveHistory && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-500 shrink-0">
            <ZapOff className="h-3.5 w-3.5 text-amber-500" />
            <p className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-widest">Temporary Mode is ON — <span className="font-medium text-sec lowercase tracking-normal normal-case">Reviews will not be stored in your history.</span></p>
          </div>
        )}

        {/* Clean Sovereign Header */}
        <div className="border-b border-col/30 bg-sec/40 backdrop-blur-md p-4 shadow-sm relative z-50 shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex w-full md:w-auto items-center gap-3 flex-1">
              <input
                type="text"
                placeholder="Audit Session Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-ter/30 border border-col/50 rounded-xl h-10 px-4 text-xs font-bold text-main focus:border-primary-500/50 transition-all outline-none placeholder:text-sec/40 flex-1 max-w-sm"
              />

              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className={`flex items-center gap-2 px-3 h-10 rounded-xl border transition-all duration-200 font-bold text-xs shadow-sm group ${isManualOverride
                      ? 'border-primary-500/50 bg-primary-500/5 text-primary-500'
                      : 'border-col bg-ter/20 text-sec hover:border-primary-500/30'
                    }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  {currentLangName}
                  <ChevronDown className={`h-3 w-3 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} />
                </button>

                {showLanguageMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLanguageMenu(false)}></div>
                    <div className="absolute top-full mt-2 left-10 w-52 glass-panel shadow-2xl overflow-hidden z-50 border-col/50 bg-sec animate-in fade-in duration-200">
                      <div className="p-1 max-h-72 overflow-y-auto custom-scrollbar">
                        {languages.map((l) => (
                          <button
                            key={l.id}
                            onClick={() => {
                              setLanguage(l.id);
                              setIsManualOverride(true);
                              setShowLanguageMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between group ${language === l.id ? 'bg-primary-500 text-white shadow-lg' : 'text-sec hover:bg-ter hover:text-main'
                              }`}
                          >
                            {l.name}
                            {language === l.id && <CheckCircle className="h-3 w-3" />}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setIsManualOverride(false);
                          setShowLanguageMenu(false);
                        }}
                        className="w-full text-center py-2.5 border-t border-col/30 text-[10px] font-black uppercase text-primary-500 hover:bg-primary-500/5 transition-all"
                      >
                        Auto-Detect Mode
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 h-10 bg-ter/20 rounded-xl border border-col/40">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${saveHistory ? 'text-sec' : 'text-amber-500'}`}>
                   {saveHistory ? 'History On' : 'History Off'}
                </span>
                <button
                  onClick={() => setSaveHistory(!saveHistory)}
                  className={`relative inline-flex h-4 w-9 items-center rounded-full transition-all duration-300 focus:outline-none ${!saveHistory ? 'bg-amber-500' : 'bg-dark-600'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${!saveHistory ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

              <div className="flex items-center gap-2 border-l border-col/30 pl-2">
                <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="p-2.5 bg-ter/30 hover:bg-ter border border-col/50 hover:border-primary-500/30 rounded-xl text-sec hover:text-main transition-all"
                  >
                    <History className="h-4 w-4" />
                </button>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 bg-ter/30 hover:bg-ter border border-col/50 hover:border-primary-500/30 rounded-xl text-sec hover:text-main transition-all"
                  >
                    <Upload className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 border-l border-col/30 pl-2">
                <button
                    onClick={handleSummarize}
                    disabled={summarizing || !codeSnippet.trim()}
                    className="h-10 px-4 bg-ter/30 hover:bg-ter border border-col/50 hover:border-primary-500/30 rounded-xl text-[11px] font-bold text-main flex items-center gap-2 disabled:opacity-30 transition-all"
                  >
                    {summarizing ? <Loader2 className="h-4 w-4 animate-spin text-primary-500" /> : <FileCode className="h-4 w-4 text-primary-500" />}
                    Summary
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !codeSnippet.trim()}
                  className="h-10 px-6 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-2 disabled:opacity-30 transition-all shadow-lg shadow-primary-500/10 active:scale-95"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Finalize Review
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary Banner */}
        {summary && (
          <div className="bg-purple-500/10 border-b border-purple-500/20 p-6 animate-in slide-in-from-top-2 duration-300 shrink-0">
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 items-start">
                <div className="h-10 w-10 bg-purple-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30">
                  <FileCode className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                   <h4 className="text-sm font-black text-purple-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                     Snippet Logic Overview
                     <button onClick={() => setSummary('')} className="ml-auto text-sec hover:text-main text-xs normal-case font-bold">Dismiss</button>
                   </h4>
                   <div className="text-sm text-main font-medium leading-relaxed ai-feedback-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Content Area - Clean Sovereign Dual Pane */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Editor Pane */}
          <div className={`flex-1 flex flex-col min-w-0 ${(result || loading || error) ? 'lg:w-1/2' : 'w-full'} transition-all duration-500 relative bg-main`}>
            <div className="bg-sec/30 border-b border-col/20 px-4 py-2 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Code className="h-3.5 w-3.5 text-primary-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-sec">Technical Editor</span>
              </div>
              <button
                onClick={handleClear}
                className="text-[9px] font-bold uppercase text-sec/60 hover:text-red-500 transition-colors"
                title="Clear Workspace"
              >
                Clear Buffer
              </button>
            </div>
            
            <div className="flex-1 relative">
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
                  padding: { top: 20 },
                  scrollBeyondLastLine: false,
                  scrollbar: { vertical: 'visible', verticalScrollbarSize: 8 }
                }}
              />
            </div>
          </div>

          {(result || loading || error) && (
            <div className="hidden lg:block w-[1px] bg-col/30 shrink-0"></div>
          )}

          {/* Results Pane */}
          <AnimatePresence>
            {(result || error || loading) && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="flex-1 flex flex-col lg:w-1/2 bg-ter/5 overflow-hidden relative"
              >
                <div className="bg-sec/30 border-b border-col/20 px-4 py-2 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sec">Audit Output</span>
                  </div>
                  {result && (
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase flex items-center gap-1.5 border ${result.bugsFound > 0 ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                      {result.bugsFound > 0 ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                      {result.bugsFound > 0 ? `${result.bugsFound} Issues` : 'Integrated'}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative pb-12">
                  {loading && (
                    <div className="flex flex-col items-center justify-center h-full text-sec gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                      <p className="text-[10px] font-bold uppercase tracking-widest animate-pulse">{aiProgressText}</p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-xl text-red-600 flex items-start gap-4">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <div>
                        <h4 className="font-bold uppercase tracking-widest text-xs mb-1">Execution Error</h4>
                        <p className="text-xs font-semibold leading-relaxed">{error}</p>
                      </div>
                    </div>
                  )}

                  {result && (
                    <div className="ai-feedback-content animate-in fade-in duration-500">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => <h1 className="text-lg font-bold text-main mb-6 border-b border-col/30 pb-3">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-bold text-primary-500 uppercase tracking-widest mt-8 mb-3 flex items-center gap-2"><div className="h-1 w-1 bg-primary-500"></div>{children}</h2>,
                          p: ({ children }) => <p className="text-[13px] leading-relaxed text-sec mb-4">{children}</p>,
                          li: ({ children }) => <li className="text-[13px] leading-relaxed text-sec mb-2 pl-3 border-l-2 border-ter">{children}</li>,
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <div className="my-6 relative">
                                <div className="absolute top-0 right-0 px-2 py-0.5 bg-ter text-[8px] font-bold text-sec rounded-bl-lg uppercase">{match[1]}</div>
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  customStyle={{ background: '#0a0a0a', borderRadius: '12px', padding: '16px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.05)' }}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                              <code className="bg-ter text-primary-500 px-1.5 py-0.5 rounded font-mono text-[12px]" {...props}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {result.aiFeedback.trim().replace(/^#+\s*(Code Review|AI Code Review|Syncodalyze AI).*\n/i, '')}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default NewReview;
