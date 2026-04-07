import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Users, Plus, X, Trash2, FolderOpen, Crown, ShieldCheck, User as UserIcon } from 'lucide-react';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchTeams = async () => {
    try {
      const { data } = await axios.get('/api/teams');
      setTeams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/teams', form);
      setShowCreate(false);
      setForm({ name: '', description: '' });
      fetchTeams();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this team?')) return;
    try {
      await axios.delete(`/api/teams/${id}`);
      setTeams(teams.filter((t) => t._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const roleIcon = (role) => {
    if (role === 'owner') return <Crown className="h-3 w-3 text-yellow-400" />;
    if (role === 'admin') return <ShieldCheck className="h-3 w-3 text-primary-400" />;
    return <UserIcon className="h-3 w-3 text-gray-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-gray-400 mt-1">Collaborate with your team on code reviews.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" /> New Team
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : teams.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <div className="bg-dark-700/50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-10 w-10 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">No teams yet</h3>
          <p className="text-gray-400 mb-6">Create a team to start collaborating.</p>
          <button onClick={() => setShowCreate(true)} className="btn-secondary">Create First Team</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Link key={team._id} to={`/teams/${team._id}`}
              className="glass-panel p-6 hover:border-primary-500/50 transition-all group flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary-400 transition-colors">{team.name}</h3>
                    <p className="text-xs text-gray-500">{team.members?.length || 0} members</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(team._id); }}
                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-4 flex-grow">{team.description || 'No description'}</p>
              <div className="flex items-center gap-2 pt-3 border-t border-dark-700">
                <div className="flex -space-x-2">
                  {team.members?.slice(0, 4).map((m) => (
                    <div key={m.user?._id || m._id} className="h-7 w-7 rounded-full bg-dark-600 border-2 border-dark-800 flex items-center justify-center text-[10px] font-bold text-gray-300"
                      title={m.user?.name}>
                      {m.user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  ))}
                  {team.members?.length > 4 && (
                    <div className="h-7 w-7 rounded-full bg-dark-700 border-2 border-dark-800 flex items-center justify-center text-[10px] text-gray-400">
                      +{team.members.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500 ml-auto">
                  <FolderOpen className="h-3 w-3 inline mr-1" />{team.projects?.length || 0} projects
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md p-8 relative">
            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6">Create Team</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Team Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="glass-input" placeholder="My Team" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="glass-input h-24 resize-none" placeholder="What does this team work on?" />
              </div>
              <button type="submit" className="btn-primary mt-2">Create Team</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
