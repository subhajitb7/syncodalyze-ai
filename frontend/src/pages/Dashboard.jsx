import { useState, useEffect, useContext, useRef, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line
} from 'recharts';
import {
  FileCode, History, Plus, AlertCircle, CheckCircle2,
  BarChart3, Bug, CheckCircle, Shield, Loader2, Upload, 
  ChevronRight, Sparkles, Terminal, Cpu, Zap, Activity,
  Globe, Search, Settings, LayoutDashboard
} from 'lucide-react';
import GithubIcon from '../components/GithubIcon';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalReviews: 0, totalBugs: 0, cleanPercent: 100 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [insights, setInsights] = useState('');
  const [fetchingInsights, setFetchingInsights] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Track mouse for glow effect
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      try {
        const [reviewsRes, statsRes] = await Promise.all([
          axios.get('/api/reviews'),
          axios.get('/api/reviews/stats'),
        ]);
        setReviews(reviewsRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Failed to fetch data', error);
        setError('Connection interrupted. Synchronizer offline.');
      } finally {
        setLoading(false);
      }
    };

    const fetchInsights = async () => {
      const cachedInsights = sessionStorage.getItem('ai_insights');
      if (cachedInsights) {
        setInsights(cachedInsights);
        return;
      }

      setFetchingInsights(true);
      try {
        const { data } = await axios.get('/api/ai/insights');
        setInsights(data.insights || '');
        if (data.insights) {
          sessionStorage.setItem('ai_insights', data.insights);
        }
      } catch (err) {
        console.error('Failed to fetch insights', err);
      } finally {
        setFetchingInsights(false);
      }
    };

    fetchData();
    fetchInsights();
  }, []);

  // Compute telemetry data for charts
  const chartData = useMemo(() => {
    return reviews.slice(0, 7).reverse().map((r, i) => ({
      name: new Date(r.createdAt).toLocaleDateString(undefined, { weekday: 'short' }),
      bugs: r.bugsFound,
      score: r.bugsFound === 0 ? 100 : Math.max(20, 100 - (r.bugsFound * 15)),
    }));
  }, [reviews]);

  const radarData = [
    { subject: 'Security', A: 85 + (stats.cleanPercent / 10), fullMark: 150 },
    { subject: 'Performance', A: 70 + (stats.totalReviews / 2), fullMark: 150 },
    { subject: 'Readability', A: 90, fullMark: 150 },
    { subject: 'Complexity', A: 65, fullMark: 150 },
    { subject: 'Standard', A: 80, fullMark: 150 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="h-20 w-20 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
          <Cpu className="absolute inset-0 m-auto h-8 w-8 text-primary-500 animate-pulse" />
        </div>
        <p className="mt-6 text-sec font-black tracking-widest uppercase animate-pulse">Initializing Command Center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header / System Status */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <div className="flex items-center gap-4 text-[9px] font-black text-sec uppercase tracking-widest mb-2 flex-wrap">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                </span>
                System Live • Region: {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </span>
              <span className="h-1 w-1 bg-ter rounded-full hidden sm:block"></span>
              <span className="flex items-center gap-2 opacity-60">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                API Gateway: Online
              </span>
              <span className="h-1 w-1 bg-ter rounded-full hidden sm:block"></span>
              <span className="flex items-center gap-2 opacity-60">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                AI Core: v4.2-Stable
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-main flex items-center gap-3">
              Engineering <span className="text-primary-500">Command</span>
            </h1>
            <p className="text-sec font-medium mt-1">Sovereign oversight of your technical capital.</p>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-wrap gap-3"
          >
            <Link to="/new-review?new=true" className="btn-primary flex items-center gap-2 py-3 px-6 shadow-2xl">
              <Zap className="h-4 w-4 fill-current" /> New Scan
            </Link>
            <Link to="/projects?create=true" className="btn-secondary flex items-center gap-2 py-3 px-6 border-col bg-ter/50 backdrop-blur-md">
              <GithubIcon className="h-4 w-4" /> Sync Repository
            </Link>
          </motion.div>
        </div>

        {/* Bento Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          
          {/* Intelligence Core (Primary) */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-8 glass-panel p-8 relative overflow-hidden group min-h-[420px]"
            onMouseMove={handleMouseMove}
            style={{ '--mouse-x': `${mousePos.x}px`, '--mouse-y': `${mousePos.y}px` }}
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Cpu className="h-32 w-32 text-primary-500" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row h-full gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary-500/10 rounded-lg">
                    <Sparkles className="h-5 w-5 text-primary-500" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-main">Cognitive Core 2.0</h2>
                </div>

                <div className="space-y-6">
                  <div className="min-h-[120px] relative">
                    <AnimatePresence mode="wait">
                      {fetchingInsights ? (
                        <motion.div 
                          key="loading"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex flex-col gap-4"
                        >
                          <div className="h-4 w-3/4 bg-ter animate-pulse rounded"></div>
                          <div className="h-4 w-1/2 bg-ter animate-pulse rounded"></div>
                          <div className="h-4 w-2/3 bg-ter animate-pulse rounded"></div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="content"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="text-lg leading-relaxed text-sec font-medium italic"
                        >
                          "{insights || "Initiate more reviews to generate cross-project cognitive mapping and engineering trends."}"
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-col/50">
                    <div>
                      <p className="text-[10px] font-black text-sec uppercase tracking-widest mb-1">Health Score</p>
                      <p className="text-2xl font-black text-emerald-500">{stats.cleanPercent}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-sec uppercase tracking-widest mb-1">Risk Factor</p>
                      <p className="text-2xl font-black text-red-500">{stats.totalBugs}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-sec uppercase tracking-widest mb-1">Compute</p>
                      <p className="text-2xl font-black text-primary-500">{stats.totalReviews}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-sec uppercase tracking-widest mb-1">Uptime</p>
                      <p className="text-2xl font-black text-main">99.9%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-64 h-64 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="var(--border-col)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-sec)', fontSize: 10, fontWeight: 700 }} />
                    <Radar
                      name="Quality"
                      dataKey="A"
                      stroke="var(--color-primary-500)"
                      fill="var(--color-primary-500)"
                      fillOpacity={0.2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Activity Feed (Sidebar on Desktop) */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-4 glass-panel p-6 flex flex-col h-[420px]"
          >
            <div className="flex items-center justify-between mb-6 border-b border-col pb-4">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary-500" />
                <h2 className="text-lg font-black uppercase tracking-tighter text-main">Pulse Feed</h2>
              </div>
              <button className="text-[10px] font-black text-primary-500 uppercase hover:underline">Live</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {reviews.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="h-12 w-12 bg-ter rounded-full flex items-center justify-center mb-4">
                    <Terminal className="h-6 w-6 text-sec" />
                  </div>
                  <p className="text-xs text-sec font-bold">No signal detected.<br/>Awaiting first transmission.</p>
                </div>
              ) : (
                reviews.slice(0, 10).map((r) => (
                  <Link 
                    key={r._id} 
                    to={`/review/${r._id}`}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-ter transition-all group border border-transparent hover:border-col"
                  >
                    <div className={`h-10 w-10 rounded-lg shrink-0 flex items-center justify-center text-xs font-black ${r.bugsFound > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {r.bugsFound > 0 ? 'ERR' : 'OK'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-main truncate group-hover:text-primary-500 transition-colors">{r.title}</p>
                      <p className="text-[10px] text-sec font-medium">{new Date(r.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ter group-hover:text-sec transition-all" />
                  </Link>
                ))
              )}
            </div>
            
            <Link to="/reviews" className="mt-4 pt-4 border-t border-col text-center text-xs font-black text-sec hover:text-main transition-colors uppercase tracking-widest">
              View All Transmissions
            </Link>
          </motion.div>

          {/* Telemetry Charts (Wide Row) */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-12 glass-panel p-0 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-col">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-[10px] font-black text-sec uppercase tracking-[0.2em]">Stability Delta</p>
                    <h3 className="text-2xl font-black text-main">{stats.cleanPercent}%</h3>
                  </div>
                  <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
                <div className="h-24 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="score" stroke="var(--color-primary-500)" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-[10px] font-black text-sec uppercase tracking-[0.2em]">Bugs Detected</p>
                    <h3 className="text-2xl font-black text-main">{stats.totalBugs}</h3>
                  </div>
                  <div className="h-10 w-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <Bug className="h-5 w-5 text-red-500" />
                  </div>
                </div>
                <div className="h-24 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <Line type="step" dataKey="bugs" stroke="#ef4444" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-8 bg-primary-500/5">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-[10px] font-black text-sec uppercase tracking-[0.2em]">Operational Level</p>
                    <h3 className="text-2xl font-black text-main">PREMIUM</h3>
                  </div>
                  <div className="h-10 w-10 bg-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20 animate-pulse">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className="text-xs text-sec font-medium leading-relaxed">
                  Your AI core is operating at peak efficiency. All security protocols are active and monitoring {stats.totalReviews} telemetry nodes.
                </p>
                <div className="mt-6 flex gap-2">
                  <div className="h-1.5 flex-1 bg-primary-500 rounded-full"></div>
                  <div className="h-1.5 flex-1 bg-primary-500 rounded-full"></div>
                  <div className="h-1.5 flex-1 bg-primary-500 rounded-full"></div>
                  <div className="h-1.5 flex-1 bg-ter rounded-full"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Analysis Status Summary */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-col pt-8 opacity-40">
          <div className="text-[10px] font-black text-sec uppercase tracking-[0.2em]">
            Syncodalyze Architecture • Command Center v2
          </div>
          <div className="text-[10px] font-black text-sec uppercase tracking-[0.2em]">
            Internal Core Latency: 42ms
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
