import { generateConfidencePath } from '../../pages/Dashboard/charts/confidencePath';

/**
 * ConfidenceDelivery
 * -------------------------------------------------------------
 * Renders:
 * - Confidence score trend line chart
 * - Latest delivery metrics (confidence / clarity / keyword usage)
 */

const ConfidenceDelivery = ({ recentInterviews }) => {
  const confidenceTrend = recentInterviews.map(i => ({
    date: i.date,
    confidence: i.confidence,
    clarity: i.clarity,
    keywordUsage: i.keywordUsage,
  }));

  const avgConfidence = Math.round(
    confidenceTrend.reduce((sum, t) => sum + t.confidence, 0) /
      (confidenceTrend.length || 1)
  );

  const last = confidenceTrend[confidenceTrend.length - 1] || {
    confidence: 0,
    clarity: 0,
    keywordUsage: 0,
  };

  const deliveryMetrics = [
    { label: 'Confidence', value: last.confidence, color: 'purple' },
    { label: 'Clarity', value: last.clarity, color: 'blue' },
    { label: 'Keyword Usage', value: last.keywordUsage, color: 'emerald' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-light text-gray-900 mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
          <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
        </svg>
        Confidence & Delivery Metrics
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Confidence Line Chart */}
        <div className="border border-purple-100/70 bg-white/80 backdrop-blur rounded-3xl p-6 shadow-xl shadow-purple-100/50">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Confidence Score Trend</h3>

          <svg viewBox="0 0 600 150" className="w-full h-32">
            <defs>
              <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>

            {[0, 25, 50, 75, 100].map(val => (
              <line
                key={val}
                x1="20"
                y1={150 - 20 - val * 1.1}
                x2="580"
                y2={150 - 20 - val * 1.1}
                stroke="#e0e7ff"
                strokeWidth="1"
              />
            ))}

            <path
              d={generateConfidencePath(confidenceTrend)}
              fill="none"
              stroke="url(#confidenceGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {confidenceTrend.map((point, i) => {
              const x = 20 + (560 / Math.max(confidenceTrend.length - 1, 1)) * i;
              const y = 130 - (point.confidence / 100) * 110;

              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#8b5cf6"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>Recent Sessions</span>
            <span className="text-purple-600 font-semibold">Avg: {avgConfidence}%</span>
          </div>
        </div>

        {/* Delivery Breakdown Bars */}
        <div className="border border-emerald-100/70 bg-white/80 backdrop-blur rounded-3xl p-6 shadow-xl shadow-emerald-100/50">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Delivery Quality Breakdown</h3>

          {deliveryMetrics.map((metric, i) => (
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
  );
};

export default ConfidenceDelivery;
