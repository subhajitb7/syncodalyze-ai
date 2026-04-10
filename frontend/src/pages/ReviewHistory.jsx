import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  History, 
  Search, 
  Filter, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Trash2, 
  FileCode,
  Sparkles
} from 'lucide-react';

const ReviewHistory = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data } = await axios.get('/api/reviews');
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review history?')) return;
    try {
      await axios.delete(`/api/reviews/${id}`);
      setReviews(reviews.filter(r => r._id !== id));
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLang = languageFilter === 'all' || review.language === languageFilter;
    return matchesSearch && matchesLang;
  });

  const languages = ['all', ...new Set(reviews.map(r => r.language))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Platform-standard vertical baseline spacer */}
      <div className="h-10 mb-2 opacity-0 pointer-events-none hidden lg:block"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-main">
            <History className="h-8 w-8 text-primary-500" /> Review Vault
          </h1>
          <p className="text-sec mt-1 font-medium italic">Manage all quick code AI code analyses.</p>
        </div>
        <Link to="/new-review" className="btn-primary flex items-center justify-center gap-2 h-11 px-6 shadow-lg shadow-primary-500/20 group">
          <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
          Analyze New Code
        </Link>
      </div>

      {/* Controls */}
      <div className="glass-panel p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sec" />
          <input
            type="text"
            placeholder="Search by title..."
            className="w-full bg-ter border border-col rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 transition-all outline-none text-main font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative min-w-[160px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sec" />
          <select
            className="w-full bg-ter border border-col rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 transition-all outline-none text-main font-bold appearance-none cursor-pointer"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
          >
            {languages.map(lang => (
              <option key={lang} value={lang} className="capitalize font-bold bg-main">
                {lang === 'all' ? 'All Languages' : lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {filteredReviews.length === 0 ? (
        <div className="glass-panel py-20 text-center">
          <div className="h-16 w-16 bg-ter rounded-2xl flex items-center justify-center mx-auto mb-4 text-sec">
             <FileCode className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-main mb-2">No Reviews Found</h3>
          <p className="text-sec text-sm max-w-xs mx-auto mb-6">
            {searchTerm || languageFilter !== 'all' 
              ? "Change your filters to find existing reviews." 
              : "You haven't stored any code analyses yet. Start a new session to build your vault."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review) => (
            <div key={review._id} className="glass-panel p-5 hover:border-primary-500/50 transition-all group relative animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                      <FileCode className="h-5 w-5" />
                   </div>
                    <div>
                       <h3 className="font-bold text-main line-clamp-1 group-hover:text-primary-500 transition-colors">
                         {review.title || 'Untitled Review'}
                       </h3>
                       <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[9px] font-black uppercase text-sec tracking-wider opacity-60">{review.language}</span>
                          {review.aiTags && review.aiTags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="text-[8px] bg-primary-500/5 text-primary-600 px-1.5 py-0.5 rounded-full border border-primary-500/10 font-bold uppercase tracking-tighter">#{tag}</span>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                 <div className={`px-2 py-1 rounded-lg flex items-center gap-1.5 border ${
                   review.bugsFound > 0 
                     ? 'bg-red-500/10 border-red-500/20 text-red-600' 
                     : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                 }`}>
                    {review.bugsFound > 0 ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                    <span className="text-[10px] font-bold">
                      {review.bugsFound > 0 ? `${review.bugsFound} Issues` : 'Clean Code'}
                    </span>
                 </div>
                 <div className="flex items-center gap-1.5 text-sec">
                    <Clock className="h-3 w-3" />
                    <span className="text-[10px] font-bold">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                 </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-col">
                <Link 
                  to={`/review/${review._id}`} 
                  className="flex-1 bg-ter hover:bg-sec border border-col rounded-xl px-4 py-2 text-xs font-bold text-main flex items-center justify-center gap-2 transition-all"
                >
                  View Analysis <ChevronRight className="h-3 w-3" />
                </Link>
                <button 
                  onClick={() => handleDelete(review._id)}
                  className="h-8 w-8 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewHistory;
