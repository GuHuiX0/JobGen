/**
 * Header
 * -------------------------------------------------------------
 * Dashboard top header:
 * - Page badge + title + subtitle
 * - CTA button to start a new interview
 *
 * Navigation is passed in as a prop.
 */

const Header = ({ navigate }) => (
  <div className="border-b border-gray-200/80 bg-white/80 backdrop-blur">
    <div className="mt-16 max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

      {/* Info block */}
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold tracking-widest text-indigo-600 bg-indigo-100/80 rounded-full uppercase mb-3">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 
              011-1h2a1 1 0 
              011 1v5a1 1 0 
              01-1 1H3a1 1 0 
              01-1-1v-5zM8 7a1 1 0 
              011-1h2a1 1 0 
              011 1v9a1 1 0 
              01-1 1H9a1 1 0 
              01-1-1V7zM14 4a1 1 
              0 011-1h2a1 1 0 
              011 1v12a1 1 0 
              01-1 1h-2a1 1 0 
              01-1-1V4z" 
            />
          </svg>
          Performance Analytics
        </span>

        <h1 className="text-4xl font-light text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-500">Comprehensive view of your interview readiness</p>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/interview')}
        className="px-8 py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 shadow-lg shadow-indigo-200/60 hover:from-indigo-400 hover:via-purple-500 hover:to-rose-400 hover:scale-105 transition-all duration-300 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 18a8 8 0 
            100-16 8 8 0 
            000 16zM9.555 7.168A1 1 0 
            008 8v4a1 1 0 
            001.555.832l3-2a1 1 0 
            000-1.664l-3-2z"
          />
        </svg>
        Start Interview
      </button>

    </div>
  </div>
);

export default Header;
