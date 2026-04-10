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
      {/* Platform-standard vertical baseline spacer */}
      <div className="h-10 mb-2 opacity-0 pointer-events-none hidden lg:block"></div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-main">
          <Brain className="h-8 w-8 text-purple-600" /> AI Usage Logs
        </h1>
        <p className="text-sec mt-1 font-medium">Track your Syncodalyze AI history and usage metrics.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="glass-panel p-4">
            <p className="text-xs text-sec mb-1 font-bold uppercase">Total Calls</p>
            <p className="text-2xl font-bold text-main">{stats.totalCalls}</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-xs text-sec mb-1 font-bold uppercase">Successful</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.successCalls}</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-xs text-sec mb-1 font-bold uppercase">Errors</p>
            <p className="text-2xl font-bold text-red-600">{stats.errorCalls}</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-xs text-sec mb-1 font-bold uppercase">Total Tokens</p>
            <p className="text-2xl font-bold text-main">{stats.totalTokens.toLocaleString()}</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-xs text-sec mb-1 font-bold uppercase">Avg Response</p>
            <p className="text-2xl font-bold text-main">{stats.avgResponseTime}ms</p>
          </div>
        </div>
      )}

      {/* Language breakdown */}
      {stats?.byLanguage?.length > 0 && (
        <div className="glass-panel p-6 mb-8">
          <h3 className="font-bold text-main mb-4">Calls by Language</h3>
          <div className="flex flex-wrap gap-3">
            {stats.byLanguage.map((l) => (
              <div key={l._id} className="bg-ter border border-col rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                <span className="text-sm font-bold capitalize text-main">{l._id}</span>
                <span className="text-xs bg-primary-500/20 text-primary-600 px-2 py-0.5 rounded-full font-bold">{l.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs List */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-col bg-sec">
          <h3 className="font-bold text-main uppercase tracking-wider text-xs">Recent Logs ({logs.length})</h3>
        </div>
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">No AI logs yet. Run a code review to see logs here.</p>
        ) : (
          <div className="divide-y divide-col">
            {logs.map((log) => (
              <div key={log._id} className="hover:bg-sec transition-colors">
                <button
                  onClick={() => setExpandedId(expandedId === log._id ? null : log._id)}
                  className="w-full text-left p-4 flex items-center gap-4"
                >
                  {log.status === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-main truncate">
                        {log.review?.title || (log.isTemporary ? 'Quick Analysis' : 'Direct Review')}
                      </span>
                      <span className="text-[10px] bg-primary-500/10 px-2 py-0.5 rounded text-primary-600 font-bold uppercase shrink-0 border border-primary-500/20 tracking-wider font-mono">{log.language}</span>
                      {log.isTemporary && (
                        <span className="text-[10px] bg-amber-500/10 px-2 py-0.5 rounded text-amber-600 font-bold uppercase shrink-0 border border-amber-500/20 tracking-wider">Quick Session</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-sec font-bold uppercase tracking-wider shrink-0">
                    <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{log.tokensUsed}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{log.responseTimeMs}ms</span>
                    <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                    {expandedId === log._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>
                {expandedId === log._id && (
                  <div className="px-4 pb-4 space-y-4">
                    <div>
                      <p className="text-[10px] text-sec mb-1 uppercase font-bold tracking-wider">Prompt</p>
                      <pre className="bg-ter border border-col rounded-lg p-3 text-xs text-main font-mono overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap shadow-inner">{log.prompt}</pre>
                    </div>
                    <div>
                      <p className="text-[10px] text-sec mb-1 uppercase font-bold tracking-wider">AI Response</p>
                      <pre className="bg-ter border border-col rounded-lg p-3 text-xs text-main font-mono overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap shadow-inner">{log.response?.substring(0, 1000)}{log.response?.length > 1000 ? '...' : ''}</pre>
                    </div>
                    <div className="flex gap-4 text-[10px] text-sec font-bold uppercase tracking-wider">
                      <span>Model: <span className="text-primary-600">{log.model}</span></span>
                      <span>Tokens: <span className="text-primary-600">{log.tokensUsed}</span></span>
                      <span>Time: <span className="text-primary-600">{log.responseTimeMs}ms</span></span>
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
