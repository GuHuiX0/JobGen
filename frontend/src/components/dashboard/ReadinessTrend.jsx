/**
 * ReadinessTrend
 * ---------------------------------------------------------------------------
 * Interview readiness trend chart (last 10 sessions).
 * Displays:
 * - Score trend line
 * - Grid lines (0–100)
 * - Data point markers
 * - Date labels (missing in previous version; restored)
 */

import { generateReadinessPath } from '../../pages/Dashboard/charts/readinessPath';

const ReadinessTrend = ({ trendData }) => {
  const recentPoints = trendData?.points?.slice(-10) || [];
  const scores = recentPoints.map(p => p.score);

  const minScore = scores.length ? Math.min(...scores) : 0;
  const maxScore = scores.length ? Math.max(...scores) : 100;

  return (
    <div>
      {/* Header */}
      <div className="flex items-end gap-8 mb-6">
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-2 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 
                0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 
                011-1h2a1 1 0 011 1v9a1 1 0 
                01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 
                0 011-1h2a1 1 0 011 1v12a1 1 
                0 01-1 1h-2a1 1 0 01-1-1V4z"
              />
            </svg>
            Interview Readiness Trend
          </h2>
          <p className="text-gray-500 text-sm">
            Track your preparation progress over the last 10 sessions
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="border border-indigo-100/70 bg-white/80 backdrop-blur rounded-3xl p-8 shadow-xl shadow-indigo-100/50">
        <svg viewBox="0 0 600 200" className="w-full h-48">

          {/* Gradient */}
          <defs>
            <linearGradient id="readinessGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 25, 50, 75, 100].map(val => {
            const y = 200 - 20 - ((val - minScore) / (maxScore - minScore || 1)) * 160;
            return (
              <g key={val}>
                <line x1="20" y1={y} x2="580" y2={y} stroke="#e0e7ff" strokeWidth="1" />
                <text x="10" y={y + 4} fontSize="10" fill="#9ca3af" textAnchor="end">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Trend Line */}
          <path
            d={generateReadinessPath(recentPoints, minScore, maxScore)}
            fill="none"
            stroke="url(#readinessGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {recentPoints.map((point, i) => {
            const x = 20 + (560 / Math.max(recentPoints.length - 1, 1)) * i;
            const y = 180 - ((point.score - minScore) / (maxScore - minScore || 1)) * 160;

            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="5"
                fill="#6366f1"
                stroke="#ffffff"
                strokeWidth="2"
              />
            );
          })}

          {/* --- 🔥 Date Labels (restored from the original version) --- */}
          {recentPoints.map((point, i) => {
            const x = 20 + (560 / Math.max(recentPoints.length - 1, 1)) * i;
            const dateLabel = new Date(point.date).toLocaleDateString('en', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <text
                key={`date-${i}`}
                x={x}
                y="195"
                fontSize="10"
                fill="#6b7280"
                textAnchor="middle"
              >
                {dateLabel}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default ReadinessTrend;
