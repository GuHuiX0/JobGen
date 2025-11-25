/**
 * ErrorScreen
 * ---------------------------------------------------------------------------
 * Full-page error UI used when feedback/summary loading fails.
 * Displays an error message and provides a retry action.
 */
const ErrorScreen = ({ error }) => {
  const message = error || "Something went wrong. Please try again.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-rose-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md bg-white/80 backdrop-blur border border-rose-100 rounded-3xl p-8 shadow-xl shadow-rose-100/50">

        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-500 to-amber-400 flex items-center justify-center shadow-lg shadow-rose-200/60">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-light text-gray-900 mb-3">Error</h2>

        {/* Message */}
        <p className="text-gray-500 mb-8" role="alert">
          {message}
        </p>

        {/* Retry CTA */}
        <button
          onClick={() => window.location.reload()}
          aria-label="Reload page"
          className="px-8 py-3 rounded-full text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-amber-400 shadow-md hover:scale-105 transition-all duration-300"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default ErrorScreen;
