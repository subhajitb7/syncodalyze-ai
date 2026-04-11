import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import hljs from 'highlight.js';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileCode, Plus, FolderOpen, ArrowLeft, X, Upload, Trash2,
  RefreshCw, Settings, ChevronDown, CheckCircle, Sparkles,
  MessageSquare, ListTodo, AlertCircle
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { ThemeContext } from '../context/ThemeContext';
import { SocketPubSubContext } from '../context/SocketPubSubContext';
import CommentSection from '../components/CommentSection';
import ConfirmModal from '../components/ConfirmModal';

const ProjectDetail = () => {
  const { theme } = useContext(ThemeContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [fileForm, setFileForm] = useState({ filename: '', content: '', language: 'javascript' });
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [messages, setMessages] = useState([]);
  const [liveToast, setLiveToast] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [uploadQueue, setUploadQueue] = useState([]); // New Bulk Queue
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [userRole, setUserRole] = useState('member');
  const [uploadError, setUploadError] = useState(null);

  // Unified Confirmation State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const { subscribe, socket } = useContext(SocketPubSubContext);

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

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(`/api/projects/${id}/comments`);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const fetchProject = async () => {
    try {
      const { data } = await axios.get(`/api/projects/${id}`);
      setProject(data);
      if (data.team?.members) {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const member = data.team.members.find(m => (m.user?._id || m.user) === currentUser?._id);
        if (member) setUserRole(member.role);
      }
      fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  // Subscribe to Real-Time Pub/Sub (Only for Team Projects)
  useEffect(() => {
    if (!id || !project?.team) return;

    const unsubscribe = subscribe(`project:${id}`, (event) => {
      if (event.type === 'NEW_MESSAGE') {
        const msg = event.data;
        setMessages(prev => {
          // Prevent duplicates
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        // Show unread notification if drawer is closed
        if (!chatOpen) {
          setLiveToast(msg);
          setTimeout(() => setLiveToast(null), 5000);
        }
      } else if (event.type === 'TYPING_START') {
        setTypingUser(event.data.userName);
      } else if (event.type === 'TYPING_STOP') {
        setTypingUser(null);
      }
    });

    return () => unsubscribe();
  }, [id, subscribe, chatOpen]);



  useEffect(() => {
    if (isManualOverride) return;

    const timer = setTimeout(() => {
      if (fileForm.content.length > 5) {
        try {
          const detect = hljs.highlightAuto(fileForm.content);
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
            if (standardLang && standardLang !== fileForm.language) {
              setFileForm(prev => ({ ...prev, language: standardLang }));
            }
          }
        } catch (e) { }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [fileForm.content, fileForm.language, isManualOverride]);

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      if (isBulkMode && uploadQueue.length > 0) {
        await axios.post(`/api/projects/${id}/bulk-files`, { files: uploadQueue });
      } else {
        await axios.post(`/api/projects/${id}/files`, fileForm);
      }
      setShowUpload(false);
      setFileForm({ filename: '', content: '', language: 'javascript' });
      setUploadQueue([]);
      setIsBulkMode(false);
      fetchProject();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Upload failed');
    }
  };

  const processFiles = async (files) => {
    setUploadError(null);
    const newItems = [];
    const forbiddenExts = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'mp3', 'wav', 'zip', 'tar', 'gz', 'exe', 'bin'];

    for (const file of files) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (forbiddenExts.includes(ext)) {
        setUploadError(`File type ".${ext}" is not supported. Please upload source code files.`);
        continue; // Skip invalid file but allow others in bulk
      }

      const content = await file.text();
      let detectedLang = 'javascript';
      try {
        const detect = hljs.highlightAuto(content);
        if (detect.language) {
          const mapping = {
            'js': 'javascript', 'javascript': 'javascript', 'jsx': 'javascript', 'node': 'javascript',
            'ts': 'typescript', 'typescript': 'typescript', 'tsx': 'typescript',
            'py': 'python', 'python': 'python', 'java': 'java', 'cpp': 'cpp', 'go': 'go',
            'rs': 'rust', 'rb': 'ruby', 'php': 'php', 'sql': 'sql', 'sh': 'shell'
          };
          detectedLang = mapping[detect.language.toLowerCase()] || 'javascript';
        }
      } catch (e) { }

      newItems.push({
        filename: file.name,
        content,
        language: detectedLang
      });
    }
    if (newItems.length > 0) {
      setUploadQueue(prev => [...prev, ...newItems]);
      setIsBulkMode(true);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const removeFromQueue = (index) => {
    setUploadQueue(prev => prev.filter((_, i) => i !== index));
    if (uploadQueue.length <= 1) setIsBulkMode(false);
  };

  const handleSync = async () => {
    if (!project.repoUrl) return;
    setSyncing(true);
    try {
      await axios.post(`/api/projects/${id}/repo-sync`, { repoUrl: project.repoUrl });
      await fetchProject();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteProject = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Project?",
      message: "This will permanently remove all files and analysis results. This action cannot be undone.",
      onConfirm: async () => {
        try {
          await axios.delete(`/api/projects/${id}`);
          navigate('/projects');
        } catch (err) {
          alert(err.response?.data?.message || 'Failed to delete project');
        }
      }
    });
  };

  const handleDeleteFile = (e, fileId) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: "Delete File?",
      message: "Are you sure you want to delete this file from the project?",
      onConfirm: async () => {
        try {
          await axios.delete(`/api/projects/${id}/files/${fileId}`);
          fetchProject();
        } catch (err) {
          alert(err.response?.data?.message || 'Failed to delete file');
        }
      }
    });
  };

  const handleFileRead = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError(null);
    setIsManualOverride(false);

    const forbiddenExts = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'mp3', 'wav', 'zip', 'tar', 'gz', 'exe', 'bin'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (forbiddenExts.includes(ext)) {
      setUploadError(`File type ".${ext}" is not supported. Please upload a source code file.`);
      return;
    }

    const langMap = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', java: 'java', cpp: 'cpp', c: 'cpp', go: 'go',
      rb: 'ruby', php: 'php', rs: 'rust', kt: 'kotlin', swift: 'swift',
      cs: 'csharp', sql: 'sql', sh: 'shell', bash: 'shell',
      dart: 'dart', scala: 'scala',
      html: 'javascript', css: 'javascript', json: 'javascript', md: 'javascript',
    };
    const detectedLang = langMap[ext] || 'javascript';

    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileForm((prev) => ({
        ...prev,
        filename: file.name,
        content: ev.target.result,
        language: detectedLang,
      }));
    };
    reader.readAsText(file);
  };

  const currentLangName = languages.find(l => l.id === fileForm.language)?.name || fileForm.language;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-20 text-sec font-medium">Project not found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative">
      <Link to="/projects" className="flex items-center gap-2 text-sec hover:text-main font-medium transition-colors mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 bg-sec/20 px-0 py-4 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-primary-500/10 rounded-2xl flex items-center justify-center border border-primary-500/20 shadow-xl shadow-primary-500/5">
            <FolderOpen className="h-6 w-6 text-primary-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-main tracking-tight leading-none">{project.name}</h1>
            <p className="text-sec text-sm mt-1 font-bold flex items-center gap-2">
              {project.description || 'No description'} · <span className="uppercase text-primary-500">{project.language}</span>
              {project.owner && (
                <span className="ml-2 px-3 py-1 bg-primary-500/10 text-primary-600 rounded-full text-[9px] uppercase font-black tracking-widest border border-primary-500/10">
                  {project.owner.name}
                </span>
              )}
              {!project.team ? (
                <span className="ml-2 px-3 py-1 bg-sec text-sec rounded-full text-[9px] uppercase font-black tracking-widest border border-col">
                  Personal Project
                </span>
              ) : (
                <span className="ml-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] uppercase font-black tracking-widest border border-emerald-500/10">
                  {project.team.name} Team
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">


          {project.repoUrl && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`btn-secondary h-12 px-6 flex items-center gap-2 font-bold ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Pull latest files from repository"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Repo'}
            </button>
          )}
          {project.canDelete && (
            <button onClick={handleDeleteProject} className="btn-secondary h-12 px-6 border-red-500/30 text-red-600 hover:bg-red-500/10 flex items-center gap-2 font-bold">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => setShowUpload(true)} className="btn-primary h-12 px-8 flex items-center gap-2 font-bold ring-1 ring-primary-500/50 shadow-lg shadow-primary-500/20">
            <Plus className="h-5 w-5" /> Add File
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className={project.team ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="glass-panel p-8 shadow-2xl relative overflow-hidden group transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-2">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[100px] pointer-events-none group-hover:bg-primary-500/10 transition-all"></div>
            <h2 className="text-xl font-bold text-main mb-8 flex items-center gap-3">
              <FileCode className="h-5 w-5 text-primary-500" />
              Project Files
              <span className="px-2 py-0.5 bg-sec text-sec text-[10px] rounded-md border border-col font-black">{project.files?.length || 0} items</span>
            </h2>
            {!project.files || project.files.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center gap-6">
                <div className="h-20 w-20 bg-sec rounded-3xl border border-col flex items-center justify-center opacity-40">
                  <FolderOpen className="h-10 w-10 text-sec" />
                </div>
                <div>
                  <p className="text-lg font-bold text-main mb-2">Empty Universe</p>
                  <p className="text-sm text-sec font-medium max-w-xs mx-auto">This project hasn't been populated with any source code yet.</p>
                </div>
                <button onClick={() => setShowUpload(true)} className="btn-primary px-8">Upload First File</button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {project.files.map((file) => (
                  <Link key={file._id} to={`/projects/${id}/files/${file._id}`}
                    className="glass-panel px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] hover:border-primary-500/30 transition-all group/file border-col/30">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 bg-primary-500/10 rounded-xl flex items-center justify-center group-hover/file:bg-primary-500 group-hover/file:text-white transition-all shrink-0">
                        <FileCode className="h-5 w-5 text-primary-500 group-hover/file:text-white" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-main truncate group-hover/file:text-primary-500 transition-colors uppercase tracking-tight">
                          {file.filename}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black uppercase text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-md">V{file.currentVersion || 2}</span>
                          <span className="text-[10px] font-black uppercase text-sec opacity-60 tracking-widest">{file.language}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {project.canDelete && (
                        <button
                          onClick={(e) => handleDeleteFile(e, file._id)}
                          className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center opacity-0 group-hover/file:opacity-100 hover:bg-red-500 hover:text-white transition-all text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {project.team && (
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 border-col/50 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-xl font-bold text-main mb-6 flex items-center gap-3">
                <ListTodo className="h-5 w-5 text-emerald-500" />
                Development Insights
              </h3>
              <CommentSection
                projectId={id}
                placeholder="Write message..."
                isNotes={true}
                userRole={userRole}
              />
            </div>
          </div>
        )}
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-4xl p-8 relative max-h-[90vh] overflow-y-auto shadow-[0_30px_100px_rgba(0,0,0,0.5)] border-white/5">
            <button onClick={() => setShowUpload(false)} className="absolute top-6 right-6 p-2 bg-sec rounded-xl text-sec hover:text-rose-500 transition-all">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold text-main mb-6">Upload File</h2>

            <div
              className="mb-4 p-6 border-2 border-dashed border-col rounded-lg text-center bg-ter/30 hover:border-primary-500/50 transition-all cursor-pointer group"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files.length > 0) {
                  processFiles(Array.from(e.dataTransfer.files));
                }
              }}
            >
              <label className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-primary-500 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-sec">Drop files here or click to browse</span>
                <p className="text-[10px] text-sec/60 uppercase font-black tracking-widest mt-1">Supports multiple files</p>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                  accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.go,.rb,.php,.rs,.kt,.swift,.cs,.sql,.sh,.bash,.dart,.scala,.txt,.md,.json,.yml,.yaml,.html,.css"
                />
              </label>
            </div>

            {uploadError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-600 flex items-center gap-3 animate-in shake duration-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-xs font-bold">{uploadError}</p>
              </div>
            )}

            {uploadQueue.length > 0 ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary-500">Upload Queue ({uploadQueue.length} files)</h3>
                  <button onClick={() => setUploadQueue([])} className="text-[10px] font-black uppercase text-red-500 hover:underline">Clear All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto p-1 transition-all duration-500 ease-in-out">
                  {uploadQueue.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-sec/30 border border-col rounded-xl group/q">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileCode className="h-4 w-4 text-primary-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-main truncate">{item.filename}</p>
                          <p className="text-[9px] font-black text-sec uppercase tracking-tighter">{item.language}</p>
                        </div>
                      </div>
                      <button onClick={() => removeFromQueue(idx)} className="p-1.5 text-sec hover:text-red-500 opacity-0 group-hover/q:opacity-100 transition-all">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleUpload} className="mt-4">
                  <button type="submit" className="btn-primary w-full py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3">
                    <Upload className="h-4 w-4" /> Upload {uploadQueue.length} Files
                  </button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleUpload} className="flex flex-col gap-5">
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-sm font-bold text-sec">Filename</label>
                    <input type="text" value={fileForm.filename} onChange={(e) => setFileForm({ ...fileForm, filename: e.target.value })} required className="glass-input" placeholder="app.js" />
                  </div>
                  <div className="flex flex-col gap-2 w-48">
                    <label className="text-sm font-bold text-sec">Language</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 font-bold text-xs whitespace-nowrap shadow-sm group h-[42px] w-full justify-between ${isManualOverride
                            ? 'border-primary-500/50 bg-primary-500/5 text-primary-600'
                            : 'border-col bg-ter/30 text-sec hover:border-primary-500/30'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {!isManualOverride && <Sparkles className="h-3 w-3 text-primary-500 animate-pulse" />}
                          {isManualOverride ? 'Manual' : 'Auto'}: {currentLangName}
                        </div>
                        <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${showLanguageMenu ? 'rotate-180' : ''}`} />
                      </button>

                      {showLanguageMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowLanguageMenu(false)}></div>
                          <div className="absolute top-full mt-2 left-0 w-full glass-panel shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                            <div className="px-3 py-2 border-b border-col/50 bg-ter/50">
                              <p className="text-[10px] uppercase font-black text-sec tracking-wider">Select Language</p>
                            </div>
                            <div className="p-1">
                              {languages.map((l) => (
                                <button
                                  type="button"
                                  key={l.id}
                                  onClick={() => {
                                    setFileForm(prev => ({ ...prev, language: l.id }));
                                    setIsManualOverride(true);
                                    setShowLanguageMenu(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between group ${fileForm.language === l.id ? 'bg-primary-500 text-white shadow-lg' : 'text-sec hover:bg-sec hover:text-main'
                                    }`}
                                >
                                  {l.name}
                                  {fileForm.language === l.id && <CheckCircle className="h-3 w-3" />}
                                </button>
                              ))}
                              <button
                                type="button"
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
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-sec">Code Content</label>
                  <div className="h-80 border border-col rounded-lg overflow-hidden bg-main">
                    <Editor
                      height="100%"
                      language={fileForm.language}
                      theme={theme === 'dark' ? 'vs-dark' : 'vs'}
                      value={fileForm.content}
                      onChange={(value) => setFileForm({ ...fileForm, content: value || '' })}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: "'Fira Code', Consolas, monospace",
                        wordWrap: "on",
                        padding: { top: 12 },
                      }}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary mt-2">Upload File</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Real-time Live Toast (Team Only) */}
      {liveToast && !chatOpen && project.team && (
        <div
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-[110] glass-panel p-4 flex items-center gap-4 cursor-pointer hover:scale-105 transition-all shadow-2xl border-primary-500/30 animate-in slide-in-from-right-8 duration-500 max-w-xs"
        >
          <div className="h-10 w-10 rounded-full bg-primary-500/10 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-5 w-5 text-primary-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest leading-none mb-1">New Message from {liveToast.user?.name || 'System'}</p>
            <p className="text-xs text-main font-bold truncate">{liveToast.content}</p>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />
    </div>
  );
};

export default ProjectDetail;
