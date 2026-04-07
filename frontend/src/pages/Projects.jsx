import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FolderOpen, Plus, Trash2, FileCode, X } from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', language: 'javascript' });

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
      setForm({ name: '', description: '', language: 'javascript' });
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-400 mt-1">Manage your code repositories and files.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" /> New Project
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <div className="bg-dark-700/50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="h-10 w-10 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">No projects yet</h3>
          <p className="text-gray-400 max-w-sm mx-auto mb-6">
            Create your first project to start organizing and reviewing code.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-secondary">Create Project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <Link
              key={proj._id}
              to={`/projects/${proj._id}`}
              className="glass-panel p-6 hover:border-primary-500/50 transition-all flex flex-col group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                    <FolderOpen className="h-5 w-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary-400 transition-colors">{proj.name}</h3>
                    <span className="text-xs text-gray-500 uppercase">{proj.language}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); handleDelete(proj._id); }}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-400 flex-grow line-clamp-2">{proj.description || 'No description'}</p>
              <div className="mt-4 pt-4 border-t border-dark-700 flex justify-between text-sm text-gray-500">
                <span className="flex items-center gap-1"><FileCode className="h-3 w-3" /> {proj.fileCount || 0} files</span>
                <span>{new Date(proj.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md p-8 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Project Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="glass-input" placeholder="My Awesome Project" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="glass-input h-24 resize-none" placeholder="Optional description..." />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Primary Language</label>
                <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="glass-input">
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="go">Go</option>
                </select>
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
