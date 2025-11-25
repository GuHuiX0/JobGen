/**
 * KeywordTracking
 * -------------------------------------------------------------
 * Shows keyword frequency trends across recent interviews.
 * Each card displays average usage, trend indicator, and
 * a mini sparkline chart.
 */

import { generateKeywordPath } from '../../pages/Dashboard/charts/keywordPath';

const KeywordTracking = ({ recentInterviews }) => {
  const keywordTrends = {};

  // Build keyword → counts[] map
  recentInterviews.forEach((interview) => {
    interview.topKeywords?.forEach((kw) => {
      if (!keywordTrends[kw.keyword]) keywordTrends[kw.keyword] = [];
      keywordTrends[kw.keyword].push(kw.count);
    });
  });

  return (
    <div>
      <h2 className="text-2xl font-light text-gray-900 mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 
            0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 
            0 110 2H4a1 1 0 01-1-1z"
          />
        </svg>
        Keyword Usage Tracking
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(keywordTrends)
          .slice(0, 6)
          .map(([keyword, counts], idx) => {
            const first = counts[0];
            const last = counts[counts.length - 1];
            const trend = last > first ? 'up' : last < first ? 'down' : 'stable';
            const avg = Math.round(counts.reduce((a, b) => a + b, 0) / counts.length);
            const max = Math.max(...counts);
            const xStep = 180 / Math.max(counts.length - 1, 1);

            return (
              <div
                key={idx}
                className="border border-amber-100/70 bg-white/80 backdrop-blur rounded-2xl p-5 shadow-lg shadow-amber-100/50"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      {keyword}
                    </div>
                    <div className="text-xs text-gray-500">
                      avg {avg} uses/session
                    </div>
                  </div>

                  {/* Trend badge */}
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trend === 'up'
                        ? 'bg-emerald-100 text-emerald-700'
                        : trend === 'down'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {trend === 'up'
                      ? '↑ up'
                      : trend === 'down'
                      ? '↓ down'
                      : '→ stable'}
                  </div>
                </div>

                {/* Sparkline */}
                <svg viewBox="0 0 200 60" className="w-full h-12">
                  <defs>
                    <linearGradient id={`keywordGradient${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>

                  {/* Line path */}
                  <path
                    d={generateKeywordPath(counts)}
                    fill="none"
                    stroke={`url(#keywordGradient${idx})`}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Points */}
                  {counts.map((count, i) => {
                    const x = 10 + i * xStep;
                    const y = 50 - (count / (max || 1)) * 40;

                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="3"
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                </svg>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default KeywordTracking;
