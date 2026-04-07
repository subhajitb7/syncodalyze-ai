import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Users, Plus, Trash2, Crown, ShieldCheck, User as UserIcon, FolderOpen, X, UserPlus } from 'lucide-react';

const TeamDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showLinkProject, setShowLinkProject] = useState(false);
  const [myProjects, setMyProjects] = useState([]);
  const [error, setError] = useState(null);

  const fetchTeam = async () => {
    try {
      const { data } = await axios.get(`/api/teams/${id}`);
      setTeam(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeam(); }, [id]);

  const myRole = team?.members?.find((m) => (m.user?._id || m.user) === user?._id)?.role;
  const canManage = myRole === 'owner' || myRole === 'admin';

  const handleInvite = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await axios.post(`/api/teams/${id}/invite`, { email: inviteEmail });
      setTeam(data);
      setShowInvite(false);
      setInviteEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to invite');
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      const { data } = await axios.delete(`/api/teams/${id}/members/${userId}`);
      setTeam(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { data } = await axios.put(`/api/teams/${id}/members/${userId}/role`, { role: newRole });
      setTeam(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleLinkProject = async (projectId) => {
    try {
      const { data } = await axios.post(`/api/teams/${id}/projects`, { projectId });
      setTeam(data);
      setShowLinkProject(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const openLinkProject = async () => {
    try {
      const { data } = await axios.get('/api/projects');
      setMyProjects(data);
      setShowLinkProject(true);
    } catch (err) {
      console.error(err);
    }
  };

  const roleIcon = (role) => {
    if (role === 'owner') return <Crown className="h-3.5 w-3.5 text-yellow-400" />;
    if (role === 'admin') return <ShieldCheck className="h-3.5 w-3.5 text-primary-400" />;
    return <UserIcon className="h-3.5 w-3.5 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!team) return <div className="text-center py-20 text-gray-400">Team not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Link to="/teams" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Teams
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{team.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{team.description || 'No description'}</p>
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button onClick={() => setShowInvite(true)} className="btn-primary flex items-center gap-2 text-sm">
              <UserPlus className="h-4 w-4" /> Invite
            </button>
            <button onClick={openLinkProject} className="btn-secondary flex items-center gap-2 text-sm">
              <FolderOpen className="h-4 w-4" /> Link Project
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members */}
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-400" /> Members ({team.members?.length || 0})
          </h2>
          <div className="space-y-2">
            {team.members?.map((m) => (
              <div key={m.user?._id} className="flex items-center justify-between p-3 bg-dark-900/50 border border-dark-600 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary-500/10 flex items-center justify-center text-sm font-bold text-primary-400">
                    {m.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{m.user?.name}</span>
                      {roleIcon(m.role)}
                      <span className="text-[10px] text-gray-500 uppercase">{m.role}</span>
                    </div>
                    <p className="text-xs text-gray-500">{m.user?.email}</p>
                  </div>
                </div>
                {canManage && m.role !== 'owner' && (
                  <div className="flex items-center gap-1">
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.user?._id, e.target.value)}
                      className="text-xs bg-dark-800 border border-dark-600 rounded px-2 py-1 text-gray-300"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button onClick={() => handleRemove(m.user?._id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary-400" /> Projects ({team.projects?.length || 0})
          </h2>
          {!team.projects || team.projects.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No projects linked yet.</p>
          ) : (
            <div className="space-y-2">
              {team.projects.map((p) => (
                <Link key={p._id} to={`/projects/${p._id}`}
                  className="flex items-center gap-3 p-3 bg-dark-900/50 border border-dark-600 rounded-lg hover:border-primary-500/50 transition-all">
                  <FolderOpen className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.language}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md p-8 relative">
            <button onClick={() => { setShowInvite(false); setError(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold mb-2">Invite Member</h2>
            <p className="text-gray-400 text-sm mb-6">Enter the email of a registered user.</p>
            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required className="glass-input" placeholder="user@example.com" />
              <button type="submit" className="btn-primary">Send Invite</button>
            </form>
          </div>
        </div>
      )}

      {/* Link Project Modal */}
      {showLinkProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md p-8 relative">
            <button onClick={() => setShowLinkProject(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6">Link Project</h2>
            {myProjects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No projects found. Create one first.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {myProjects.map((p) => (
                  <button key={p._id} onClick={() => handleLinkProject(p._id)}
                    className="w-full text-left p-3 bg-dark-900/50 border border-dark-600 rounded-lg hover:border-primary-500/50 transition-all flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.language}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetail;
