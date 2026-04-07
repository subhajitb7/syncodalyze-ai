import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import hljs from 'highlight.js';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FileCode, Plus, FolderOpen, ArrowLeft, X, Upload, Trash2, RefreshCw, Settings } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { ThemeContext } from '../context/ThemeContext';
const ProjectDetail = () => {
  const { theme } = useContext(ThemeContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [fileForm, setFileForm] = useState({ filename: '', content: '', language: 'javascript' });

  const fetchProject = async () => {
    try {
      const { data } = await axios.get(`/api/projects/${id}`);
      setProject(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (fileForm.content.length > 10) {
        try {
          const detect = hljs.highlightAuto(fileForm.content);
          if (detect.language) {
            let lang = detect.language.toLowerCase();
            if (['js', 'javascript', 'jsx', 'node'].includes(lang)) lang = 'javascript';
            else if (['ts', 'typescript', 'tsx'].includes(lang)) lang = 'typescript';
            else if (['py', 'python'].includes(lang)) lang = 'python';
            else if (['java'].includes(lang)) lang = 'java';
            else if (['cpp', 'c++', 'c'].includes(lang)) lang = 'cpp';
            else if (['go', 'golang'].includes(lang)) lang = 'go';

            if (['javascript', 'python', 'typescript', 'java', 'cpp', 'go'].includes(lang) && lang !== fileForm.language) {
              setFileForm(prev => ({ ...prev, language: lang }));
            }
          }
        } catch (e) {}
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [fileForm.content, fileForm.language]);

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/projects/${id}/files`, fileForm);
      setShowUpload(false);
      setFileForm({ filename: '', content: '', language: 'javascript' });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
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
  
  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This will permanently remove all files and results.')) return;
    try {
      await axios.delete(`/api/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleDeleteFile = async (e, fileId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await axios.delete(`/api/projects/${id}/files/${fileId}`);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete file');
    }
  };

  const handleFileRead = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Auto-detect language from file extension
    const ext = file.name.split('.').pop().toLowerCase();
    const langMap = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', java: 'java', cpp: 'cpp', c: 'cpp', go: 'go',
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Link to="/projects" className="flex items-center gap-2 text-sec hover:text-main font-medium transition-colors mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-primary-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-main">{project.name}</h1>
            <p className="text-sec text-sm mt-1 font-medium">{project.description || 'No description'} · <span className="uppercase text-primary-600 font-bold">{project.language}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {project.repoUrl && (
            <button 
              onClick={handleSync} 
              disabled={syncing}
              className={`btn-secondary flex items-center gap-2 font-bold ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Pull latest files from repository"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Repo'}
            </button>
          )}
          {project.canDelete && (
            <button onClick={handleDeleteProject} className="btn-secondary border-red-500/30 text-red-600 hover:bg-red-500/10 flex items-center gap-2 font-bold">
              <Trash2 className="h-4 w-4" /> Delete Project
            </button>
          )}
          <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2 font-bold ring-1 ring-primary-500/50">
            <Plus className="h-5 w-5" /> Add File
          </button>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-main mb-6 flex items-center gap-2">
          <FileCode className="h-5 w-5 text-primary-500" /> Files
        </h2>
        {!project.files || project.files.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sec font-medium mb-4">No files uploaded yet.</p>
            <button onClick={() => setShowUpload(true)} className="btn-secondary">Upload First File</button>
          </div>
        ) : (
          <div className="space-y-2">
            {project.files.map((file) => (
              <Link
                key={file._id}
                to={`/projects/${id}/files/${file._id}`}
                className="flex items-center justify-between p-4 bg-sec border border-col rounded-lg hover:border-primary-500/50 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3">
                  <FileCode className="h-5 w-5 text-sec" />
                  <div>
                    <p className="font-bold text-main">{file.filename}</p>
                    <p className="text-xs text-sec font-medium">v{file.currentVersion} · <span className="uppercase">{file.language}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-sec font-medium">{new Date(file.createdAt).toLocaleDateString()}</span>
                  
                  {project.canDelete && (
                    <button 
                      onClick={(e) => handleDeleteFile(e, file._id)}
                      className="p-2 text-sec hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upload File Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-4xl p-8 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button onClick={() => setShowUpload(false)} className="absolute top-4 right-4 text-sec hover:text-main">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold text-main mb-6">Upload File</h2>

            <div className="mb-4 p-6 border-2 border-dashed border-col rounded-lg text-center bg-ter/30 hover:border-primary-500/50 transition-all cursor-pointer">
              <label className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-primary-500" />
                <span className="text-sm font-bold text-sec">Click to browse a file, or paste code below</span>
                <input type="file" onChange={handleFileRead} className="hidden" accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.go,.html,.css,.json,.md" />
              </label>
            </div>

            <form onSubmit={handleUpload} className="flex flex-col gap-5">
              <div className="flex gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm font-bold text-sec">Filename</label>
                  <input type="text" value={fileForm.filename} onChange={(e) => setFileForm({ ...fileForm, filename: e.target.value })} required className="glass-input" placeholder="app.js" />
                </div>
                <div className="flex flex-col gap-2 w-48">
                  <label className="text-sm font-bold text-sec">Language</label>
                  <select value={fileForm.language} onChange={(e) => setFileForm({ ...fileForm, language: e.target.value })} className="glass-input">
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="go">Go</option>
                  </select>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
