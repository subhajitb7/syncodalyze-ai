import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, Bug, CheckCircle, FolderOpen, FileCode, TrendingUp } from 'lucide-react';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: res } = await axios.get('/api/analytics');
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!data) return <div className="text-center py-20 text-gray-400">Failed to load analytics.</div>;

  const maxReviews = Math.max(...(data.reviewsOverTime.map((d) => d.count) || [1]), 1);
  const maxLangCount = Math.max(...(data.byLanguage.map((d) => d.count) || [1]), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-400 mt-1">Insights into your code review history.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-400" />
            </div>
            <span className="text-sm text-gray-400">Total Reviews</span>
          </div>
          <p className="text-3xl font-bold">{data.totalReviews}</p>
        </div>
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <Bug className="h-5 w-5 text-red-400" />
            </div>
            <span className="text-sm text-gray-400">Bugs Found</span>
          </div>
          <p className="text-3xl font-bold">{data.totalBugs}</p>
        </div>
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-sm text-gray-400">Clean Code %</span>
          </div>
          <p className="text-3xl font-bold">{data.cleanPercent}%</p>
        </div>
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-purple-400" />
            </div>
            <span className="text-sm text-gray-400">Projects</span>
          </div>
          <p className="text-3xl font-bold">{data.totalProjects}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Reviews Over Time Chart */}
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-400" /> Reviews Over Time (30 Days)
          </h2>
          {data.reviewsOverTime.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {data.reviewsOverTime.map((d) => (
                <div key={d._id} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-sm transition-all hover:opacity-80 min-h-[4px]"
                    style={{ height: `${(d.count / maxReviews) * 100}%` }}
                  ></div>
                  <span className="text-[10px] text-gray-600 rotate-[-45deg] origin-top-left mt-1 hidden lg:block">
                    {d._id.slice(5)}
                  </span>
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-dark-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {d.count} review{d.count !== 1 ? 's' : ''} · {d.bugs} bug{d.bugs !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Language Distribution */}
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary-400" /> Language Distribution
          </h2>
          {data.byLanguage.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-4">
              {data.byLanguage.map((lang) => {
                const colors = {
                  javascript: 'from-yellow-500 to-yellow-400',
                  python: 'from-blue-500 to-blue-400',
                  typescript: 'from-blue-600 to-blue-500',
                  java: 'from-red-500 to-red-400',
                  cpp: 'from-purple-500 to-purple-400',
                  go: 'from-cyan-500 to-cyan-400',
                };
                return (
                  <div key={lang._id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium">{lang._id}</span>
                      <span className="text-gray-400">{lang.count} reviews · {lang.bugs} bugs</span>
                    </div>
                    <div className="h-3 bg-dark-900/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors[lang._id] || 'from-gray-500 to-gray-400'} rounded-full transition-all`}
                        style={{ width: `${(lang.count / maxLangCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="glass-panel p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Reviews</h2>
        {data.recentReviews.length === 0 ? (
          <p className="text-gray-500 text-sm">No reviews yet.</p>
        ) : (
          <div className="space-y-2">
            {data.recentReviews.map((r) => (
              <div key={r._id} className="flex items-center justify-between p-3 bg-dark-900/50 border border-dark-600 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${r.bugsFound > 0 ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                  <span className="font-medium text-sm">{r.title}</span>
                  <span className="text-xs text-gray-500 uppercase">{r.language}</span>
                </div>
                <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
