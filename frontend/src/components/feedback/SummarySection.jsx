/**
 * SummarySection
 * ---------------------------------------------------------------------------
 * Structured summary of interview performance:
 * - strengths
 * - areas for improvement
 * - recommended next steps
 *
 * Props:
 * - summary: {
 *     strengths: string[],
 *     needs_improvement: string[],
 *     next_steps: string
 *   }
 */

const SummarySection = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="mb-16 grid grid-cols-1 md:grid-cols-3 gap-6">

      {/* Strengths */}
      <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-6 shadow-lg">
        <div className="text-xs font-semibold text-emerald-600 uppercase mb-3">
          Strengths
        </div>
        <ul className="space-y-3 text-sm text-emerald-900">
          {(summary.strengths || []).map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Areas to Improve */}
      <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-2xl p-6 shadow-lg">
        <div className="text-xs font-semibold text-amber-600 uppercase mb-3">
          Areas to Improve
        </div>
        <ul className="space-y-3 text-sm text-amber-900">
          {(summary.needs_improvement || []).map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full mt-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-6 shadow-lg">
        <div className="text-xs font-semibold text-indigo-600 uppercase mb-3">
          Next Steps
        </div>
        <p className="text-sm text-indigo-900 leading-relaxed">
          {summary.next_steps}
        </p>
      </div>

    </div>
  );
};

export default SummarySection;
