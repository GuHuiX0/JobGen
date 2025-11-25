import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, interviewAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState(null);
  const [radarData, setRadarData] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [trend, radar, interviews] = await Promise.all([
          dashboardAPI.getReadinessTrend('2025-09-01', '2025-10-15'),
          dashboardAPI.getTypeRadar('90d'),
          // 获取最近的面试记录（模拟数据，实际应该从API获取）
          Promise.resolve({
            interviews: [
              {
                id: 'ivw_001',
                date: '2025-11-15',
                type: 'behavioral',
                score: 85,
                keywordUsage: 78,
                confidence: 82,
                clarity: 88,
                keywords: ['leadership', 'teamwork', 'problem-solving'],
                topKeywords: [
                  { keyword: 'leadership', count: 5, trend: 'up' },
                  { keyword: 'teamwork', count: 3, trend: 'up' },
                  { keyword: 'problem-solving', count: 4, trend: 'stable' }
                ]
              },
              {
                id: 'ivw_002',
                date: '2025-11-12',
                type: 'technical',
                score: 78,
                keywordUsage: 72,
                confidence: 75,
                clarity: 80,
                keywords: ['algorithm', 'optimization', 'database'],
                topKeywords: [
                  { keyword: 'algorithm', count: 4, trend: 'up' },
                  { keyword: 'optimization', count: 3, trend: 'stable' },
                  { keyword: 'database', count: 2, trend: 'down' }
                ]
              },
              {
                id: 'ivw_003',
                date: '2025-11-10',
                type: 'behavioral',
                score: 82,
                keywordUsage: 75,
                confidence: 80,
                clarity: 85,
                keywords: ['communication', 'conflict', 'leadership'],
                topKeywords: [
                  { keyword: 'communication', count: 6, trend: 'up' },
                  { keyword: 'conflict', count: 2, trend: 'stable' },
                  { keyword: 'leadership', count: 3, trend: 'up' }
                ]
              }
            ]
          })
        ]);
        setTrendData(trend);
        setRadarData(radar);
        setRecentInterviews(interviews.interviews || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-light text-gray-900 mb-2">Loading Dashboard</p>
          <p className="text-sm text-gray-500">Analyzing your performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-rose-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-white/80 backdrop-blur border border-rose-100 rounded-3xl p-8 shadow-xl shadow-rose-100/50">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-500 to-amber-400 flex items-center justify-center shadow-lg shadow-rose-200/60">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-gray-900 mb-3">Error Loading Dashboard</h2>
          <p className="text-gray-500 mb-8">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 rounded-full text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-amber-400 shadow-md shadow-rose-200/70 hover:from-rose-400 hover:to-amber-500 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate readiness trend data (recent 10 points)
  const recentPoints = trendData?.points?.slice(-10) || [];
  const scores = recentPoints.map(p => p.score);
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 100;
  const currentScore = scores[scores.length - 1] || 0;
  const previousScore = scores[0] || 0;
  const improvement = currentScore - previousScore;

  // Calculate keyword trends
  const keywordTrends = {};
  recentInterviews.forEach(interview => {
    interview.topKeywords?.forEach(kw => {
      if (!keywordTrends[kw.keyword]) {
        keywordTrends[kw.keyword] = [];
      }
      keywordTrends[kw.keyword].push(kw.count);
    });
  });

  // Calculate confidence trend
  const confidenceTrend = recentInterviews.map(interview => ({
    date: interview.date,
    confidence: interview.confidence,
    clarity: interview.clarity,
    keywordUsage: interview.keywordUsage
  }));

  // SVG Line Chart Generator for Readiness
  const generateReadinessPath = () => {
    if (recentPoints.length === 0) return '';
    const width = 600;
    const height = 200;
    const padding = 20;
    const xStep = (width - 2 * padding) / Math.max(recentPoints.length - 1, 1);
    const yRange = maxScore - minScore || 1;

    const path = recentPoints.map((point, i) => {
      const x = padding + i * xStep;
      const y = height - padding - ((point.score - minScore) / yRange) * (height - 2 * padding);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return path;
  };

  // SVG Line Chart Generator for Confidence Trend
  const generateConfidencePath = () => {
    if (confidenceTrend.length === 0) return '';
    const width = 600;
    const height = 150;
    const padding = 20;
    const xStep = (width - 2 * padding) / Math.max(confidenceTrend.length - 1, 1);

    const path = confidenceTrend.map((point, i) => {
      const x = padding + i * xStep;
      const y = height - padding - ((point.confidence) / 100) * (height - 2 * padding);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return path;
  };

  // SVG Line Chart for Keyword Trends
  const generateKeywordPath = (counts) => {
    if (counts.length === 0) return '';
    const width = 200;
    const height = 60;
    const padding = 10;
    const xStep = (width - 2 * padding) / Math.max(counts.length - 1, 1);
    const maxCount = Math.max(...counts);

    const path = counts.map((count, i) => {
      const x = padding + i * xStep;
      const y = height - padding - ((count) / maxCount) * (height - 2 * padding);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return path;
  };

  // Radar Chart Points Generator
  const getRadarPoints = () => {
    if (!radarData?.scores) return '';
    const scores = radarData.scores;
    const types = ['behavioral', 'technical', 'psychometric'];
    const center = 100;
    const maxRadius = 80;

    const points = types.map((type, i) => {
      const angle = (i * 2 * Math.PI / 3) - Math.PI / 2;
      const value = scores[type] || 0;
      const radius = (value / 100) * maxRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');

    return points;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      {/* Header */}
      <div className="border-b border-gray-200/80 bg-white/80 backdrop-blur">
        <div className="mt-16 max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold tracking-widest text-indigo-600 bg-indigo-100/80 rounded-full uppercase mb-3">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              Performance Analytics
            </span>
            <h1 className="text-4xl font-light text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-500">Comprehensive view of your interview readiness</p>
          </div>
          <button
            onClick={() => navigate('/interview')}
            className="px-8 py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 shadow-lg shadow-indigo-200/60 hover:from-indigo-400 hover:via-purple-500 hover:to-rose-400 hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Start Interview
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Current Score */}
          <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-6 shadow-lg shadow-indigo-100/60">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">Current Score</div>
              </div>
            </div>
            <div className="text-4xl font-light text-gray-900">{currentScore}</div>
            <div className="mt-2 flex items-center gap-1">
              <span className={`text-sm font-medium ${improvement >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {improvement >= 0 ? '↑' : '↓'} {Math.abs(improvement)}
              </span>
              <span className="text-xs text-gray-500">vs first session</span>
            </div>
          </div>

          {/* Interviews Completed */}
          <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-2xl p-6 shadow-lg shadow-purple-100/60">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-purple-600 uppercase tracking-widest">Interviews</div>
              </div>
            </div>
            <div className="text-4xl font-light text-gray-900">{recentInterviews.length}</div>
            <div className="mt-2 text-xs text-gray-500">completed this period</div>
          </div>

          {/* Avg Confidence */}
          <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-6 shadow-lg shadow-emerald-100/60">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Avg Confidence</div>
              </div>
            </div>
            <div className="text-4xl font-light text-gray-900">
              {Math.round(confidenceTrend.reduce((sum, t) => sum + t.confidence, 0) / (confidenceTrend.length || 1))}%
            </div>
            <div className="mt-2 text-xs text-gray-500">delivery strength</div>
          </div>

          {/* Keyword Usage */}
          <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-2xl p-6 shadow-lg shadow-amber-100/60">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Keyword Usage</div>
              </div>
            </div>
            <div className="text-4xl font-light text-gray-900">
              {Math.round(recentInterviews.reduce((sum, i) => sum + i.keywordUsage, 0) / (recentInterviews.length || 1))}%
            </div>
            <div className="mt-2 text-xs text-gray-500">average coverage</div>
          </div>
        </div>

        {/* Readiness Trend Chart */}
        <div>
          <div className="flex items-end gap-8 mb-6">
            <div>
              <h2 className="text-2xl font-light text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                Interview Readiness Trend
              </h2>
              <p className="text-gray-500 text-sm">Track your preparation progress over the last 10 sessions</p>
            </div>
          </div>

          <div className="border border-indigo-100/70 bg-white/80 backdrop-blur rounded-3xl p-8 shadow-xl shadow-indigo-100/50">
            <svg viewBox="0 0 600 200" className="w-full h-48">
              <defs>
                <linearGradient id="readinessGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((val) => {
                const y = 200 - 20 - ((val - minScore) / (maxScore - minScore || 1)) * 160;
                return (
                  <g key={val}>
                    <line x1="20" y1={y} x2="580" y2={y} stroke="#e0e7ff" strokeWidth="1" />
                    <text x="10" y={y + 4} fontSize="10" fill="#9ca3af" textAnchor="end">{val}</text>
                  </g>
                );
              })}

              {/* Line */}
              <path
                d={generateReadinessPath()}
                fill="none"
                stroke="url(#readinessGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points */}
              {recentPoints.map((point, i) => {
                const xStep = 560 / Math.max(recentPoints.length - 1, 1);
                const x = 20 + i * xStep;
                const y = 180 - ((point.score - minScore) / (maxScore - minScore || 1)) * 160;
                return (
                  <circle key={i} cx={x} cy={y} r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                );
              })}

              {/* Date labels */}
              {recentPoints.map((point, i) => {
                const xStep = 560 / Math.max(recentPoints.length - 1, 1);
                const x = 20 + i * xStep;
                const dateLabel = new Date(point.date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
                return (
                  <text key={i} x={x} y="195" fontSize="10" fill="#6b7280" textAnchor="middle">{dateLabel}</text>
                );
              })}
            </svg>
          </div>

          {/* AI Summary */}
          {trendData?.gpt_insights && (
            <div className="mt-6 p-6 bg-gradient-to-r from-white/90 to-indigo-50/80 border border-indigo-100 rounded-3xl shadow-lg shadow-indigo-100/40">
              <div className="flex items-start gap-3 mb-4">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-4">{trendData.gpt_insights.summary}</p>
                  <div className="space-y-2">
                    {trendData.gpt_insights.recommendations?.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-indigo-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-gray-600">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confidence & Clarity Trend */}
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
            Confidence & Delivery Metrics
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Confidence Trend */}
            <div className="border border-purple-100/70 bg-white/80 backdrop-blur rounded-3xl p-6 shadow-xl shadow-purple-100/50">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Confidence Score Trend</h3>
              <svg viewBox="0 0 600 150" className="w-full h-32">
                <defs>
                  <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                {/* Grid */}
                {[0, 25, 50, 75, 100].map((val) => (
                  <g key={val}>
                    <line x1="20" y1={150 - 20 - val * 1.1} x2="580" y2={150 - 20 - val * 1.1} stroke="#e0e7ff" strokeWidth="1" />
                  </g>
                ))}
                {/* Line */}
                <path
                  d={generateConfidencePath()}
                  fill="none"
                  stroke="url(#confidenceGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Points */}
                {confidenceTrend.map((point, i) => {
                  const xStep = 560 / Math.max(confidenceTrend.length - 1, 1);
                  const x = 20 + i * xStep;
                  const y = 130 - (point.confidence / 100) * 110;
                  return (
                    <circle key={i} cx={x} cy={y} r="4" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
                  );
                })}
              </svg>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>Recent Sessions</span>
                <span className="text-purple-600 font-semibold">
                  Avg: {Math.round(confidenceTrend.reduce((s, t) => s + t.confidence, 0) / (confidenceTrend.length || 1))}%
                </span>
              </div>
            </div>

            {/* Clarity Breakdown */}
            <div className="border border-emerald-100/70 bg-white/80 backdrop-blur rounded-3xl p-6 shadow-xl shadow-emerald-100/50">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Delivery Quality Breakdown</h3>
              <div className="space-y-4">
                {[
                  { label: 'Confidence', value: confidenceTrend[confidenceTrend.length - 1]?.confidence || 0, color: 'purple' },
                  { label: 'Clarity', value: confidenceTrend[confidenceTrend.length - 1]?.clarity || 0, color: 'blue' },
                  { label: 'Keyword Usage', value: confidenceTrend[confidenceTrend.length - 1]?.keywordUsage || 0, color: 'emerald' }
                ].map((metric, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{metric.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r from-${metric.color}-400 to-${metric.color}-600 rounded-full transition-all duration-500`}
                        style={{ width: `${metric.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Keyword Tracking */}
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Keyword Usage Tracking
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(keywordTrends).slice(0, 6).map(([keyword, counts], idx) => {
              const trend = counts[counts.length - 1] > counts[0] ? 'up' : counts[counts.length - 1] < counts[0] ? 'down' : 'stable';
              const avgCount = Math.round(counts.reduce((a, b) => a + b, 0) / counts.length);
              
              return (
                <div key={idx} className="border border-amber-100/70 bg-white/80 backdrop-blur rounded-2xl p-5 shadow-lg shadow-amber-100/50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 mb-1">{keyword}</div>
                      <div className="text-xs text-gray-500">avg {avgCount} uses/session</div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trend === 'up' ? 'bg-emerald-100 text-emerald-700' :
                      trend === 'down' ? 'bg-rose-100 text-rose-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trend}
                    </div>
                  </div>
                  <svg viewBox="0 0 200 60" className="w-full h-12">
                    <defs>
                      <linearGradient id={`keywordGradient${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                    </defs>
                    <path
                      d={generateKeywordPath(counts)}
                      fill="none"
                      stroke={`url(#keywordGradient${idx})`}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    {counts.map((count, i) => {
                      const xStep = 180 / Math.max(counts.length - 1, 1);
                      const x = 10 + i * xStep;
                      const maxCount = Math.max(...counts);
                      const y = 50 - ((count) / maxCount) * 40;
                      return (
                        <circle key={i} cx={x} cy={y} r="3" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                      );
                    })}
                  </svg>
                </div>
              );
            })}
          </div>
        </div>

        {/* Type Analysis & Radar */}
        <div className="grid md:grid-cols-2 gap-12">
          {/* Radar Chart */}
          <div>
            <h2 className="text-2xl font-light text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              Performance by Interview Type
            </h2>
            <div className="border border-indigo-100/70 bg-white/80 backdrop-blur rounded-3xl p-8 flex justify-center shadow-xl shadow-indigo-100/50">
              <svg viewBox="0 0 200 200" className="w-64 h-64">
                <defs>
                  <radialGradient id="radarGradient" cx="50%" cy="50%" r="65%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#4338ca" stopOpacity="0.1" />
                  </radialGradient>
                </defs>
                {/* Background circles */}
                {[25, 50, 75, 100].map((radius) => (
                  <circle
                    key={radius}
                    cx="100"
                    cy="100"
                    r={radius * 0.8}
                    fill="none"
                    stroke="#e0e7ff"
                    strokeWidth="1"
                  />
                ))}

                {/* Axes */}
                {['Behavioral', 'Technical', 'Psychometric'].map((label, i) => {
                  const angle = (i * 2 * Math.PI / 3) - Math.PI / 2;
                  const x2 = 100 + 80 * Math.cos(angle);
                  const y2 = 100 + 80 * Math.sin(angle);
                  const labelX = 100 + 95 * Math.cos(angle);
                  const labelY = 100 + 95 * Math.sin(angle);

                  return (
                    <g key={i}>
                      <line x1="100" y1="100" x2={x2} y2={y2} stroke="#c7d2fe" strokeWidth="1" />
                      <text
                        x={labelX}
                        y={labelY}
                        fontSize="11"
                        fill="#4f46e5"
                        fontWeight="600"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* Data polygon */}
                <polygon points={getRadarPoints()} fill="url(#radarGradient)" stroke="#4338ca" strokeWidth="2" />

                {/* Data points */}
                {['behavioral', 'technical', 'psychometric'].map((type, i) => {
                  const angle = (i * 2 * Math.PI / 3) - Math.PI / 2;
                  const value = radarData?.scores?.[type] || 0;
                  const radius = (value / 100) * 80;
                  const x = 100 + radius * Math.cos(angle);
                  const y = 100 + radius * Math.sin(angle);

                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="6" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                      <text x={x} y={y - 12} fontSize="13" fill="#312e81" textAnchor="middle" fontWeight="700">
                        {value}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* AI Insights */}
          <div>
            <h2 className="text-2xl font-light text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              AI-Powered Insights
            </h2>

            {/* Strengths */}
            {radarData?.gpt_insights?.strengths && radarData.gpt_insights.strengths.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-sm font-semibold text-gray-900">Your Strengths</h3>
                </div>
                <div className="space-y-2">
                  {radarData.gpt_insights.strengths.map((strength, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                      <p className="text-sm text-emerald-900 leading-relaxed">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weaknesses */}
            {radarData?.gpt_insights?.weaknesses && radarData.gpt_insights.weaknesses.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-sm font-semibold text-gray-900">Areas to Improve</h3>
                </div>
                <div className="space-y-2">
                  {radarData.gpt_insights.weaknesses.map((weakness, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mt-2"></span>
                      <p className="text-sm text-amber-900 leading-relaxed">{weakness}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Focus Areas */}
            {radarData?.gpt_insights?.suggested_focus && radarData.gpt_insights.suggested_focus.length > 0 && (
              <div className="p-5 bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-600 text-white rounded-2xl shadow-xl shadow-indigo-200/50">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <h3 className="text-sm font-semibold">Suggested Focus Areas</h3>
                </div>
                <div className="space-y-2">
                  {radarData.gpt_insights.suggested_focus.map((focus, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-white/95 leading-relaxed">{focus}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Interview Breakdown */}
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            Recent Interview Sessions Breakdown
          </h2>

          <div className="space-y-4">
            {recentInterviews.map((interview, idx) => (
              <div key={idx} className="border border-blue-100/70 bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg shadow-blue-100/50 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        interview.type === 'behavioral' ? 'bg-purple-100 text-purple-700' :
                        interview.type === 'technical' ? 'bg-blue-100 text-blue-700' :
                        'bg-indigo-100 text-indigo-700'
                      }`}>
                        {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">{new Date(interview.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/interview/${interview.id}/feedback`)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      View Detailed Feedback
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-light text-gray-900">{interview.score}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest">Overall</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Confidence</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full" style={{ width: `${interview.confidence}%` }}></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{interview.confidence}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Clarity</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: `${interview.clarity}%` }}></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{interview.clarity}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Keywords</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: `${interview.keywordUsage}%` }}></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{interview.keywordUsage}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-2">Top Keywords Used</div>
                  <div className="flex flex-wrap gap-2">
                    {interview.topKeywords?.slice(0, 5).map((kw, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-xs font-medium text-gray-700 rounded-full flex items-center gap-1.5">
                        <span>{kw.keyword}</span>
                        <span className="px-1.5 py-0.5 bg-indigo-500 text-white rounded-full text-[10px] font-semibold">×{kw.count}</span>
                        <span className={`text-xs ${
                          kw.trend === 'up' ? 'text-emerald-600' :
                          kw.trend === 'down' ? 'text-rose-600' :
                          'text-gray-500'
                        }`}>
                          {kw.trend === 'up' ? '↑' : kw.trend === 'down' ? '↓' : '→'}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;