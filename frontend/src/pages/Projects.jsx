import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FolderOpen, Plus, Trash2, FileCode, X } from 'lucide-react';
import SearchBar from '../components/SearchBar';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', language: 'javascript', repoUrl: '' });

  const fetchProjects = async () => {
    try {
      const { data } = await axios.get('/api/projects');
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/projects', form);
      setShowModal(false);
      setForm({ name: '', description: '', language: 'javascript', repoUrl: '' });
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its files?')) return;
    try {
      await axios.delete(`/api/projects/${id}`);
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Platform-standard vertical baseline spacer */}
      <div className="h-10 mb-2 opacity-0 pointer-events-none hidden lg:block"></div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-sec mt-1">Manage your analysis history and collaborative codebases.</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar />
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Plus className="h-5 w-5" /> New Project
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sec font-medium">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <div className="bg-ter/50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="h-10 w-10 text-sec" />
          </div>
          <h3 className="text-lg font-bold text-main mb-2">No projects yet</h3>
          <p className="text-sec max-w-sm mx-auto mb-6 font-medium">
            Create your first project to start organizing and reviewing code.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-secondary">Create Project</button>
        </div>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
          {projects.map((proj) => (
            <Link
              key={proj._id}
              to={`/projects/${proj._id}`}
              className="glass-panel p-6 hover:border-primary-500/50 transition-all flex flex-col group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                    <FolderOpen className="h-5 w-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-main group-hover:text-primary-600 transition-colors">{proj.name}</h3>
                    <span className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">{proj.language}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); handleDelete(proj._id); }}
                  className="p-2 text-sec hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-sec flex-grow line-clamp-2 leading-relaxed">{proj.description || 'No description'}</p>
              <div className="mt-4 pt-4 border-t border-col flex flex-col gap-2">
                <div className="flex justify-between text-[11px] text-sec font-bold uppercase tracking-tight">
                  <span className="flex items-center gap-1.5"><FileCode className="h-3.5 w-3.5 text-primary-500" /> {proj.fileCount || 0} files</span>
                  <span className="bg-ter/50 px-2 py-0.5 rounded text-[9px] border border-col">v{proj.currentVersion || 1}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-sec font-medium">
                   <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full bg-primary-500/10 flex items-center justify-center text-[8px] font-black text-primary-600 border border-primary-500/20">
                        {proj.owner?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span className="truncate max-w-[150px]">Owner: <span className="text-main font-bold">{proj.owner?.name || 'Unknown'}</span></span>
                   </div>
                   <span>{new Date(proj.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md p-8 relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-sec hover:text-main">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold text-main mb-6">Create New Project</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-sec">Project Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="glass-input" placeholder="My Awesome Project" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-sec">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="glass-input h-24 resize-none" placeholder="Optional description..." />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-sec">Primary Language</label>
                <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="glass-input">
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="go">Go</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-sec">Repository URL (Optional)</label>
                <input type="url" value={form.repoUrl} onChange={(e) => setForm({ ...form, repoUrl: e.target.value })} className="glass-input" placeholder="https://github.com/user/repo" />
              </div>
              <button type="submit" className="btn-primary mt-2">Create Project</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
