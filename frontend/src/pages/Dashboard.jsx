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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reviewsRes, statsRes] = await Promise.all([
          axios.get('/api/reviews'),
          axios.get('/api/reviews/stats'),
        ]);
        setReviews(reviewsRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Failed to fetch data', error);
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
      .replace(/^#+\s*(Code Review|AI Code Review).*\n/i, '')
      .replace(/^(Code Review|AI Code Review|Overview:|Here is an overview:?)\s*/i, '')
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

      {/* AI Insights Card */}
      <div className="glass-panel p-6 mb-8 border-primary-500/20 bg-primary-500/5 relative overflow-hidden group shadow-2xl shadow-primary-500/5">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
           <Sparkles className="h-24 w-24 text-primary-500" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
          <div className="h-14 w-14 bg-primary-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/30">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-main">AI Developer Insights</h2>
            </div>
            {fetchingInsights ? (
              <div className="flex items-center gap-2 text-sec text-sm mt-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary-500" /> Analyzing your coding patterns...
              </div>
            ) : (
              <p className="text-sec leading-relaxed max-w-3xl italic font-medium">
                "{insights || "Keep reviewing code to unlock personalized growth tips from your AI mentor."}"
              </p>
            )}
          </div>
          <div className="md:border-l border-col md:pl-6 flex flex-col gap-2 shrink-0">
             <div className="text-[10px] font-black text-sec uppercase tracking-widest">Growth Metric</div>
             <div className="flex items-center gap-2">
                <div className="h-2 w-32 bg-col rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.cleanPercent}%` }}></div>
                </div>
                <span className="text-sm font-bold text-main">{stats.cleanPercent}%</span>
             </div>
             <p className="text-[10px] text-sec max-w-[140px] font-bold">Overall Code Stability Score based on your history.</p>
          </div>
        </div>
      </div>




      {/* Reviews Section */}
      <div className="glass-panel p-6">
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
