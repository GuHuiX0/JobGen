/**
 * LoadingView
 * -------------------------------------------------------------
 * Dashboard loading state shown while fetching readiness trend,
 * radar insights, and recent interview data.
 */

const LoadingView = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center">
    <div className="text-center">

      {/* Spinner */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />

        {/* Rotating ring */}
        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-indigo-600 animate-pulse"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        </div>
      </div>

      {/* Text */}
      <p className="text-2xl font-light text-gray-900 mb-2">Loading Dashboard</p>
      <p className="text-sm text-gray-500">Analyzing your performance data...</p>
    </div>
  </div>
);

export default LoadingView;
