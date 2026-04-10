import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Users, Trash2, Crown, ShieldCheck, User as UserIcon, FolderOpen, X, UserPlus, MessageSquare } from 'lucide-react';
import TeamChatDrawer from '../components/TeamChatDrawer';
import { SocketPubSubContext } from '../context/SocketPubSubContext';

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
  const [isChatOpen, setIsChatOpen] = useState(false);

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

  const handleRemoveProject = async (projectId) => {
    if (!confirm('Un-link this project from the team?')) return;
    try {
      const { data } = await axios.delete(`/api/teams/${id}/projects/${projectId}`);
      setTeam(data);
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
    if (role === 'owner') return <Crown className="h-3.5 w-3.5 text-yellow-600" />;
    if (role === 'admin') return <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />;
    return <UserIcon className="h-3.5 w-3.5 text-sec" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!team) return <div className="text-center py-20 text-sec font-medium">Team not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Link to="/teams" className="flex items-center gap-2 text-sec hover:text-main font-medium transition-colors mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Teams
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-main leading-none">{team.name}</h1>
            <p className="text-sec text-sm mt-1 font-medium">{team.description || 'No description'}</p>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsChatOpen(true)} 
              className="h-10 w-10 flex items-center justify-center bg-ter border border-col rounded-xl text-sec hover:text-primary-500 hover:border-primary-500/50 transition-all group"
              title="Team Chat"
            >
              <MessageSquare className="h-5 w-5 group-hover:scale-110 transition-all" />
            </button>
            <button onClick={() => setShowInvite(true)} className="btn-primary flex items-center gap-2 text-sm px-6">
              <UserPlus className="h-4 w-4" /> Invite
            </button>
            <button onClick={openLinkProject} className="btn-secondary flex items-center gap-2 text-sm px-6">
              <FolderOpen className="h-4 w-4" /> Link Project
            </button>
          </div>
        )}
      </div>

      {/* Grid Wrapper: Consistent with platform grid */}
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Col: Members (Compact) */}
          <div className="glass-panel p-4 shadow-xl border-primary-500/10 transition-all duration-500 ease-in-out">
            <h2 className="text-[10px] font-black text-sec uppercase tracking-[0.2em] mb-4 flex items-center gap-2 opacity-80">
              <Users className="h-4 w-4 text-primary-500" /> Members ({team.members?.length || 0})
            </h2>
            <div className="space-y-2">
              {team.members?.map((m) => (
                <div key={m.user?._id || m.user || Math.random()} className="flex items-center justify-between p-2.5 bg-sec/50 border border-col rounded-lg hover:bg-sec transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary-500/10 flex items-center justify-center text-[10px] font-bold text-primary-600 border border-col">
                      {m.user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-main">{m.user?.name || 'Unknown Member'}</span>
                        {m.role && roleIcon(m.role)}
                        <span className="text-[8px] text-sec font-black uppercase tracking-wider opacity-40">{m.role || 'Ghost'}</span>
                      </div>
                      <p className="text-[10px] text-sec font-medium opacity-40">{m.user?.email || 'Missing data'}</p>
                    </div>
                  </div>
                  {canManage && m.role !== 'owner' && (m.user?._id || m.user) !== user?._id && (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.user?._id || m.user || m._id, e.target.value)}
                        className="text-[8px] uppercase tracking-widest bg-ter border border-col rounded px-1.5 py-1 text-main font-black cursor-pointer hover:border-primary-500/50 transition-all outline-none"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button onClick={() => handleRemove(m.user?._id || m.user || m._id)}
                        className="p-1.5 text-sec hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                        title="Remove Member">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: Projects (Compact) */}
          <div className="glass-panel p-4 shadow-xl border-purple-500/10 transition-all duration-500 ease-in-out">
            <h2 className="text-[10px] font-black text-sec uppercase tracking-[0.2em] mb-4 flex items-center gap-2 opacity-80">
              <FolderOpen className="h-4 w-4 text-purple-500" /> Linked Projects ({team.projects?.length || 0})
            </h2>
            {!team.projects || team.projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 opacity-30">
                <FolderOpen className="h-8 w-8 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-main">No projects linked</p>
              </div>
            ) : (
              <div className="space-y-2">
                {team.projects.map((p) => (
                  <Link key={p._id} to={`/projects/${p._id}`}
                    className="flex items-center justify-between p-2.5 bg-sec/50 border border-col rounded-lg hover:border-primary-500/50 hover:shadow-xl hover:bg-sec transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-primary-500/10 rounded-xl flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-all border border-transparent group-hover:border-primary-400">
                        <FolderOpen className="h-4 w-4 text-sec group-hover:text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-main group-hover:text-primary-500 transition-colors">{p.name}</p>
                        <p className="text-[8px] text-sec font-black uppercase tracking-widest opacity-60 mt-0.5">
                          {p.language} • <span className="text-primary-500 font-bold tracking-normal italic">{p.owner?.name || 'Unknown'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManage && (
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemoveProject(p._id);
                          }}
                          className="h-8 w-8 flex items-center justify-center text-sec hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Un-link Project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <div className="h-6 w-6 rounded-full border border-col flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <ArrowLeft className="h-3 w-3 rotate-180 text-sec" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <TeamChatDrawer 
        teamId={id}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />


      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md p-8 relative shadow-2xl">
            <button onClick={() => { setShowInvite(false); setError(null); }} className="absolute top-4 right-4 text-sec hover:text-main">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold text-main mb-2">Invite Member</h2>
            <p className="text-sec text-sm mb-6 font-medium">Enter the email of a registered user.</p>
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
          <div className="glass-panel w-full max-w-md p-8 relative shadow-2xl">
            <button onClick={() => setShowLinkProject(false)} className="absolute top-4 right-4 text-sec hover:text-main">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold text-main mb-6">Link Project</h2>
            {myProjects.length === 0 ? (
              <p className="text-sec text-center font-medium py-4">No projects found. Create one first.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {myProjects.map((p) => (
                  <button key={p._id} onClick={() => handleLinkProject(p._id)}
                    className="w-full text-left p-3 bg-sec border border-col rounded-lg hover:border-primary-500/50 hover:shadow-lg transition-all flex items-center gap-3 group">
                    <FolderOpen className="h-5 w-5 text-sec group-hover:text-primary-600 transition-colors" />
                    <div>
                      <p className="font-bold text-sm text-main">{p.name}</p>
                      <p className="text-xs text-sec font-medium">{p.language}</p>
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
