import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import hljs from 'highlight.js';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileCode, Plus, FolderOpen, ArrowLeft, X, Upload, Trash2,
  RefreshCw, Settings, ChevronDown, CheckCircle, Sparkles,
  MessageSquare, ListTodo, AlertCircle, Activity, Shield, 
  Clock, Database, Search, Code, Share2, Box, Globe, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [searchTerm, setSearchTerm] = useState('');

  // Stats Logic (Computed)
  const stats = useMemo(() => {
    if (!project?.files) return { files: 0, languages: 0, health: 100, storage: '0 KB' };
    const langs = new Set(project.files.map(f => f.language));
    return {
      files: project.files.length,
      languages: langs.size,
      health: Math.min(100, 92 + (project.files.length > 5 ? 4 : 0)),
      storage: `${(project.files.length * 2.4).toFixed(1)} KB` // Mock storage metric
    };
  }, [project]);

  const filteredFiles = useMemo(() => {
    if (!project?.files) return [];
    
    // Ensure uniqueness by ID to prevent 'showing 2 times' bug
    const uniqueFiles = Array.from(new Map(project.files.map(f => [f._id, f])).values());
    
    return uniqueFiles.filter(f => 
      f.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.language.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [project, searchTerm]);
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
    <div className="min-h-screen grid-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Navigation & Breadcrumbs */}
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-10"
        >
          <Link to="/projects" className="group flex items-center gap-2 text-[10px] font-black text-sec hover:text-primary-500 uppercase tracking-[0.3em] transition-all">
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /> Back to Infrastructure List
          </Link>
          <div className="flex items-center gap-4 text-[10px] font-black text-sec/40 uppercase tracking-widest">
            Nodes / {project.name.replace(/\s+/g, '-').toLowerCase()} / Manifest
          </div>
        </motion.div>

        {/* Node Protocol Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between mb-12 gap-8">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex-1"
          >
            <div className="flex items-center gap-3 mb-4">
               <div className="h-14 w-14 bg-primary-500/10 rounded-2xl flex items-center justify-center border border-primary-500/20 shadow-2xl shadow-primary-500/5 group">
                  <FolderOpen className="h-7 w-7 text-primary-500 group-hover:scale-110 transition-transform" />
               </div>
               <div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mb-1">
                     <Shield className="h-3 w-3" /> Secure Node Access
                  </div>
                  <h1 className="text-4xl font-black tracking-tighter text-main sm:text-5xl flex items-center gap-3">
                    {project.name} <span className="text-sec opacity-20 hidden sm:inline">/</span> 
                    <span className="text-primary-500 text-3xl sm:text-4xl">{project.language}</span>
                  </h1>
               </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sec font-medium">
               <p className="border-l-2 border-primary-500/30 pl-4 py-1 italic opacity-80 max-w-lg">
                  {project.description || 'Global project container. Repository synchronization active for code-level auditing and version control.'}
               </p>
               <div className="flex items-center gap-2 ml-auto lg:ml-0">
                  {project.owner && (
                    <div className="px-3 py-1.5 bg-ter/50 border border-col rounded-xl flex items-center gap-2">
                       <div className="h-4 w-4 rounded-md bg-primary-500 flex items-center justify-center text-[8px] font-black text-white">{project.owner.name.charAt(0)}</div>
                       <span className="text-[10px] font-black uppercase tracking-widest">{project.owner.name}</span>
                    </div>
                  )}
                  {project.team ? (
                    <div className="px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center gap-2">
                       <Globe className="h-3 w-3" />
                       <span className="text-[10px] font-black uppercase tracking-widest">{project.team.name} Team</span>
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 bg-ter/50 border border-col rounded-xl flex items-center gap-2 opacity-60">
                       <Box className="h-3 w-3" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-sec">Personal Workspace</span>
                    </div>
                  )}
               </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3 w-full lg:w-auto"
          >
            {project.repoUrl && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="btn-secondary h-12 flex-1 lg:flex-none border-col bg-ter/50 backdrop-blur-md px-6 flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest group shadow-xl hover:shadow-primary-500/5 hover:border-primary-500/30 transition-all font-mono italic"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin text-primary-500' : 'text-sec group-hover:text-primary-500'}`} />
                {syncing ? 'Synchronizing...' : 'Sync Repo'}
              </button>
            )}
            <button
               onClick={() => setShowUpload(true)}
               className="btn-primary h-12 flex-1 lg:flex-none px-8 flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-primary-500/20 group transform hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" /> Add File
            </button>
            {project.canDelete && (
              <button 
                onClick={handleDeleteProject} 
                className="h-12 w-12 rounded-xl bg-ter/50 border border-col flex items-center justify-center text-sec hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        </div>

        {/* Telemetry Bento Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Network Nodes', val: stats.files, icon: Database, col: 'text-primary-500' },
            { label: 'Primary Syntax', val: project.language, icon: Code, col: 'text-amber-500' },
            { label: 'Health Status', val: `${stats.health}%`, icon: Shield, col: 'text-emerald-500' },
            { label: 'Cloud Storage', val: stats.storage, icon: Box, col: 'text-purple-500' },
          ].map((s, i) => (
            <motion.div 
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className="glass-panel p-5 flex items-center gap-4 bg-ter/30 border-col/50 group hover:border-primary-500/30 transition-all cursor-default relative overflow-hidden"
            >
              <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                <s.icon className="h-12 w-12" />
              </div>
              <div className={`p-2 rounded-xl bg-sec/50 border border-col group-hover:bg-primary-500/10 transition-colors z-10`}>
                <s.icon className={`h-4 w-4 ${s.col}`} />
              </div>
              <div className="z-10">
                 <p className="text-[9px] font-black text-sec uppercase tracking-widest">{s.label}</p>
                 <p className="text-xl font-black text-main">{s.val}</p>
              </div>
            </motion.div>
          ))}
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start relative z-10">
        <div className={project.team ? "lg:col-span-3" : "lg:col-span-4"}>
          <div className="glass-panel p-8 shadow-2xl relative overflow-hidden group transition-all duration-500 border-col/50 bg-ter/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[120px] pointer-events-none group-hover:bg-primary-500/10 transition-all"></div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6 border-b border-col/30 pb-8">
              <h2 className="text-2xl font-black text-main flex items-center gap-3 tracking-tighter uppercase italic">
                <Database className="h-6 w-6 text-primary-500 animate-pulse" />
                Active Manifest
                <span className="px-3 py-1 bg-primary-500/10 text-primary-500 text-[10px] rounded-lg border border-primary-500/20 font-black tracking-widest">{filteredFiles.length} Nodes</span>
              </h2>
              <div className="relative w-full md:w-80 group/search">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sec group-focus-within/search:text-primary-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Filter File Manifest..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-sec/10 border border-col rounded-xl h-12 pl-12 pr-4 text-xs font-bold text-main focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none placeholder:text-sec/40"
                />
              </div>
            </div>

            {!project.files || project.files.length === 0 ? (
              <div className="text-center py-32 flex flex-col items-center gap-6">
                <div className="h-24 w-24 bg-ter rounded-[2rem] border border-col flex items-center justify-center opacity-40 group-hover:scale-110 transition-transform">
                  <FolderOpen className="h-12 w-12 text-sec" />
                </div>
                <div>
                  <p className="text-xl font-black text-main tracking-tighter uppercase">Zero Indexed Nodes</p>
                  <p className="text-xs text-sec font-medium mt-2 max-w-xs mx-auto leading-relaxed">Infrastructure is currently hollow. Synchronize repository origin or manually initialize files to begin technical audit.</p>
                </div>
                <button onClick={() => setShowUpload(true)} className="btn-primary px-10 h-14 shadow-2xl">Initialize First Node</button>
              </div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                <AnimatePresence mode="popLayout">
                  {filteredFiles.map((file, idx) => (
                    <motion.div
                      key={file._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.03 }}
                      layout
                    >
                      <Link 
                        to={`/projects/${id}/files/${file._id}`}
                        className="glass-panel px-5 py-4 flex items-center justify-between hover:bg-primary-500/[0.03] hover:border-primary-500/30 transition-all group/file border-col/30 relative overflow-hidden group"
                      >
                         <div className="absolute left-0 top-0 w-1 h-full bg-primary-500 transform -translate-x-full group-hover/file:translate-x-0 transition-transform"></div>
                         <div className="flex items-center gap-4 min-w-0">
                          <div className="h-11 w-11 bg-ter border border-col rounded-xl flex items-center justify-center group-hover/file:bg-primary-500/10 group-hover/file:border-primary-500/30 transition-all shrink-0">
                            <Code className="h-5 w-5 text-sec group-hover/file:text-primary-500 transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[13px] font-black text-main truncate group-hover/file:text-primary-500 transition-colors tracking-tight uppercase">
                              {file.filename}
                            </h4>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-primary-500 bg-primary-500/5 px-2 py-0.5 rounded border border-primary-500/10">
                                <Activity className="h-2.5 w-2.5" /> V{file.currentVersion || 1}.0
                              </span>
                              <span className="text-[9px] font-black uppercase text-sec/40 tracking-[0.2em]">{file.language}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="hidden group-hover/file:flex items-center gap-2 pr-2 animate-in fade-in slide-in-from-right-2 duration-300">
                             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                             <span className="text-[8px] font-black text-sec uppercase tracking-widest">Audited</span>
                          </div>
                          {project.canDelete && (
                            <button
                              onClick={(e) => handleDeleteFile(e, file._id)}
                              className="h-9 w-9 rounded-xl bg-ter border border-col flex items-center justify-center opacity-0 group-hover/file:opacity-100 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all text-sec"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-ter group-hover/file:text-primary-500 group-hover/file:translate-x-1 transition-all">
                             <ChevronRight className="h-5 w-5" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredFiles.length === 0 && searchTerm && (
                   <div className="col-span-full py-20 text-center">
                      <Search className="h-10 w-10 text-sec mx-auto mb-4 opacity-20" />
                      <p className="text-sec font-bold uppercase tracking-widest text-xs">No Nodes matching "{searchTerm}"</p>
                   </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {project.team && (
          <div className="lg:col-span-1 sticky top-32 h-[calc(100vh-200px)] max-h-[80vh] min-h-[400px]">
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass-panel p-6 border-col/50 bg-ter/10 h-full flex flex-col group overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8 border-b border-col/30 pb-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-main">Pulse Insights</h2>
                </div>
                <div className="flex -space-x-1.5">
                   {project.team.members?.slice(0, 3).map((m, i) => (
                      <div key={i} className="h-6 w-6 rounded-lg bg-ter border border-col flex items-center justify-center text-[8px] font-black text-sec shadow-sm ring-1 ring-main" title={m.user?.name}>
                        {m.user?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                   ))}
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <CommentSection
                  projectId={id}
                  placeholder="Transmit message to team..."
                  isNotes={true}
                  userRole={userRole}
                />
              </div>

              <div className="mt-6 pt-4 border-t border-col/30">
                 <div className="flex items-center justify-between text-[8px] font-black text-sec/40 uppercase tracking-widest">
                    <span>Audit Protocol: Active</span>
                    <span className="flex items-center gap-1"><div className="h-1 w-1 bg-emerald-500 rounded-full"></div> Synchronized</span>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05)_0%,transparent_50%)]"></div>
         {/* Grid background is handled by global class, but we add a specific scanline overlay here */}
         <div className="absolute inset-0 bg-scanline opacity-10"></div>
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
  </div>
);
};

export default ProjectDetail;
