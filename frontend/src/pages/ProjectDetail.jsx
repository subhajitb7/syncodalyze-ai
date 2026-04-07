import { useState, useEffect } from 'react';
import axios from 'axios';
import hljs from 'highlight.js';
import { useParams, Link } from 'react-router-dom';
import { FileCode, Plus, FolderOpen, ArrowLeft, X, Upload } from 'lucide-react';
import Editor from '@monaco-editor/react';
const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
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
    return <div className="text-center py-20 text-gray-400">Project not found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Link to="/projects" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-primary-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{project.description || 'No description'} · <span className="uppercase text-primary-400">{project.language}</span></p>
          </div>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" /> Add File
        </button>
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <FileCode className="h-5 w-5 text-primary-400" /> Files
        </h2>
        {!project.files || project.files.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No files uploaded yet.</p>
            <button onClick={() => setShowUpload(true)} className="btn-secondary">Upload First File</button>
          </div>
        ) : (
          <div className="space-y-2">
            {project.files.map((file) => (
              <Link
                key={file._id}
                to={`/projects/${id}/files/${file._id}`}
                className="flex items-center justify-between p-4 bg-dark-900/50 border border-dark-600 rounded-lg hover:border-primary-500/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <FileCode className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{file.filename}</p>
                    <p className="text-xs text-gray-500">v{file.currentVersion} · {file.language}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{new Date(file.createdAt).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upload File Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-2xl p-8 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowUpload(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6">Upload File</h2>

            <div className="mb-4 p-4 border-2 border-dashed border-dark-600 rounded-lg text-center hover:border-primary-500/50 transition-colors cursor-pointer">
              <label className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-400">Click to browse a file, or paste code below</span>
                <input type="file" onChange={handleFileRead} className="hidden" accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.go,.html,.css,.json,.md" />
              </label>
            </div>

            <form onSubmit={handleUpload} className="flex flex-col gap-5">
              <div className="flex gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm font-medium text-gray-300">Filename</label>
                  <input type="text" value={fileForm.filename} onChange={(e) => setFileForm({ ...fileForm, filename: e.target.value })} required className="glass-input" placeholder="app.js" />
                </div>
                <div className="flex flex-col gap-2 w-40">
                  <label className="text-sm font-medium text-gray-300">Language</label>
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
                <label className="text-sm font-medium text-gray-300">Code Content</label>
                <div className="h-64 border border-dark-600 rounded-lg overflow-hidden bg-black">
                  <Editor
                    height="100%"
                    language={fileForm.language}
                    theme="vs-dark"
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
