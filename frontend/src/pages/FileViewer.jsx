import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Sparkles, Loader2, Clock, GitBranch, 
  FileCode, CheckCircle, X, ChevronRight, Edit2, 
  Trash2, AlignLeft, ShieldCheck, Cpu, Database, 
  History, Globe, Box, Save, RotateCcw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from '@monaco-editor/react';
import { ThemeContext } from '../context/ThemeContext';

const FileViewer = () => {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const { id: projectId, fileId } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [viewingVersion, setViewingVersion] = useState(null);

  // Tactical Progress Triggers
  const [aiProgressText, setAiProgressText] = useState('Initializing operational analysis...');

  const loadVersionData = (v) => {
    if (!v) return;
    console.log('Synchronizing view to version:', v.versionNumber);
    setViewingVersion(v);
    setEditedContent(v.content);
    setReviewResult(v.reviewId || null);
    setIsEditing(false);
  };

  const fetchFile = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/files/${fileId}`);
      setFile(data);
      
      let currentV = data.versions.find(v => v.versionNumber === data.currentVersion);
      if (!currentV && data.versions.length > 0) {
         currentV = data.versions[data.versions.length - 1];
      }

      if (currentV) {
         loadVersionData(currentV);
         setViewingVersion(null);
      }
    } catch (err) {
      console.error('FileViewer Load Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFile();
  }, [fileId]);

  const handleReview = async () => {
    if (!file) return;
    setReviewing(true);
    setReviewResult(null);
    setAiProgressText('Uploading file segment for AI processing...');
    try {
      const { data } = await axios.post('/api/reviews/analyze', {
        title: file.filename,
        codeSnippet: editedContent,
        language: file.language,
        fileId: file._id,
      });
      setReviewResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewing(false);
    }
  };

  const handleRestore = async (v) => {
    setSaving(true);
    try {
      const { data } = await axios.post(`/api/files/${fileId}/restore`, { versionNumber: v.versionNumber });
      setFile(data);
      const restoredV = data.versions.find(ver => ver.versionNumber === data.currentVersion);
      loadVersionData(restoredV);
      setViewingVersion(null);
    } catch (err) {
      console.error('Restore Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(`/api/files/${fileId}/history`);
      setHistoryData(data);
      setShowHistory(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    setSummary('');
    try {
      const { data } = await axios.post('/api/ai/summarize-file', { fileId });
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setSummarizing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await axios.put(`/api/files/${fileId}`, { content: editedContent });
      setFile(data);
      loadVersionData(data.versions.find(v => v.versionNumber === data.currentVersion));
      setViewingVersion(null);
      setIsEditing(false);
    } catch (err) {
      console.error('Save Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditedContent(file.versions.find(v => v.versionNumber === file.currentVersion)?.content || file.content);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 grayscale opacity-40">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Synchronizing File Node...</p>
      </div>
    );
  }

  if (!file) return (
    <div className="flex flex-col items-center justify-center py-20 grayscale opacity-40">
       <X className="h-10 w-10 text-rose-500 mb-4" />
       <p className="text-[10px] font-black uppercase tracking-[0.3em]">File Node Terminated or Missing</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-main relative">
      
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-96 bg-sec/95 backdrop-blur-xl border-l border-col/30 shadow-2xl z-[1000] flex flex-col"
            >
              <div className="p-6 border-b border-col/30 flex items-center justify-between">
                <h3 className="text-xs font-black text-sec uppercase tracking-[0.2em] flex items-center gap-2">
                  <History className="h-4 w-4 text-primary-500" />
                  Version Records
                </h3>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-ter rounded-lg text-sec transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="flex flex-col gap-3">
                  {historyData?.versions?.slice().reverse().map((v) => (
                    <div 
                      key={v._id} 
                      className={`group p-4 rounded-xl border transition-all cursor-pointer relative ${
                        (viewingVersion?.versionNumber === v.versionNumber || (!viewingVersion && v.versionNumber === file.currentVersion)) 
                          ? 'border-primary-500 bg-primary-500/10' 
                          : 'bg-ter/20 hover:bg-ter/40 border-col/30 hover:border-primary-500/30'
                      }`}
                      onClick={() => {
                        loadVersionData(v);
                        if (v.versionNumber === file.currentVersion) setViewingVersion(null);
                        setShowHistory(false);
                      }}
                    >
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[11px] font-black text-main leading-tight uppercase tracking-widest">
                             Version {v.versionNumber}
                           </h4>
                           {v.versionNumber === file.currentVersion && (
                             <span className="text-[8px] font-black text-primary-500 px-1.5 py-0.5 bg-primary-500/10 rounded uppercase tracking-tighter">Latest Node</span>
                           )}
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] text-sec font-bold opacity-40 uppercase">
                             {new Date(v.updatedAt).toLocaleDateString()} {new Date(v.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                           <span className="text-[9px] text-primary-500 font-black uppercase tracking-widest italic opacity-60">
                             by {v.updatedBy?.name || 'Owner'}
                           </span>
                        </div>
                      </div>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <ChevronRight className="h-3 w-3 text-primary-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="border-b border-col/30 bg-sec/40 backdrop-blur-md p-4 shadow-sm relative z-50 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-6 flex-1 min-w-0">
             <Link 
               to={`/projects/${projectId}`} 
               className="h-10 w-10 flex items-center justify-center bg-ter/30 hover:bg-ter border border-col/50 rounded-xl text-sec hover:text-main transition-all group shrink-0"
             >
               <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
             </Link>
             
             <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1">
                   <h1 className="text-xl font-black text-main tracking-tighter truncate leading-none uppercase">
                     {file.filename}
                   </h1>
                   {(reviewResult || summary) && (
                     <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Analysis_Ready</span>
                     </div>
                   )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-sec font-bold opacity-50 uppercase tracking-[0.2em] italic">
                   <span className="flex items-center gap-1.5 text-primary-500"><RotateCcw className="h-3 w-3" /> V{viewingVersion ? viewingVersion.versionNumber : file.currentVersion}</span>
                   <span>•</span>
                   <span className="flex items-center gap-1.5"><Box className="h-3 w-3" /> {file.language}</span>
                   {viewingVersion && (
                     <>
                       <span>•</span>
                       <span className="text-rose-500 font-black tracking-widest bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">PREVIEW_MODE_ACTIVE</span>
                     </>
                   )}
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3">
             {viewingVersion ? (
               <div className="flex items-center gap-2 p-1 bg-ter/30 rounded-2xl border border-col/30">
                  <button 
                    onClick={() => {
                      const latest = file.versions.find(v => v.versionNumber === file.currentVersion);
                      loadVersionData(latest);
                      setViewingVersion(null);
                    }} 
                    className="h-10 px-5 text-[10px] font-black uppercase text-sec hover:text-main transition-colors"
                  >
                    Abort Preview
                  </button>
                  <button 
                    onClick={() => handleRestore(viewingVersion)} 
                    disabled={saving} 
                    className="h-10 px-6 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
                    Restore Version
                  </button>
               </div>
             ) : !isEditing ? (
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 border-r border-col/30 pr-3">
                    <button 
                      onClick={fetchHistory} 
                      className="h-10 w-10 flex items-center justify-center bg-ter/30 hover:bg-ter border border-col/50 rounded-xl text-sec transition-all"
                      title="Version Records"
                    >
                      <History className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="h-10 px-4 bg-primary-500/5 hover:bg-primary-500/10 border border-primary-500/20 rounded-xl text-[10px] font-black text-primary-500 flex items-center gap-2 transition-all uppercase tracking-widest"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit Buffer
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleSummarize} 
                      disabled={summarizing} 
                      className="h-10 px-4 bg-ter/30 hover:bg-ter border border-col/50 rounded-xl text-[10px] font-black text-main flex items-center gap-2 transition-all uppercase tracking-widest"
                    >
                      {summarizing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-500" /> : <FileCode className="h-3.5 w-3.5 text-primary-500" />}
                      Summary
                    </button>
                    <button 
                      onClick={handleReview} 
                      disabled={reviewing} 
                      className="h-10 px-6 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-[10px] font-black flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-primary-500/10 uppercase tracking-widest"
                    >
                      {reviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Analyze Code
                    </button>
                  </div>
               </div>
             ) : (
               <div className="flex items-center gap-2 p-1 bg-ter/30 rounded-2xl border border-col/30">
                  <button onClick={cancelEdit} disabled={saving} className="h-10 px-5 text-[10px] font-black uppercase text-sec hover:text-main transition-colors">Abort Changes</button>
                  <button 
                    onClick={handleSave} 
                    disabled={saving || editedContent === file.content} 
                    className="h-10 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black flex items-center gap-2 transition-all"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Commit Version
                  </button>
               </div>
             )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {summary && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-primary-500/5 border-b border-primary-500/10 overflow-hidden relative"
          >
             <div className="max-w-7xl mx-auto p-6 flex gap-6 items-start relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-500/30"></div>
                <div className="h-12 w-12 bg-main border border-primary-500/30 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary-500/10 group-hover:bg-primary-500/20 transition-colors"></div>
                  <AlignLeft className="h-6 w-6 text-primary-500 relative z-10" />
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.4em] flex items-center gap-3">
                        Operational Intelligence Briefing
                      </h4>
                      <button onClick={() => setSummary('')} className="text-[9px] font-black text-sec hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-2">
                        Dismiss <X className="h-3 w-3" />
                      </button>
                   </div>
                   <div className="text-[13px] font-bold text-main leading-relaxed tracking-tight italic">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className={`flex-1 flex flex-col min-w-0 ${reviewResult ? 'lg:w-1/2' : 'w-full'} transition-all duration-500 relative bg-main`}>
          <div className="h-10 bg-sec/30 border-b border-col/20 px-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 text-primary-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-sec opacity-60">Technical_Buffer</span>
            </div>
            {isEditing && (
              <div className="flex items-center gap-2">
                 <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[9px] font-black uppercase text-emerald-500">Live_Writing_Enabled</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={file.language}
              theme={theme === 'dark' ? 'vs-dark' : 'vs'}
              value={editedContent}
              onChange={(val) => setEditedContent(val || '')}
              options={{
                readOnly: !isEditing,
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

        {reviewResult && (
          <div className="hidden lg:block w-[1px] bg-col/30 shrink-0 relative z-10">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/20 to-transparent"></div>
          </div>
        )}

        <AnimatePresence>
          {reviewResult && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col lg:w-1/2 bg-ter/5 overflow-hidden relative"
            >
              <div className="h-10 bg-sec/30 border-b border-col/20 px-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-sec opacity-60">Audit_Telemetry_Output</span>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 border ${reviewResult.bugsFound > 0 ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                  {reviewResult.bugsFound > 0 ? <Loader2 className="h-3 w-3 animate-spin text-rose-500" /> : <ShieldCheck className="h-3 w-3" />}
                  {reviewResult.bugsFound > 0 ? `${reviewResult.bugsFound} Critical Anomalies` : 'High_Integrity_Confirmed'}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative pb-20">
                {reviewing && (
                  <div className="flex flex-col items-center justify-center h-full text-sec gap-4 bg-main/40 backdrop-blur-sm z-50 absolute inset-0">
                    <Cpu className="h-10 w-10 animate-spin text-primary-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">{aiProgressText}</p>
                  </div>
                )}

                <div className="ai-feedback-content animate-in fade-in duration-700">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-xl font-black text-main mb-6 border-b border-col/30 pb-4 uppercase tracking-tighter">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-black text-primary-500 uppercase tracking-[0.2em] mt-10 mb-4 flex items-center gap-3"><div className="h-1 w-3 bg-primary-500/40"></div>{children}</h2>,
                      p: ({ children }) => <p className="text-[14px] leading-relaxed text-sec font-medium mb-5">{children}</p>,
                      li: ({ children }) => <li className="text-[14px] leading-relaxed text-sec font-medium mb-3 pl-4 border-l-2 border-primary-500/10 hover:border-primary-500/30 transition-colors uppercase tracking-tight">{children}</li>,
                      table: ({ children }) => <div className="my-10 rounded-2xl border border-col/30 bg-sec/10 overflow-hidden shadow-2xl">{children}</div>,
                      thead: ({ children }) => <thead className="bg-ter/30 border-b border-col/30 text-[9px] font-black uppercase tracking-[0.3em] text-sec">{children}</thead>,
                      tbody: ({ children }) => <tbody className="text-xs font-bold text-main">{children}</tbody>,
                      tr: ({ children }) => <tr className="border-b border-col/10 last:border-0 hover:bg-white/5 transition-colors">{children}</tr>,
                      td: ({ children }) => <td className="p-5">{children}</td>,
                      th: ({ children }) => <th className="p-5 text-left font-black">{children}</th>,
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="my-8 relative group mb-10">
                            <div className="absolute top-0 right-0 px-3 py-1 bg-ter/80 backdrop-blur-md text-[8px] font-black text-sec rounded-bl-xl uppercase tracking-widest border-l border-b border-col/30 z-10">{match[1]}</div>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              customStyle={{ background: '#0a0a0a', borderRadius: '16px', padding: '24px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className="bg-ter text-primary-500 px-2 py-0.5 rounded-lg font-mono text-[11px] font-black uppercase tracking-tight" {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {(reviewResult.aiFeedback || '').replace(/^#+\s*(Code Review|AI Code Review|Syncodalyze AI).*\n/i, '')}
                  </ReactMarkdown>
                </div>
              </div>
              
              <button 
                onClick={() => setReviewResult(null)}
                className="absolute bottom-6 right-6 h-12 w-12 bg-main hover:bg-ter border border-col/50 rounded-2xl flex items-center justify-center text-sec hover:text-rose-500 transform hover:rotate-90 transition-all shadow-2xl z-20 group"
              >
                 <X className="h-5 w-5" />
                 <div className="absolute top-full mt-2 right-0 bg-sec border border-col px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Close_Analysis</div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FileViewer;
