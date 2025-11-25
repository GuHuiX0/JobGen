/**
 * KeyMetrics
 * -------------------------------------------------------------
 * Displays four high-level interview metrics:
 * - Current readiness score + improvement trend
 * - Completed interviews count
 * - Average confidence
 * - Average keyword coverage
 *
 * Values are computed from trendData and recent interview records.
 */

const KeyMetrics = ({ trendData, recentInterviews }) => {
  /** Readiness score trend (last 10 sessions) */
  const points = trendData?.points?.slice(-10) || [];
  const scores = points.map(p => p.score);
  const current = scores[scores.length - 1] || 0;
  const first = scores[0] || 0;
  const improvement = current - first;

  /** Average confidence */
  const confidences = recentInterviews.map(i => i.confidence || 0);
  const avgConfidence = Math.round(
    confidences.reduce((sum, c) => sum + c, 0) / (confidences.length || 1)
  );

  /** Average keyword coverage */
  const avgKeywordUsage = Math.round(
    recentInterviews.reduce((sum, i) => sum + (i.keywordUsage || 0), 0) /
      (recentInterviews.length || 1)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* ===== CURRENT SCORE ===== */}
      <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-6 shadow-lg shadow-indigo-100/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-indigo-500 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 
                0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 
                2.034a1 1 0 00-.364 1.118l1.07 
                3.292c.3.921-.755 1.688-1.54 
                1.118l-2.8-2.034a1 1 0 00-1.175 
                0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 
                1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 
                1 0 00.951-.69l1.07-3.292z" 
              />
            </svg>
          </div>

          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">
            Current Score
          </div>
        </div>

        <div className="text-4xl font-light text-gray-900">{current}</div>

        <div className="mt-2 flex items-center gap-1">
          <span
            className={`text-sm font-medium ${
              improvement >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {improvement >= 0 ? '↑' : '↓'} {Math.abs(improvement)}
          </span>
          <span className="text-xs text-gray-500">vs first session</span>
        </div>
      </div>

      {/* ===== INTERVIEWS COMPLETED ===== */}
      <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-2xl p-6 shadow-lg shadow-purple-100/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-purple-500 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 
                100-2H9z" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 
                0 003 3h2a3 3 0 003-3 2 2 
                0 012 2v11a2 2 0 01-2 
                2H6a2 2 0 01-2-2V5z"
              />
            </svg>
          </div>

          <div className="text-xs font-semibold text-purple-600 uppercase tracking-widest">
            Interviews
          </div>
        </div>

        <div className="text-4xl font-light text-gray-900">
          {recentInterviews.length}
        </div>
        <div className="mt-2 text-xs text-gray-500">completed this period</div>
      </div>

      {/* ===== AVG CONFIDENCE ===== */}
      <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-6 shadow-lg shadow-emerald-100/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-emerald-500 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 18a8 8 0 
                100-16 8 8 0 000 
                16zm3.707-9.293a1 1 0 
                00-1.414-1.414L9 
                10.586 7.707 
                9.293a1 1 0 
                00-1.414 1.414l2 
                2a1 1 0 001.414 0l4-4z"
              />
            </svg>
          </div>

          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">
            Avg Confidence
          </div>
        </div>

        <div className="text-4xl font-light text-gray-900">{avgConfidence}%</div>
        <div className="mt-2 text-xs text-gray-500">delivery strength</div>
      </div>

      {/* ===== AVG KEYWORD USAGE ===== */}
      <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-2xl p-6 shadow-lg shadow-amber-100/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-amber-500 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 
                0 110 2H4a1 1 0 01-1-1zM3 
                10a1 1 0 011-1h12a1 1 
                0 110 2H4a1 1 0 
                01-1-1zM3 15a1 1 
                0 011-1h6a1 1 0 
                110 2H4a1 1 0 
                01-1-1z"
              />
            </svg>
          </div>

          <div className="text-xs font-semibold text-amber-600 uppercase tracking-widest">
            Keyword Usage
          </div>
        </div>

        <div className="text-4xl font-light text-gray-900">
          {avgKeywordUsage}%
        </div>
        <div className="mt-2 text-xs text-gray-500">average coverage</div>
      </div>
    </div>
  );
};

export default KeyMetrics;
