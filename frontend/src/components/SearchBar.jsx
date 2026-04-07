import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, FileText, FolderOpen, FileCode, X } from 'lucide-react';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const navigate = useNavigate();
  const ref = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Keyboard Shortcuts: '/' or 'CMD+K'
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === '/' || (e.metaKey && e.key === 'k')) && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        setIsExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setIsExpanded(false);
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        if (!query) setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [query]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
        setResults(data);
        setOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const handleClick = (path) => {
    setOpen(false);
    setQuery('');
    setIsExpanded(false);
    navigate(path);
  };

  const totalResults = results ? results.reviews.length + results.projects.length + results.files.length : 0;

  return (
    <div className="relative" ref={ref}>
      <div 
        className={`flex items-center bg-ter/50 border border-col rounded-xl transition-all duration-500 ease-in-out group shadow-sm overflow-hidden h-10 ${
          isExpanded ? 'w-48 px-3 ring-2 ring-primary-500/20 border-primary-500/50' : 'w-10 px-0 justify-center hover:bg-primary-500/10 cursor-pointer'
        }`}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        <div className={`flex items-center justify-center shrink-0 ${isExpanded ? 'mr-2' : ''}`}>
           <Search className={`h-4 w-4 transition-colors ${isExpanded ? 'text-primary-500' : 'text-sec group-hover:text-primary-600'}`} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsExpanded(true);
            if (results) setOpen(true);
          }}
          placeholder={isExpanded ? "Search..." : ""}
          className={`bg-transparent text-sm text-main outline-none w-full transition-all duration-300 ${
            isExpanded ? 'opacity-100 placeholder:text-sec' : 'hidden'
          }`}
        />

        {isExpanded && query && (
          <button 
            onClick={(e) => { 
               e.stopPropagation();
               setQuery(''); 
               setResults(null); 
            }} 
            className="text-sec hover:text-rose-500 transition-colors ml-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {!isExpanded && (
           <div className="absolute top-full mt-2 hidden group-hover:block whitespace-nowrap bg-main border border-col px-2 py-1 rounded text-[10px] font-bold text-sec shadow-xl animate-in fade-in zoom-in-95 pointer-events-none">
             Press <span className="text-primary-500">/</span> to search
           </div>
        )}
      </div>

      {open && results && isExpanded && (
        <div className="absolute top-full mt-3 w-80 glass-panel shadow-2xl z-50 overflow-hidden right-0 border-col/80 backdrop-blur-xl animate-in slide-in-from-top-2 duration-300">
          {loading ? (
            <div className="p-8 text-center">
               <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3"></div>
               <p className="text-xs text-sec font-medium">Searching indexed files...</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="p-8 text-center">
               <p className="text-xs text-sec font-medium">No matches found for "{query}"</p>
            </div>
          ) : (
            <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
              {results.reviews.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] text-sec uppercase font-black tracking-widest bg-ter/90 border-y border-col/50 sticky top-0 z-10">Reviews</div>
                  {results.reviews.map((r) => (
                    <button key={r._id} onClick={() => handleClick(`/review/${r._id}`)}
                      className="w-full text-left px-4 py-3 hover:bg-primary-500/5 transition-colors flex items-center gap-4 group/item">
                      <FileText className="h-4 w-4 text-emerald-500 shrink-0 group-hover/item:scale-110 transition-transform" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-main group-hover/item:text-primary-500 truncate transition-colors">{r.title}</p>
                        <p className="text-[10px] text-sec font-medium uppercase">{r.language}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.projects.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] text-sec uppercase font-black tracking-widest bg-ter/90 border-y border-col/50 sticky top-0 z-10">Projects</div>
                  {results.projects.map((p) => (
                    <button key={p._id} onClick={() => handleClick(`/projects/${p._id}`)}
                      className="w-full text-left px-4 py-3 hover:bg-primary-500/5 transition-colors flex items-center gap-4 group/item">
                      <FolderOpen className="h-4 w-4 text-purple-500 shrink-0 group-hover/item:scale-110 transition-transform" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-main group-hover/item:text-primary-500 truncate transition-colors">{p.name}</p>
                        <p className="text-[10px] text-sec font-medium uppercase">{p.language}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.files.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] text-sec uppercase font-black tracking-widest bg-ter/90 border-y border-col/50 sticky top-0 z-10">File Index</div>
                  {results.files.map((f) => (
                    <button key={f._id} onClick={() => handleClick(`/projects/${f.project}/files/${f._id}`)}
                      className="w-full text-left px-4 py-3 hover:bg-primary-500/5 transition-colors flex items-center gap-4 group/item">
                      <FileCode className="h-4 w-4 text-amber-500 shrink-0 group-hover/item:scale-110 transition-transform" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-main group-hover/item:text-primary-500 truncate transition-colors">{f.filename}</p>
                        <p className="text-[10px] text-sec font-medium uppercase underline decoration-primary-500/30">Stable Release v{f.currentVersion}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
