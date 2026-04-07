import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  FileCode, History, Plus, AlertCircle, CheckCircle2, 
  BarChart3, Bug, CheckCircle, Shield, Loader2 
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalReviews: 0, totalBugs: 0, cleanPercent: 100 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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
    fetchData();
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold ">Dashboard</h1>
          <p className="text-sec mt-1">Overview of your code review activity.</p>
        </div>
        <Link to="/new-review" className="btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" /> New Review
        </Link>
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


      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="glass-panel p-6 flex items-center justify-between border-primary-500/20 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-bold text-main">Quick Review</h3>
              <p className="text-sm text-sec mt-1 font-medium">Submit a code snippet for instant AI analysis.</p>
            </div>
          </div>
          <Link to="/new-review" className="btn-primary">
            Start Now
          </Link>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6 border-b border-col pb-4">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-primary-500" />
            <h2 className="text-xl font-bold text-main">Recent Reviews</h2>
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
            {filteredReviews.map((review) => (
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
