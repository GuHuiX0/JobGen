/**
 * LoadingScreen
 * ---------------------------------------------------------------------------
 * Full-screen loading state shown while the AI coach processes the interview.
 */

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center">
    <div className="text-center">

      {/* Spinner */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        {/* Static ring */}
        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />

        {/* Animated ring */}
        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />

        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-indigo-600 animate-pulse"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path
              fillRule="evenodd"
              d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Text */}
      <p className="text-2xl font-light text-gray-900 mb-2">Analyzing Your Performance</p>
      <p className="text-sm text-gray-500">Our AI coach is reviewing your responses...</p>
    </div>
  </div>
);

export default LoadingScreen;
