import { useState, useEffect } from 'react';
import axios from 'axios';
import { Brain, Clock, Zap, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const AiLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsRes, statsRes] = await Promise.all([
          axios.get('/api/ai-logs'),
          axios.get('/api/ai-logs/stats'),
        ]);
        setLogs(logsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="h-8 w-8 text-purple-400" /> AI Usage Logs
        </h1>
        <p className="text-gray-400 mt-1">Track your AI code review history and usage metrics.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="glass-panel p-4">
            <p className="text-xs text-gray-400 mb-1">Total Calls</p>
            <p className="text-2xl font-bold">{stats.totalCalls}</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-xs text-gray-400 mb-1">Successful</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.successCalls}</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-xs text-gray-400 mb-1">Errors</p>
            <p className="text-2xl font-bold text-red-400">{stats.errorCalls}</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-xs text-gray-400 mb-1">Total Tokens</p>
            <p className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-xs text-gray-400 mb-1">Avg Response</p>
            <p className="text-2xl font-bold">{stats.avgResponseTime}ms</p>
          </div>
        </div>
      )}

      {/* Language breakdown */}
      {stats?.byLanguage?.length > 0 && (
        <div className="glass-panel p-6 mb-8">
          <h3 className="font-semibold mb-4">Calls by Language</h3>
          <div className="flex flex-wrap gap-3">
            {stats.byLanguage.map((l) => (
              <div key={l._id} className="bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 flex items-center gap-2">
                <span className="text-sm font-medium capitalize">{l._id}</span>
                <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">{l.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs List */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-dark-600">
          <h3 className="font-semibold">Recent Logs ({logs.length})</h3>
        </div>
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">No AI logs yet. Run a code review to see logs here.</p>
        ) : (
          <div className="divide-y divide-dark-700/50">
            {logs.map((log) => (
              <div key={log._id} className="hover:bg-dark-800/30 transition-colors">
                <button
                  onClick={() => setExpandedId(expandedId === log._id ? null : log._id)}
                  className="w-full text-left p-4 flex items-center gap-4"
                >
                  {log.status === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm truncate">
                        {log.review?.title || 'Direct Review'}
                      </span>
                      <span className="text-xs bg-dark-700 px-2 py-0.5 rounded text-primary-300 uppercase shrink-0">{log.language}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                    <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{log.tokensUsed}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{log.responseTimeMs}ms</span>
                    <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                    {expandedId === log._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>
                {expandedId === log._id && (
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1 uppercase font-medium">Prompt</p>
                      <pre className="bg-dark-900 border border-dark-600 rounded-lg p-3 text-xs text-gray-300 overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap">{log.prompt}</pre>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 uppercase font-medium">AI Response</p>
                      <pre className="bg-dark-900 border border-dark-600 rounded-lg p-3 text-xs text-gray-300 overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap">{log.response?.substring(0, 1000)}{log.response?.length > 1000 ? '...' : ''}</pre>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Model: <span className="text-gray-300">{log.model}</span></span>
                      <span>Tokens: <span className="text-gray-300">{log.tokensUsed}</span></span>
                      <span>Time: <span className="text-gray-300">{log.responseTimeMs}ms</span></span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiLogs;
