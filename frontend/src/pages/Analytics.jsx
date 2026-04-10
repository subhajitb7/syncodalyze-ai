import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, Bug, CheckCircle, FolderOpen, FileCode, TrendingUp } from 'lucide-react';
import AreaChart from '../components/charts/AreaChart';
import BarChart from '../components/charts/BarChart';

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

  if (!data) return <div className="text-center py-20 text-sec font-bold">Failed to load analytics.</div>;


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Platform-standard vertical baseline spacer */}
      <div className="h-10 mb-2 opacity-0 pointer-events-none hidden lg:block"></div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-sec mt-1">Insights into your code review history.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-500" />
            </div>
            <span className="text-sm text-sec">Total Reviews</span>
          </div>
          <p className="text-3xl font-bold">{data.totalReviews}</p>
        </div>
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <Bug className="h-5 w-5 text-red-500" />
            </div>
            <span className="text-sm text-sec">Bugs Found</span>
          </div>
          <p className="text-3xl font-bold">{data.totalBugs}</p>
        </div>
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-sm text-sec">Clean Code %</span>
          </div>
          <p className="text-3xl font-bold">{data.cleanPercent}%</p>
        </div>
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-purple-500" />
            </div>
            <span className="text-sm text-sec">Projects</span>
          </div>
          <p className="text-3xl font-bold">{data.totalProjects}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Reviews Over Time Chart */}
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-500" /> Reviews Over Time (30 Days)
          </h2>
          {data.reviewsOverTime.length === 0 ? (
            <p className="text-sec text-sm text-center py-20">No data yet</p>
          ) : (
            <div className="h-64">
              <AreaChart data={data.reviewsOverTime} color="#6366f1" gradientId="reviewsArea" />
            </div>
          )}
        </div>

        {/* Language Distribution */}
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary-500" /> Language Distribution
          </h2>
          {data.byLanguage.length === 0 ? (
            <p className="text-sec text-sm text-center py-20">No data yet</p>
          ) : (
            <div className="h-64">
              <BarChart data={data.byLanguage} />
            </div>
          )}
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="glass-panel p-6">
        <h2 className="text-lg font-semibold mb-4 text-main">Recent Reviews</h2>
        {data.recentReviews.length === 0 ? (
          <p className="text-sec text-sm">No reviews yet.</p>
        ) : (
          <div className="space-y-2">
            {data.recentReviews.map((r) => (
              <div key={r._id} className="flex items-center justify-between p-3 bg-sec/50 border border-col rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${r.bugsFound > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                  <span className="font-medium text-sm text-main">{r.title}</span>
                  <span className="text-xs text-sec uppercase font-semibold">{r.language}</span>
                </div>
                <span className="text-xs text-sec">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
