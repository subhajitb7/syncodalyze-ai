import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, FileText, FolderOpen, FileCode, X } from 'lucide-react';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

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
    navigate(path);
  };

  const totalResults = results ? results.reviews.length + results.projects.length + results.files.length : 0;

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2 bg-dark-800 border border-dark-600 rounded-lg px-3 py-1.5 focus-within:border-primary-500 transition-colors w-56">
        <Search className="h-4 w-4 text-gray-500 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          placeholder="Search..."
          className="bg-transparent text-sm text-white outline-none w-full"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults(null); }} className="text-gray-500 hover:text-white">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {open && results && (
        <div className="absolute top-full mt-2 w-80 glass-panel shadow-2xl z-50 overflow-hidden right-0">
          {loading ? (
            <p className="p-4 text-sm text-gray-400 text-center">Searching...</p>
          ) : totalResults === 0 ? (
            <p className="p-4 text-sm text-gray-500 text-center">No results found</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.reviews.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs text-gray-500 uppercase font-medium bg-dark-800">Reviews</div>
                  {results.reviews.map((r) => (
                    <button key={r._id} onClick={() => handleClick(`/review/${r._id}`)}
                      className="w-full text-left px-3 py-2.5 hover:bg-dark-700/50 flex items-center gap-3 transition-colors">
                      <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="text-xs text-gray-500">{r.language}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.projects.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs text-gray-500 uppercase font-medium bg-dark-800">Projects</div>
                  {results.projects.map((p) => (
                    <button key={p._id} onClick={() => handleClick(`/projects/${p._id}`)}
                      className="w-full text-left px-3 py-2.5 hover:bg-dark-700/50 flex items-center gap-3 transition-colors">
                      <FolderOpen className="h-4 w-4 text-purple-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.language}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.files.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs text-gray-500 uppercase font-medium bg-dark-800">Files</div>
                  {results.files.map((f) => (
                    <button key={f._id} onClick={() => handleClick(`/projects/${f.project}/files/${f._id}`)}
                      className="w-full text-left px-3 py-2.5 hover:bg-dark-700/50 flex items-center gap-3 transition-colors">
                      <FileCode className="h-4 w-4 text-yellow-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{f.filename}</p>
                        <p className="text-xs text-gray-500">v{f.currentVersion}</p>
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
