/**
 * InsightsView
 * -------------------------------------------------------------
 * Shows AI-generated interview insights:
 * - Short summary text
 * - Actionable recommendations list
 */

const InsightsView = ({ insights }) => {
  if (!insights) return null;

  const { summary, recommendations = [] } = insights;

  return (
    <div className="mt-6 p-6 bg-gradient-to-r from-white/90 to-indigo-50/80 border border-indigo-100 rounded-3xl shadow-lg shadow-indigo-100/40">
      <div className="flex items-start gap-3 mb-4">

        {/* Icon */}
        <svg
          className="w-5 h-5 text-indigo-600 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 
            0116 0zm-7-4a1 1 0 11-2 0 1 1 
            0 012 0zM9 9a1 1 0 000 2v3a1 
            1 0 001 1h1a1 1 0 100-2v-3a1 
            1 0 00-1-1H9z"
          />
        </svg>

        {/* Content */}
        <div className="flex-1">
          {/* Summary */}
          <p className="text-sm text-gray-700 mb-4">{summary}</p>

          {/* Recommendation list */}
          <div className="space-y-2">
            {recommendations.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10.293 3.293a1 1 0 
                    011.414 0l6 6a1 1 0 010 
                    1.414l-6 6a1 1 0 
                    01-1.414-1.414L14.586 
                    11H3a1 1 0 
                    110-2h11.586l-4.293-4.293a1 
                    1 0 010-1.414z"
                  />
                </svg>
                <p className="text-sm text-gray-600">{item}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default InsightsView;
