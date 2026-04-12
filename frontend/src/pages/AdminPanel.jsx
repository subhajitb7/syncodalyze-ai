import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Users, FileText, Trash2, Shield, ShieldOff, BarChart3, Bug,
  FolderOpen, MessageSquare, Zap, Activity, Settings,
  Cpu, AlertCircle, Save, CheckCircle, Clock, X, Brain,
  UserX, UserCheck, Lock, History, Database, Mail, Eye,
  ChevronRight, ArrowUpRight, Search, Filter, RefreshCcw,
  Terminal, Globe, Server, Layers
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import ReviewInspectorModal from '../components/ReviewInspectorModal';

const AdminPanel = () => {
  const { theme } = useContext(ThemeContext);
  const { user: currentUser } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'stats';
  const [tab, setTab] = useState(initialTab);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [aiLogs, setAiLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Modal States
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [fetchingReview, setFetchingReview] = useState(false);

  const fetchData = async () => {
    try {
      const endpoints = {
        stats: '/api/admin/stats',
        users: '/api/admin/users',
        reviews: '/api/admin/reviews',
        settings: '/api/admin/settings',
        audit: '/api/admin/audit-logs'
      };

      if (tab === 'ai-insights') {
        const [{ data: statsData }, { data: logData }] = await Promise.all([
          axios.get('/api/admin/stats'),
          axios.get('/api/ai-logs').catch(() => ({ data: [] }))
        ]);
        setStats(statsData);
        setAiLogs(logData.logs || logData || []);
      } else {
        const { data } = await axios.get(endpoints[tab]);
        if (tab === 'stats') setStats(data);
        if (tab === 'users') setUsers(data);
        if (tab === 'reviews') setReviews(data);
        if (tab === 'settings') setSettings(data);
        if (tab === 'audit') setAuditLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    setSearchParams({ tab });
  }, [tab]);

  const handleUpdateSettings = async (updates) => {
    try {
      const { data } = await axios.put('/api/admin/settings', { ...settings, ...updates });
      setSettings(data);
    } catch (err) {
      console.error('Settings update error:', err);
    }
  };

  const handleToggleSuspension = async (id, currentStatus) => {
    try {
      const { data } = await axios.put(`/api/admin/users/${id}/suspend`);
      setUsers(users.map(u => u._id === id ? { ...u, isSuspended: data.isSuspended } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Suspension failed');
    }
  };

  const handleDeleteUser = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete User Node?",
      message: "This will permanently terminate the identity node and purge ALL associated telemetry. This action is irreversible.",
      onConfirm: async () => {
        try {
          await axios.delete(`/api/admin/users/${id}`);
          setUsers(users.filter((u) => u._id !== id));
        } catch (err) {
          alert(err.response?.data?.message || 'Error');
        }
      }
    });
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

  const handleDeleteReview = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: "Purge Analysis?",
      message: "Are you sure you want to remove this analysis node from the ledger?",
      onConfirm: async () => {
        try {
          await axios.delete(`/api/admin/reviews/${id}`);
          setReviews(reviews.filter((r) => r._id !== id));
        } catch (err) {
          alert(err.response?.data?.message || 'Error');
        }
      }
    });
  };

  const handleInspectReview = async (id) => {
    try {
      setFetchingReview(true);
      const { data } = await axios.get(`/api/reviews/${id}`);
      setSelectedReview(data);
      setIsInspectorOpen(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Access restricted to Sovereign Admin.');
      alert(err.response?.data?.message || 'Access restricted.');
    } finally {
      setFetchingReview(false);
    }
  };

  const navItems = [
    { key: 'stats', label: 'Monitor', icon: Activity, desc: 'Real-time platform metrics' },
    { key: 'ai-insights', label: 'AI Intelligence', icon: Brain, desc: 'Internal model telemetry' },
    { key: 'audit', label: 'Audit Ledger', icon: History, desc: 'Immutable action history' },
    { key: 'users', label: 'Identity Nodes', icon: Users, desc: 'User & role management' },
    { key: 'reviews', label: 'Analysis History', icon: FileText, desc: 'Code review oversight' },
    { key: 'settings', label: 'System Logic', icon: Settings, desc: 'Global configuration' },
  ];

  const MetricCard = ({ label, value, icon: Icon, color, trend }) => (
    <div className="glass-panel p-6 relative overflow-hidden group hover:border-primary-500/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`h-10 w-10 rounded-xl bg-${color}-500/10 flex items-center justify-center text-${color}-500`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
            <ArrowUpRight className="h-3 w-3" /> {trend}
          </div>
        )}
      </div>
      <p className="text-[10px] text-sec font-black uppercase tracking-[0.2em] mb-1">{label}</p>
      <h3 className="text-3xl font-black text-main tabular-nums">{value?.toLocaleString() || 0}</h3>
      <div className="mt-4 h-1 w-full bg-col/30 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: '70%' }} 
          className={`h-full bg-${color}-500 shadow-[0_0_10px_rgba(var(--${color}),0.5)]`}
        />
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-main border-r border-col hidden lg:flex flex-col sticky top-20 h-[calc(100vh-80px)]">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 bg-primary-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-main">Governance</h1>
              <p className="text-[10px] font-bold text-sec uppercase tracking-widest opacity-40">Security Clearance: LEVEL 4</p>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-black text-main tracking-tighter uppercase mb-1">Governor Node</h2>
            <p className="text-[10px] font-bold text-sec uppercase tracking-[0.2em] opacity-60">Sovereign Administration & Oversight</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative ${
                  tab === item.key 
                    ? 'bg-primary-500/5 text-primary-500 border border-primary-500/10' 
                    : 'text-sec hover:text-main hover:bg-ter/50 border border-transparent'
                }`}
              >
                <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${tab === item.key ? 'text-primary-500' : 'text-sec opacity-40'}`} />
                <div className="text-left">
                  <p className="text-[11px] font-black uppercase tracking-widest leading-none">{item.label}</p>
                  <p className="text-[9px] font-medium opacity-50 mt-1">{item.desc}</p>
                </div>
                {tab === item.key && (
                  <motion.div 
                    layoutId="active-tab-bar"
                    className="absolute left-[-1px] top-4 bottom-4 w-[3px] bg-primary-500 rounded-full"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-col">
          <div className="glass-panel p-4 bg-primary-500/[0.03] border-primary-500/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-main">Sovereign Core</p>
            </div>
            <p className="text-[9px] font-medium text-sec leading-relaxed">System synchronicity is 100% stable across all active nodes.</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-ter/30 overflow-y-auto custom-scrollbar">
        <div className="lg:hidden flex border-b border-col bg-main overflow-x-auto sticky top-0 z-40 no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`flex-none px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                tab === item.key ? 'border-primary-500 text-primary-500' : 'border-transparent text-sec'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="max-w-6xl mx-auto p-6 lg:p-12 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-40">
                  <div className="animate-spin h-10 w-10 border-[3px] border-primary-500 border-t-transparent rounded-full mb-4"></div>
                  <p className="text-[10px] font-black text-sec uppercase tracking-[0.3em] animate-pulse">Accessing Encrypted Node...</p>
                </div>
              ) : (
                <>
                  {tab === 'stats' && stats && (
                    <div className="space-y-10">
                      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                          <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mb-2">Operational Overview</p>
                          <h2 className="text-3xl font-black text-main tracking-tighter uppercase">Platform Pulse</h2>
                        </div>
                        <div className="flex gap-3">
                           <div className="glass-panel px-4 py-2 flex items-center gap-3 border-emerald-500/20">
                             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                             <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Live</span>
                           </div>
                           <button onClick={fetchData} className="p-2.5 bg-ter border border-col rounded-xl text-sec hover:text-main transition-all">
                             <RefreshCcw className="h-4 w-4" />
                           </button>
                        </div>
                      </header>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard label="Active Nodes (Users)" value={stats.totalUsers} icon={Users} color="blue" trend="+12%" />
                        <MetricCard label="System Analyses" value={stats.totalReviews} icon={Activity} color="emerald" trend="+8.4%" />
                        <MetricCard label="Data Summaries" value={stats.totalFiles} icon={Layers} color="purple" trend="+24.1%" />
                        <MetricCard label="Anomalies Purged" value={stats.totalBugs} icon={Bug} color="rose" trend="-2%" />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
                        <div className="lg:col-span-2 glass-panel p-8 bg-main/50 border-white/5">
                          <div className="flex items-center justify-between mb-10">
                             <h4 className="text-lg font-black text-main flex items-center gap-2">
                               <Zap className="h-5 w-5 text-yellow-500" /> Platform Throughput
                             </h4>
                             <span className="text-[10px] font-black text-sec uppercase tracking-widest opacity-40">System Efficiency Radar</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                             <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                   <p className="text-[10px] font-black text-sec uppercase tracking-widest">Inference Accuracy</p>
                                   <p className="text-2xl font-black text-emerald-500">99.1%</p>
                                </div>
                                <div className="h-1.5 bg-col/30 rounded-full overflow-hidden">
                                   <motion.div initial={{ width: 0 }} animate={{ width: '99.1%' }} className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                                </div>
                             </div>
                             <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                   <p className="text-[10px] font-black text-sec uppercase tracking-widest">Token Saturation</p>
                                   <p className="text-2xl font-black text-primary-500">{(stats.aiMetrics?.totalTokens / 1000000).toFixed(2)}M</p>
                                </div>
                                <div className="h-1.5 bg-col/30 rounded-full overflow-hidden">
                                   <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="h-full bg-primary-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
                                </div>
                             </div>
                          </div>
                          <div className="mt-12 flex items-center gap-6 p-4 bg-ter/30 rounded-2xl border border-col/30">
                             <Terminal className="h-5 w-5 text-primary-500 opacity-40 shrink-0" />
                             <p className="text-[11px] font-medium text-sec">Operational status sustained. Latency normalization is optimal (~1.2s avg).</p>
                             <button className="ml-auto text-[9px] font-black uppercase tracking-widest text-primary-500 hover:text-primary-600 transition-colors">Details</button>
                          </div>
                        </div>

                        <div className="glass-panel p-8 bg-primary-500/[0.02] border-primary-500/20 flex flex-col">
                           <h4 className="text-lg font-black text-main flex items-center gap-2 mb-8"><Server className="h-5 w-5 text-primary-500" /> Infra Map</h4>
                           <div className="space-y-6 flex-1">
                              {[
                                { label: 'Primary AI', val: 'Llama 3.3', icon: Brain, status: 'Active' },
                                { label: 'DB Cluster', val: 'Atlas Sync', icon: Database, status: 'Stable' },
                                { label: 'Audit Hub', val: 'Sovereign', icon: History, status: 'Active' }
                              ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between border-b border-col pb-4">
                                   <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-lg bg-ter flex items-center justify-center text-sec"><item.icon className="h-4 w-4" /></div>
                                      <div>
                                         <p className="text-[10px] font-black text-sec uppercase tracking-widest">{item.label}</p>
                                         <p className="text-xs font-black text-main">{item.val}</p>
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                                      <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                      <span className="text-[8px] font-black uppercase tracking-[0.1em]">{item.status}</span>
                                   </div>
                                </div>
                              ))}
                           </div>
                           <button className="mt-8 btn-primary w-full py-4 text-[10px] font-black uppercase tracking-[0.2em]">System Reset</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {tab === 'users' && !loading && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                          <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mb-2">Personnel Oversight</p>
                          <h2 className="text-3xl font-black text-main tracking-tighter uppercase">Identity Nodes</h2>
                        </div>
                        <div className="flex bg-ter/50 p-1 rounded-xl border border-col">
                           <div className="px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase text-sec border-r border-col"><Users className="h-3 w-3" /> {users.length} Total</div>
                           <div className="px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500"><UserCheck className="h-3 w-3" /> {users.filter(u => u.isVerified).length} Verified</div>
                        </div>
                      </header>
                      <div className="glass-panel overflow-hidden border-col">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-sec/30 border-b border-white/5">
                                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-sec">Identity / Reference</th>
                                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-sec">Vector Profile</th>
                                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-sec">Access Tier</th>
                                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-sec">Status Node</th>
                                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-sec text-right">Commands</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {users.map((u) => (
                                <tr key={u._id} className={`group hover:bg-primary-500/[0.02] transition-all ${currentUser?._id === u._id ? 'bg-primary-500/[0.03]' : ''}`}>
                                  <td className="p-5">
                                    <div className="flex items-center gap-4">
                                      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-sm font-black shadow-lg border-2 border-white/5 ${u.role === 'admin' ? 'bg-yellow-500 text-white' : 'bg-primary-500 text-white'}`}>{u.name.charAt(0).toUpperCase()}</div>
                                      <div>
                                        <p className="text-sm font-black text-main flex items-center gap-2 uppercase tracking-tight">{u.name} {currentUser?._id === u._id && <span className="px-2 py-0.5 text-[8px] font-black bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">Self</span>}</p>
                                        <p className="text-[9px] font-bold text-sec uppercase opacity-40 mt-1">UID: {u._id.substring(18)}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-5"><div className="flex items-center gap-2"><Mail className="h-3 w-3 text-sec opacity-30" /><span className="text-xs font-bold text-sec">{u.email}</span></div></td>
                                  <td className="p-5">{u.isMaster ? <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 rounded-full text-[9px] font-black uppercase tracking-widest"><Shield className="h-3 w-3" /> Master</span> : <button onClick={() => handleToggleRole(u._id, u.role)} disabled={u.isMaster || !currentUser?.isMaster} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${u.role === 'admin' ? 'bg-primary-500/10 text-primary-500 border-primary-500/20' : 'bg-ter text-sec border-col hover:border-primary-500/30'}`}>{u.role}</button>}</td>
                                  <td className="p-5"><div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${u.isSuspended ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}><div className={`h-1 w-1 rounded-full ${u.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'}`} />{u.isSuspended ? 'Suspended' : u.isVerified ? 'Active' : 'Pending'}</div></td>
                                  <td className="p-5 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleToggleSuspension(u._id, u.isSuspended)} disabled={u.isMaster || (u.role === 'admin' && !currentUser?.isMaster)} className={`p-2.5 rounded-xl transition-all border ${u.isSuspended ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'} disabled:opacity-20`}>{u.isSuspended ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}</button><button onClick={() => handleDeleteUser(u._id)} disabled={u.isMaster || !currentUser?.isMaster} className="p-2.5 bg-ter border border-col text-sec hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all disabled:opacity-20"><Trash2 className="h-4 w-4" /></button></div></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {tab === 'reviews' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div><p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mb-2">Platform Feed</p><h2 className="text-3xl font-black text-main tracking-tighter uppercase">Analysis Ledger</h2></div>
                        <div className="glass-panel px-5 py-3 flex items-center gap-3 bg-primary-500/[0.02]"><BarChart3 className="h-4 w-4 text-primary-500" /><div><p className="text-[8px] font-black text-sec uppercase tracking-widest">Global Density</p><p className="text-sm font-black text-main">{(reviews.reduce((acc, r) => acc + r.bugsFound, 0) / reviews.length || 0).toFixed(1)} <span className="text-[10px] opacity-40">Bugs/Node</span></p></div></div>
                      </header>
                      <div className="glass-panel overflow-hidden border-col">
                        <div className="overflow-x-auto">
                           <table className="w-full text-left border-collapse">
                            <thead><tr className="bg-sec/30 border-b border-white/5"><th className="p-5 text-[9px] font-black uppercase tracking-widest text-sec">Title / Vector</th><th className="p-5 text-[9px] font-black uppercase tracking-widest text-sec">Analyst Identity</th><th className="p-5 text-[9px] font-black uppercase tracking-widest text-sec">Logic Core</th><th className="p-5 text-[9px] font-black uppercase tracking-widest text-sec text-right">Commands</th></tr></thead>
                            <tbody className="divide-y divide-white/5">
                              {reviews.map((r) => (
                                <tr key={r._id} className="group hover:bg-primary-500/[0.02] transition-all">
                                  <td className="p-5"><div className="flex items-center gap-4"><div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black shadow-inner border border-white/5 ${r.bugsFound > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{r.bugsFound}</div><div><p className="text-sm font-black text-main tracking-tight uppercase">{r.title}</p><p className="text-[9px] font-bold text-sec uppercase opacity-40 mt-1">{new Date(r.createdAt).toLocaleDateString()} • INFRA_NODE_SECURE</p></div></div></td>
                                  <td className="p-5"><div className="flex items-center gap-3"><div className="h-6 w-6 rounded-full bg-ter border border-col flex items-center justify-center text-[10px] font-black text-sec uppercase">{r.user?.name?.charAt(0)}</div><span className="text-[11px] font-black text-sec uppercase tracking-tight">{r.user?.name || 'External'}</span></div></td>
                                  <td className="p-5"><div className="flex items-center gap-2"><span className="px-2 py-0.5 bg-primary-500/10 text-primary-500 border border-primary-500/20 rounded text-[9px] font-black uppercase tracking-widest">{r.language}</span><span className={`block h-1 w-1 rounded-full ${r.bugsFound > 0 ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]' : 'bg-emerald-500'}`} /></div></td>
                                  <td className="p-5 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleInspectReview(r._id)} className="p-2.5 bg-ter border border-col text-primary-500 hover:bg-primary-500/10 rounded-xl"><Eye className="h-4 w-4" /></button><button onClick={() => handleDeleteReview(r._id)} className="p-2.5 bg-ter border border-col text-sec hover:text-rose-500 rounded-xl transition-all"><Trash2 className="h-4 w-4" /></button></div></td>
                                </tr>
                              ))}
                            </tbody>
                           </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {tab === 'ai-insights' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                       <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div><p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mb-2">Neural Architecture</p><h2 className="text-3xl font-black text-main tracking-tighter uppercase">Intelligence Protocol</h2></div>
                        <div className="glass-panel px-4 py-2 flex items-center gap-3 border-primary-500/20 bg-primary-500/[0.02] shadow-[0_0_15px_rgba(59,130,246,0.1)]"><Brain className="h-4 w-4 text-primary-500" /><span className="text-[9px] font-black uppercase tracking-widest text-primary-500">Neural Sync</span></div>
                      </header>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                         <div className="lg:col-span-2 glass-panel p-8">
                            <h3 className="text-base font-black uppercase tracking-widest text-main mb-8 flex items-center gap-3"><Terminal className="h-5 w-5 text-primary-500" /> Live Neural Activity</h3>
                            <div className="space-y-4 h-[calc(100vh-320px)] overflow-y-auto pr-4 custom-scrollbar">
                               {aiLogs.map((log, i) => (
                                 <div key={i} className="p-5 bg-ter/40 border border-primary-500/10 rounded-2xl group hover:border-primary-500/30 transition-all"><div className="flex items-start justify-between mb-4"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /></div><div><p className="text-[10px] font-black text-main uppercase tracking-widest">{log.user?.name || 'Root'}</p><p className="text-[9px] font-bold text-sec uppercase opacity-40 mt-0.5">{log.model}</p></div></div><span className="text-[9px] font-black text-primary-500 bg-primary-500/5 px-2 py-1 rounded-lg border border-primary-500/20">{log.tokensUsed} TKN</span></div><div className="bg-main/50 p-4 rounded-xl border border-primary-500/10 italic text-[11px] text-sec leading-relaxed group-hover:text-main transition-colors">"{log.prompt.substring(0, 150)}..."</div><div className="mt-4 flex items-center justify-between"><span className="text-[9px] font-black text-sec uppercase tracking-widest opacity-30">{new Date(log.createdAt).toLocaleString()}</span><button className="text-[9px] font-black text-primary-500 uppercase tracking-widest flex items-center gap-1">Inspect <ChevronRight className="h-3 w-3" /></button></div></div>
                               ))}
                            </div>
                         </div>
                         <div className="space-y-8">
                            <div className="glass-panel p-8 border-primary-500/20 bg-primary-500/[0.01]"><h3 className="text-base font-black uppercase tracking-widest text-main mb-8">Efficiency</h3><div className="space-y-6"><div className="p-6 bg-ter/50 rounded-2xl border border-col"><p className="text-4xl font-black text-main tabular-nums">{stats?.aiMetrics?.successCount || 0}</p><p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2">Successful Executions</p></div><div className="p-6 bg-ter/50 rounded-2xl border border-col"><p className="text-4xl font-black text-rose-500 tabular-nums">{stats?.aiMetrics?.errorCount || 0}</p><p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2">Faults</p></div></div></div>
                            <div className="glass-panel p-8"><h3 className="text-base font-black uppercase tracking-widest text-main mb-8">Allocation</h3><div className="space-y-6">
                                  {[{ label: 'Llama 3.3', val: '92%', color: 'bg-primary-500' }, { label: 'Mixtral', val: '6%', color: 'bg-purple-500' }].map((m) => (
                                    <div key={m.label} className="space-y-2"><div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-sec">{m.label}</span><span className="text-main">{m.val}</span></div><div className="h-1 bg-col/30 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: m.val }} className={`h-full ${m.color}`} /></div></div>
                                  ))}
                            </div></div>
                         </div>
                      </div>
                    </div>
                  )}

                  {tab === 'audit' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8"><div><p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mb-2">Immutable Ledger</p><h2 className="text-3xl font-black text-main tracking-tighter uppercase">Audit Ledger Hub</h2></div><div><button onClick={fetchData} className="p-3 bg-ter border border-col rounded-2xl text-sec hover:text-main transition-all flex items-center gap-2 shadow-xl hover:shadow-primary-500/5"><RefreshCcw className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-widest">Sync</span></button></div></header>
                        <div className="glass-panel p-2 border-col bg-main/30 h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar">
                          <div className="divide-y divide-white/5">
                          {auditLogs.map((log) => (
                            <div key={log._id} className="p-6 transition-colors group">
                               <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                 <div className="flex items-start gap-5">
                                   <div className={`h-12 w-12 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-lg ${log.action.includes('DELETE') ? 'bg-rose-500/10 text-rose-500' : 'bg-primary-500/10 text-primary-500'}`}>
                                     {log.action.includes('DELETE') ? <Trash2 className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                                   </div>
                                   <div>
                                     <div className="flex items-center gap-3 mb-2">
                                       <span className="px-2 py-0.5 rounded bg-primary-500/10 text-primary-500 text-[8px] font-black uppercase tracking-[0.2em]">{log.action}</span>
                                       <span className="text-[9px] font-black text-sec uppercase opacity-30">{new Date(log.createdAt).toLocaleString()}</span>
                                     </div>
                                     <p className="text-sm font-black text-main leading-relaxed max-w-2xl">{log.details}</p>
                                     <div className="flex items-center gap-4 mt-4">
                                       <div className="flex items-center gap-2">
                                         <div className="h-5 w-5 rounded-full bg-ter border border-col flex items-center justify-center text-[8px] font-black uppercase">{log.actor?.name?.charAt(0)}</div>
                                         <span className="text-[10px] font-black text-sec uppercase">{log.actor?.name || 'Master'}</span>
                                       </div>
                                     </div>
                                   </div>
                                 </div>
                                 <div className="text-right text-[9px] font-mono text-sec opacity-20">
                                   TRX: {log._id.substring(18)}<br/>
                                   IP: {log.ipAddress || 'HUB'}
                                 </div>
                               </div>
                            </div>
                          ))}
                        </div></div>
                    </div>
                  )}

                  {tab === 'settings' && settings && (
                     <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
                        <header className="mb-10"><div><p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mb-2">Global Settings</p><h2 className="text-3xl font-black text-main tracking-tighter uppercase">Infrastructure Logic</h2></div></header>
                        <div className="max-w-4xl space-y-8">
                           <section className="glass-panel overflow-hidden border-orange-500/20"><div className="bg-orange-500/10 p-5 border-b border-orange-500/20 flex items-center justify-between"><div className="flex items-center gap-3"><AlertCircle className="h-5 w-5 text-orange-500" /><h3 className="text-sm font-black uppercase tracking-widest text-orange-500">Platform Lockdown</h3></div><div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${settings.maintenanceMode ? 'bg-orange-500 text-white' : 'bg-orange-500/10 text-orange-500'}`}>{settings.maintenanceMode ? 'Active' : 'Nominal'}</div></div><div className="p-8 flex items-center justify-between gap-12"><div><h4 className="text-lg font-black text-main uppercase mb-2">Maintenance Protocol</h4><p className="text-sm text-sec font-medium leading-relaxed">Lock external interface nodes to READ-ONLY. AI synthesis is immediately decapitated project-wide.</p></div><button onClick={() => handleUpdateSettings({ maintenanceMode: !settings.maintenanceMode })} className={`h-10 w-24 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${settings.maintenanceMode ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-ter border border-col text-sec'}`}>{settings.maintenanceMode ? 'Disable' : 'Enable'}</button></div></section>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><section className="glass-panel p-8 space-y-8"><div className="flex items-center gap-3 mb-2"><Brain className="h-5 w-5 text-primary-500" /><h3 className="text-sm font-black uppercase tracking-widest text-main">Neural Core</h3></div><div className="space-y-4"><label className="text-[10px] font-black text-sec uppercase tracking-widest opacity-40">Default Engine</label><select value={settings.defaultAiModel} onChange={(e) => handleUpdateSettings({ defaultAiModel: e.target.value })} className="w-full bg-ter border border-col rounded-xl p-4 text-xs font-black uppercase tracking-widest"><option value="llama-3.3-70b-versatile">Llama 3.3 70B</option><option value="mixtral-8x7b-32768">Mixtral 8x7B</option></select></div></section>
                              <section className="glass-panel p-8 space-y-8"><div className="flex items-center gap-3 mb-2"><Globe className="h-5 w-5 text-emerald-500" /><h3 className="text-sm font-black uppercase tracking-widest text-main">Edge Access</h3></div><div className="flex items-center justify-between p-6 bg-ter/50 rounded-2xl border border-col"><div><p className="text-xs font-black text-main uppercase pr-4">User Provisioning</p></div><button onClick={() => handleUpdateSettings({ registrationEnabled: !settings.registrationEnabled })} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${settings.registrationEnabled ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{settings.registrationEnabled ? 'Active' : 'Locked'}</button></div></section>
                           </div>
                        </div>
                     </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />

      <ReviewInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        review={selectedReview}
      />
    </div>
  );
};

export default AdminPanel;
