import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles,
  Database,
  Terminal,
  Cpu,
  Zap,
  Tag,
  AlignLeft
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const ReviewHistory = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  
  // Deletion State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

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

  const handleDeleteTrigger = (id) => {
    setReviewToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;
    try {
      await axios.delete(`/api/reviews/${reviewToDelete}`);
      setReviews(reviews.filter(r => r._id !== reviewToDelete));
      setReviewToDelete(null);
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      // 1. Exclude project-linked reviews (logic from previous version)
      if (review.fileId) return false;
      const title = review.title || '';
      const isProjectFile = title.includes('/') || title.includes('\\') || /\.(js|jsx|ts|tsx|py|html|css|json|java|cpp|go|rb|php)$/i.test(title);
      if (isProjectFile) return false;

      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLang = languageFilter === 'all' || review.language === languageFilter;
      return matchesSearch && matchesLang;
    });
  }, [reviews, searchTerm, languageFilter]);

  const languages = ['all', ...new Set(reviews.map(r => r.language))];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black text-sec uppercase tracking-[0.3em] animate-pulse">Querying Intelligence Vault...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-8">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <div className="flex items-center gap-2 text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mb-3">
              <Database className="h-3 w-3" /> Historical Archive
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-main sm:text-5xl">
              Analysis <span className="text-primary-500">Vault</span>
            </h1>
            <p className="text-sec font-medium mt-2 max-w-xl">
              Access your historical technical scorecards. Retrieve AI-driven insights and bug telemetry from {filteredReviews.length} unique transmissions.
            </p>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <Link to="/new-review?new=true" className="btn-primary flex items-center justify-center gap-2 h-12 px-8 shadow-xl shadow-primary-500/20 group">
              <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              Analyze New Transmission
            </Link>
          </motion.div>
        </div>

        {/* Global Filter Bar */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-panel p-2 mb-10 flex flex-col sm:flex-row gap-2 border-col/50 bg-ter/30 shadow-2xl backdrop-blur-xl"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sec" />
            <input
              type="text"
              placeholder="Filter by identifier or keyword..."
              className="w-full bg-main/50 border border-col rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/5 transition-all outline-none text-main font-bold placeholder:font-medium placeholder:opacity-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sec" />
            <select
              className="w-full bg-main/50 border border-col rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/5 transition-all outline-none text-main font-black appearance-none cursor-pointer uppercase tracking-widest"
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
            >
              {languages.map(lang => (
                <option key={lang} value={lang} className="capitalize font-black bg-main text-main text-[10px]">
                  {lang === 'all' ? 'All Architectures' : lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {filteredReviews.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-20 text-center flex flex-col items-center justify-center grayscale opacity-50 border-dashed border-2 border-col"
          >
            <div className="h-20 w-20 bg-ter rounded-3xl flex items-center justify-center mb-6 text-sec">
               <History className="h-10 w-10 px-0" />
            </div>
            <h3 className="text-2xl font-black text-main tracking-tighter mb-2">Archive Offline</h3>
            <p className="text-sec font-medium max-w-sm mb-8 leading-relaxed text-sm italic">
              No historical data points match your current filter parameters. Expand your search or initialize a new technical review to populate the vault.
            </p>
            <button onClick={() => {setSearchTerm(''); setLanguageFilter('all');}} className="btn-secondary px-8 h-12">Reset Parameters</button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredReviews.map((review) => (
              <motion.div key={review._id} variants={itemVariants}>
                <div className="glass-panel p-0 group overflow-hidden border-col transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex flex-col h-full bg-ter/10">
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-ter border border-col flex items-center justify-center text-sec group-hover:bg-primary-500/10 group-hover:text-primary-500 group-hover:border-primary-500/30 transition-all duration-500">
                           <Terminal className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                           <h3 className="font-black text-lg text-main group-hover:text-primary-500 transition-colors tracking-tight leading-none mb-1.5 truncate pr-8">
                             {review.title || 'Untitled Transmission'}
                           </h3>
                           <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-sec uppercase tracking-widest opacity-60">{review.language}</span>
                             <span className="h-1 w-1 bg-ter rounded-full opacity-40"></span>
                             <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest opacity-60">ID: {review._id.slice(-6).toUpperCase()}</span>
                           </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); handleDeleteTrigger(review._id); }}
                        className="absolute top-4 right-4 p-2 text-sec/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                       {review.aiTags && review.aiTags.length > 0 ? (
                         review.aiTags.slice(0, 3).map((tag, idx) => (
                           <span key={idx} className="text-[8px] font-black uppercase text-sec bg-ter/50 border border-col rounded-md px-2 py-1 tracking-tighter hover:text-primary-500 hover:border-primary-500/50 transition-colors">
                             #{tag}
                           </span>
                         ))
                       ) : (
                         <span className="text-[8px] font-black uppercase text-sec opacity-30 italic">No Metadata Tags</span>
                       )}
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                       <div className="flex items-center gap-4">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-[10px] tracking-tight ${
                            review.bugsFound > 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          }`}>
                            {review.bugsFound > 0 ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                            {review.bugsFound > 0 ? `${review.bugsFound} DELTAS FOUND` : 'HEALTHY STATE'}
                          </div>
                          <div className="flex items-center gap-2 text-sec text-[10px] font-bold opacity-60">
                             <Clock className="h-3 w-3" />
                             {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                       </div>
                    </div>
                  </div>

                  <Link 
                    to={`/review/${review._id}`} 
                    className="w-full flex items-center justify-between p-4 bg-ter/30 border-t border-col text-[10px] font-black text-sec uppercase tracking-[0.2em] group-hover:bg-primary-500/10 group-hover:text-primary-500 transition-all"
                  >
                    Retrieve Technical Scorecard
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Confirmation Modal */}
        <ConfirmModal 
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Archive Purge Request?"
          message="This action will permanently delete the technical scorecard and all synchronized findings from the secure vault. This transmission cannot be recovered."
        />
      </div>
    </div>
  );
};

export default ReviewHistory;
