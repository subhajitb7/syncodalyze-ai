import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Users, FileText, Trash2, Shield, ShieldOff, BarChart3, Bug, FolderOpen, MessageSquare } from 'lucide-react';

const AdminPanel = () => {
  const { theme } = useContext(ThemeContext);
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'stats';
  const [tab, setTab] = useState(initialTab);
  const [stats, setStats] = useState(null);

  // Sync tab state with URL search params
  useEffect(() => {
    const currentTab = searchParams.get('tab') || 'stats';
    setTab(currentTab);
  }, [searchParams]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (tab === 'stats') {
          const { data } = await axios.get('/api/admin/stats');
          setStats(data);
        } else if (tab === 'users') {
          const { data } = await axios.get('/api/admin/users');
          setUsers(data);
        } else if (tab === 'reviews') {
          const { data } = await axios.get('/api/admin/reviews');
          setReviews(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchData();
  }, [tab]);

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user and ALL their data?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      setUsers(users.filter((u) => u._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleToggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const { data } = await axios.put(`/api/admin/users/${id}/role`, { role: newRole });
      setUsers(users.map((u) => (u._id === id ? { ...u, role: data.role } : u)));
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleDeleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    try {
      await axios.delete(`/api/admin/reviews/${id}`);
      setReviews(reviews.filter((r) => r._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const tabs = [
    { key: 'stats', label: 'Platform Stats', icon: BarChart3 },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'reviews', label: 'Reviews', icon: FileText },
  ];

  const colorClasses = {
    primary: { bg: 'bg-primary-500/10', text: theme === 'dark' ? 'text-primary-400' : 'text-primary-600' },
    emerald: { bg: 'bg-emerald-500/10', text: theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600' },
    purple: { bg: 'bg-purple-500/10', text: theme === 'dark' ? 'text-purple-400' : 'text-purple-600' },
    yellow: { bg: 'bg-yellow-500/10', text: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600' },
    red: { bg: 'bg-red-500/10', text: theme === 'dark' ? 'text-red-400' : 'text-red-600' },
    cyan: { bg: 'bg-cyan-500/10', text: theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600' },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-sec mt-1">Manage the platform, users, and content.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-primary-500/10 text-primary-500 border border-primary-500/30' : 'text-sec border border-col hover:border-text-sec'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Stats Tab */}
          {tab === 'stats' && stats && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'primary' },
                  { label: 'Total Reviews', value: stats.totalReviews, icon: FileText, color: 'emerald' },
                  { label: 'Total Projects', value: stats.totalProjects, icon: FolderOpen, color: 'purple' },
                  { label: 'Total Files', value: stats.totalFiles, icon: FileText, color: 'yellow' },
                  { label: 'Total Bugs', value: stats.totalBugs, icon: Bug, color: 'red' },
                  { label: 'Total Comments', value: stats.totalComments, icon: MessageSquare, color: 'cyan' },
                ].map((s, i) => (
                  <div key={i} className="glass-panel p-5 flex items-center gap-4">
                    <div className={`h-12 w-12 ${colorClasses[s.color]?.bg || 'bg-ter'} rounded-xl flex items-center justify-center`}>
                      <s.icon className={`h-6 w-6 ${colorClasses[s.color]?.text || 'text-sec'}`} />
                    </div>
                    <div>
                      <p className="text-xs text-sec font-bold uppercase tracking-wider">{s.label}</p>
                      <p className="text-2xl font-bold text-main">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="glass-panel p-6">
                <h3 className="font-semibold mb-4">Recent Users</h3>
                <div className="space-y-2">
                  {stats.recentUsers.map((u) => (
                    <div key={u._id} className="flex items-center justify-between p-3 bg-sec/50 border border-col rounded-lg">
                      <div>
                        <span className="font-medium">{u.name}</span>
                        <span className="text-sec text-sm ml-2">{u.email}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${u.role === 'admin' ? 'bg-primary-500/20 text-primary-500' : 'bg-ter text-sec'}`}>{u.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {tab === 'users' && (
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-col text-left">
                      <th className="p-4 text-sec font-medium">Name</th>
                      <th className="p-4 text-sec font-medium">Email</th>
                      <th className="p-4 text-sec font-medium">Role</th>
                      <th className="p-4 text-sec font-medium">Verified</th>
                      <th className="p-4 text-sec font-medium">Joined</th>
                      <th className="p-4 text-sec font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b border-col/50 hover:bg-sec/50">
                        <td className="p-4 font-medium">{u.name}</td>
                        <td className="p-4 text-sec">{u.email}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded ${u.role === 'admin' ? 'bg-primary-500/20 text-primary-500' : 'bg-ter text-sec'}`}>{u.role}</span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs font-semibold ${u.isVerified ? 'text-emerald-500' : 'text-yellow-600'}`}>{u.isVerified ? 'Yes' : 'No'}</span>
                        </td>
                        <td className="p-4 text-sec">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button onClick={() => handleToggleRole(u._id, u.role)}
                              className="p-1.5 text-sec hover:text-primary-500 hover:bg-primary-500/10 rounded transition-colors"
                              title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}>
                              {u.role === 'admin' ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                            </button>
                            <button onClick={() => handleDeleteUser(u._id)}
                              className="p-1.5 text-sec hover:text-red-500 hover:bg-red-500/10 rounded transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {tab === 'reviews' && (
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-col text-left bg-sec/50">
                      <th className="p-4 text-sec font-bold uppercase tracking-wider text-[10px]">Title</th>
                      <th className="p-4 text-sec font-bold uppercase tracking-wider text-[10px]">Author</th>
                      <th className="p-4 text-sec font-bold uppercase tracking-wider text-[10px]">Lang</th>
                      <th className="p-4 text-sec font-bold uppercase tracking-wider text-[10px]">Bugs</th>
                      <th className="p-4 text-sec font-bold uppercase tracking-wider text-[10px]">Date</th>
                      <th className="p-4 text-sec font-bold uppercase tracking-wider text-[10px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((r) => (
                      <tr key={r._id} className="border-b border-col/50 hover:bg-sec/50 transition-colors">
                        <td className="p-4 font-bold text-main">{r.title}</td>
                        <td className="p-4 text-sec font-medium">{r.user?.name || 'Unknown'}</td>
                        <td className="p-4 text-primary-600 font-bold uppercase text-[10px] tracking-tight">{r.language}</td>
                        <td className="p-4">
                          <span className={`font-bold ${r.bugsFound > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{r.bugsFound}</span>
                        </td>
                        <td className="p-4 text-sec font-medium">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <button onClick={() => handleDeleteReview(r._id)}
                            className="p-1.5 text-sec hover:text-red-600 hover:bg-red-600/10 rounded transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPanel;
