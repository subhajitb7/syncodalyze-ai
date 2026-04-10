import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  FileCode, History, Plus, AlertCircle, CheckCircle2,
  BarChart3, Bug, CheckCircle, Shield, Loader2, Upload, ChevronRight, Sparkles
} from 'lucide-react';
import GithubIcon from '../components/GithubIcon';
import SearchBar from '../components/SearchBar';
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
        setError('Connection failed. Please ensure the backend is reachable.');
      } finally {
        setLoading(false);
      }
    };
    const fetchInsights = async () => {
      setFetchingInsights(true);
      try {
        const { data } = await axios.get('/api/ai/insights');
        setInsights(data.insights);
      } catch (err) {
        console.error('Failed to fetch insights', err);
      } finally {
        setFetchingInsights(false);
      }
    };
    fetchData();
    fetchInsights();
  }, []);



  const filteredReviews = reviews.filter((r) => {
    if (filter === 'bugs') return r.bugsFound > 0;
    if (filter === 'clean') return r.bugsFound === 0;
    return true;
  });

  const getSnippet = (text) => {
    if (!text) return 'No feedback content.';
    // Remove headers, bold/italic markers, and code block symbols
    let cleanText = text
      .replace(/^#+\s*(Code Review|AI Code Review|Syncodalyze AI).*\n/i, '')
      .replace(/^(Code Review|AI Code Review|Syncodalyze AI|Overview:|Here is an overview:?)\s*/i, '')
      .replace(/[#*_~`>]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\s+/g, ' ');

    return cleanText.trim().substring(0, 120) + '...';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold ">Dashboard</h1>
          <p className="text-sec mt-1">Record and analyze your code reviews.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchBar />
          <Link to="/new-review" className="btn-primary flex items-center justify-center gap-2 h-10 px-4 text-xs font-bold shadow-lg shadow-primary-500/10">
            <Plus className="h-3.5 w-3.5" /> Quick Code
          </Link>
          <Link to="/new-review" className="btn-secondary flex items-center justify-center gap-2 h-10 px-4 text-xs font-bold border-col">
            <Upload className="h-3.5 w-3.5" /> Upload File
          </Link>
          <Link to="/projects" className="btn-secondary flex items-center justify-center gap-2 h-10 px-4 text-xs font-bold border-col">
            <GithubIcon className="h-3.5 w-3.5" /> Repository
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="text-xs text-sec font-bold uppercase tracking-wider">Total Reviews</p>
            <p className="text-2xl font-bold text-main">{stats.totalReviews}</p>
          </div>
        </div>
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-red-500/10 rounded-xl flex items-center justify-center">
            <Bug className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-sec font-bold uppercase tracking-wider">Total Bugs Found</p>
            <p className="text-2xl font-bold text-main">{stats.totalBugs}</p>
          </div>
        </div>
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-sec font-bold uppercase tracking-wider">Clean Code Rate</p>
            <p className="text-2xl font-bold text-main">{stats.cleanPercent}%</p>
          </div>
        </div>
      </div>

      {/* AI Intelligence Summary Card */}
      <div className="glass-panel p-6 sm:p-8 mb-10 border-primary-500/20 bg-gradient-to-br from-primary-500/[0.08] via-transparent to-transparent relative overflow-hidden group shadow-2xl shadow-primary-500/5 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
        <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-700" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        <div className="absolute -top-12 -right-12 opacity-5 blur-2xl group-hover:scale-110 transition-transform duration-1000">
           <Sparkles className="h-64 w-64 text-primary-500" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
          {/* AI Info */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center flex-1 text-center md:text-left min-w-0">
            <div className="h-14 w-14 bg-primary-500 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl shadow-primary-500/40 relative transform group-hover:rotate-6 transition-transform">
              <Sparkles className="h-7 w-7 text-white" />
              <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-4 border-sec flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                <h2 className="text-xl font-black text-main tracking-tighter uppercase whitespace-nowrap">AI Intelligence Summary</h2>
                <div className="h-px bg-col/50 flex-1 hidden md:block"></div>
              </div>
              
              {fetchingInsights ? (
                <div className="flex items-center gap-4 text-primary-500 text-sm mt-3 font-black animate-pulse">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 rounded-full bg-primary-500 animate-bounce"></span>
                  </div>
                  SYNTESIZING PERSONALIZED GROWTH TRAJECTORY...
                </div>
              ) : (
                <div className="relative group/text px-2 min-h-[4rem] flex items-center">
                  <span className="text-6xl absolute -top-10 -left-6 opacity-10 font-serif text-primary-500 group-hover:opacity-20 transition-opacity select-none pointer-events-none">"</span>
                  <div className="text-main leading-relaxed text-sm md:text-base font-bold italic relative z-10 pl-6 pr-4 text-justify [text-justify:inter-word]">
                    {insights ? (
                      insights.split(/(bugs|improvements|strengths|focus|quality|performance|security)/gi).map((part, i) => (
                        <span key={i} className={/bugs|improvements|strengths|focus|quality|performance|security/i.test(part) ? 'text-primary-500 font-black not-italic px-1 bg-primary-500/5 rounded' : ''}>
                          {part}
                        </span>
                      ))
                    ) : (
                      <span className="opacity-60 text-sec">Analyze more code to unlock your personalized engineering trajectory by allowing the AI to synthesize your review patterns...</span>
                    )}
                  </div>
                  <span className="text-6xl absolute -bottom-12 -right-4 opacity-10 font-serif text-primary-500 group-hover:opacity-20 transition-opacity select-none pointer-events-none">"</span>
                </div>
              )}
            </div>
          </div>

          {/* Metric Section */}
          <div className="lg:border-l border-col/30 lg:pl-12 flex flex-col items-center gap-5 shrink-0">
             <div className="relative h-28 w-28 flex items-center justify-center group/metric">
                <div className="absolute inset-0 bg-primary-500/10 rounded-full blur-2xl opacity-0 group-hover/metric:opacity-100 transition-opacity duration-500"></div>
                <svg className="h-full w-full rotate-[-90deg] relative z-10">
                  <circle
                    cx="56" cy="56" r="48"
                    className="stroke-ter/50 fill-none stroke-[6]"
                  />
                  <circle
                    cx="56" cy="56" r="48"
                    className="stroke-primary-500 fill-none stroke-[6] transition-all duration-1000 ease-out"
                    strokeDasharray="301.59"
                    strokeDashoffset={301.59 - (301.59 * stats.cleanPercent) / 100}
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                   <span className="text-3xl font-black text-main tracking-tighter">{stats.cleanPercent}%</span>
                   <span className="text-[7px] font-black text-primary-500 uppercase tracking-[0.3em] mt-0.5">Stability</span>
                </div>
             </div>
             
             <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/5 border border-primary-500/10 rounded-full mb-2">
                   <span className="text-[8px] font-black text-sec uppercase tracking-[0.2em]">Growth Metric</span>
                </div>
                <p className="text-[9px] text-sec max-w-[160px] font-bold leading-tight uppercase opacity-60">
                   Syncing with <span className="text-main font-black underline decoration-primary-500/30 decoration-2">{stats.totalReviews} analyzes</span>
                </p>
             </div>
          </div>
        </div>
      </div>




      {/* Reviews Section */}
      <div className="glass-panel p-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
        <div className="flex items-center justify-between mb-6 border-b border-col pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-primary-500" />
              <h2 className="text-xl font-bold text-main">Recent Reviews</h2>
            </div>
            <Link to="/reviews" className="text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1 group">
              View All History <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          {/* Filter */}
          <div className="flex gap-2">
            {['all', 'bugs', 'clean'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize font-semibold ${filter === f ? 'border-primary-500 bg-primary-500/10 text-primary-600' : 'border-col text-sec hover:border-gray-400'}`}
              >
                {f === 'all' ? 'All' : f === 'bugs' ? 'Has Issues' : 'Clean'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sec font-medium">Loading your history...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-ter/50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCode className="h-10 w-10 text-sec" />
            </div>
            <h3 className="text-lg font-bold text-main mb-2">
              {filter === 'all' ? 'No reviews yet' : 'No matching reviews'}
            </h3>
            <p className="text-sec max-w-sm mx-auto mb-6">
              {filter === 'all' ? 'Start your first AI code review now.' : 'Try changing the filter.'}
            </p>
            {filter === 'all' && (
              <Link to="/new-review" className="btn-secondary">Create a Review</Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.slice(0, 3).map((review) => (
              <Link
                key={review._id}
                to={`/review/${review._id}`}
                className="bg-sec border border-col rounded-xl p-5 hover:border-primary-500/50 hover:shadow-lg transition-all flex flex-col min-h-[12rem] group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg truncate pr-4 text-main group-hover:text-primary-500 transition-colors">{review.title}</h3>
                  <span className="text-[10px] bg-ter px-2 py-0.5 rounded text-primary-600 border border-col font-bold uppercase shrink-0">
                    {review.language}
                  </span>
                </div>
                <div className="flex-grow">
                  <p className="text-sm text-sec line-clamp-3 leading-relaxed">
                    {getSnippet(review.aiFeedback)}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-col flex justify-between items-center text-sm">
                  <span className="text-sec font-medium">{new Date(review.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    {review.bugsFound > 0 ? (
                      <span className="bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full border border-red-500/20 flex items-center gap-1 text-[10px] font-bold">
                        <AlertCircle className="h-3 w-3" /> {review.bugsFound} Bugs
                      </span>
                    ) : (
                      <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 text-[10px] font-bold">
                        <CheckCircle2 className="h-3 w-3" /> Clean
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
