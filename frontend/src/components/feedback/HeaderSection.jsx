/**
 * HeaderSection
 * ---------------------------------------------------------------------------
 * Top section of the feedback page:
 * - Page title and description
 * - Summary badge
 * - Shortcut button back to Dashboard
 */

import { useNavigate } from "react-router-dom";

const HeaderSection = () => {
  const navigate = useNavigate();

  return (
    <div className="border-b border-gray-200/80 bg-white/80 backdrop-blur">
      <div className="mt-16 max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

        {/* Left: badge + title */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold tracking-widest text-indigo-600 bg-indigo-100/80 rounded-full uppercase mb-3">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"
              />
            </svg>
            Interview summary
          </span>

          <h1 className="text-4xl font-light text-gray-900 mb-2">
            Interview Feedback
          </h1>
          <p className="text-gray-500">
            A closer look at your performance and next steps
          </p>
        </div>

        {/* Right: dashboard CTA */}
        <button
          onClick={() => navigate("/dashboard")}
          aria-label="Go to Dashboard"
          className="px-8 py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 101.414 1.414L9 5.414V17a1 1 0 102 0V5.414l5.293 5.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Dashboard
        </button>
      </div>
    </div>
  );
};

export default HeaderSection;
