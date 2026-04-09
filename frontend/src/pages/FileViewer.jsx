import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2, Clock, GitBranch } from 'lucide-react';
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
import Editor from '@monaco-editor/react';
const FileViewer = () => {
  const { theme } = useContext(ThemeContext);
  const { id: projectId, fileId } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const { data } = await axios.get(`/api/files/${fileId}`);
        setFile(data);
        setEditedContent(data.content);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFile();
  }, [fileId]);

  const handleReview = async () => {
    if (!file) return;
    setReviewing(true);
    setReviewResult(null);
    try {
      const { data } = await axios.post('/api/reviews/analyze', {
        title: file.filename,
        codeSnippet: file.content,
        language: file.language,
      });
      setReviewResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewing(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(`/api/files/${fileId}/history`);
      setHistory(data);
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

  const cancelEdit = () => {
    setEditedContent(file.content);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!file) return <div className="text-center py-20 text-gray-400">File not found.</div>;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="border-b border-col bg-sec p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/projects/${projectId}`} className="text-sec hover:text-main transition-colors font-medium">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-bold text-lg">{file.filename}</h1>
              <p className="text-xs text-sec">v{file.currentVersion} · {file.language}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {!isEditing ? (
              <>
                <button onClick={fetchHistory} className="btn-secondary flex items-center gap-2 text-sm font-bold">
                  <GitBranch className="h-4 w-4" /> History
                </button>
                <button onClick={() => setIsEditing(true)} className="btn-secondary border-primary-500/30 text-primary-600 flex items-center gap-2 text-sm font-bold">
                   Edit File
                </button>
                <button onClick={handleReview} disabled={reviewing} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 font-bold shadow-lg shadow-emerald-500/10">
                  {reviewing ? <><Loader2 className="h-4 w-4 animate-spin" /> Reviewing...</> : <><Sparkles className="h-4 w-4" /> AI Review</>}
                </button>
                <button onClick={handleSummarize} disabled={summarizing} className="btn-primary bg-purple-600 border-purple-700 hover:bg-purple-700 flex items-center gap-2 text-sm disabled:opacity-50 font-bold shadow-lg shadow-purple-500/10">
                  {summarizing ? <><Loader2 className="h-4 w-4 animate-spin" /> Summarizing...</> : <><FileCode className="h-4 w-4" /> AI Summary</>}
                </button>
              </>
            ) : (
              <>
                <button onClick={cancelEdit} disabled={saving} className="btn-secondary text-sm">Cancel</button>
                <button onClick={handleSave} disabled={saving || editedContent === file.content} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Save Version'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Summary Banner */}
      {summary && (
        <div className="bg-purple-500/10 border-b border-purple-500/20 p-6 animate-in slide-in-from-top-2 duration-300">
           <div className="max-w-7xl mx-auto flex gap-6 items-start">
              <div className="h-12 w-12 bg-purple-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30">
                <FileCode className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                 <h4 className="text-sm font-black text-purple-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                   AI File Logic Summary
                   <button onClick={() => setSummary('')} className="ml-auto text-sec hover:text-main text-xs normal-case font-bold">Dismiss</button>
                 </h4>
                 <div className="text-sm text-main font-medium leading-relaxed prose prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Code Viewer */}
        <div className={`flex-1 ${reviewResult ? 'lg:w-1/2 border-r border-col' : 'w-full'}`}>
           <div className="bg-main h-full">
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
                 padding: { top: 16 },
               }}
             />
           </div>
        </div>

        {/* Review Results */}
        {reviewResult && (
          <div className="flex-1 lg:w-1/2 overflow-y-auto bg-ter/30 p-6">
            <h3 className="text-lg font-bold text-emerald-600 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> AI Review Result
            </h3>
            <div className="ai-feedback-content">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={theme === 'dark' ? vscDarkPlus : undefined}
                        customStyle={{ background: 'transparent' }}
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
                {(reviewResult.aiFeedback || '').replace(/^#+\s*(Code Review|AI Code Review).*\n/i, '')}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Version History Sidebar */}
      {showHistory && history && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
          <div className="glass-panel w-96 h-full p-6 overflow-y-auto border-l border-col shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-main"><Clock className="h-5 w-5 text-primary-600" /> Version History</h3>
              <button onClick={() => setShowHistory(false)} className="text-sec hover:text-main text-2xl transition-colors">&times;</button>
            </div>
            <div className="space-y-3">
              {history.versions.slice().reverse().map((v) => (
                <div key={v._id} className={`p-4 rounded-lg border transition-all ${v.versionNumber === history.currentVersion ? 'border-primary-500 bg-primary-500/10 shadow-sm' : 'border-col bg-ter/50 hover:bg-ter'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-main">Version {v.versionNumber}</span>
                    {v.versionNumber === history.currentVersion && (
                      <span className="text-[10px] bg-primary-500/20 text-primary-600 px-2 py-0.5 rounded border border-primary-500/30 font-bold uppercase tracking-wider">Current</span>
                    )}
                  </div>
                  <p className="text-[10px] text-sec mt-1 font-bold">{new Date(v.updatedAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileViewer;
