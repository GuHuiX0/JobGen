/**
 * OverallScoreCard
 * ---------------------------------------------------------------------------
 * Displays the interview’s overall score, verdict label, and a percentage bar.
 *
 * Props:
 * - overall: {
 *     score: number,
 *     verdict: string
 *   }
 */

const OverallScoreCard = ({ overall }) => (
  <div className="mb-16">
    <div className="bg-white/80 backdrop-blur border border-indigo-100 rounded-3xl p-8 shadow-xl">

      {/* Score + Verdict */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-6">
        <div className="flex items-end gap-6">
          {/* Numeric score */}
          <div className="text-8xl font-extralight text-gray-900 leading-none">
            {overall?.score || 0}
          </div>

          {/* Details */}
          <div className="pb-3">
            <div className="text-2xl font-light text-indigo-500">/100</div>
            <div className="text-sm text-gray-500 mt-1">Overall Score</div>
            <p className="text-xs text-gray-400 mt-2 max-w-xs">
              Scores combine STAR quality, keyword coverage, delivery, and confidence metrics.
            </p>
          </div>
        </div>

        {/* Verdict tag */}
        {overall?.verdict && (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold tracking-[0.2em] uppercase bg-indigo-100/80 text-indigo-600">
            {overall.verdict}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-indigo-100/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-400 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${overall?.score || 0}%` }}
        />
      </div>

    </div>
  </div>
);

export default OverallScoreCard;
