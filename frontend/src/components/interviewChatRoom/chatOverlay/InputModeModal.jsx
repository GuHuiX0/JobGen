/**
 * InputModeModal
 * ---------------------------------------------------------------------------
 * Modal for choosing answer input mode (Text / Voice).
 *
 * Responsibilities:
 * - Block page interactions when visible
 * - Present two clear input choices
 * - Trigger parent handler with selected method
 *
 * Notes:
 * - Pure UI component; no recording or text logic here
 * - Hidden via early return for performance
 */

import GlassCard from './GlassCard';

const InputModeModal = ({ visible, onSelect }) => {
  if (!visible) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <GlassCard className="p-6 max-w-md mx-4 animate-fadeIn">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">
              Choose Input Method
            </h3>
            <p className="text-sm text-white/70">
              How would you like to answer this question?
            </p>
          </div>
        </div>

        <p className="text-white/80 text-sm mb-6">
          Select your preferred way to provide your answer — text typing or voice recording.
        </p>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4">
          {/* Text Input */}
          <button
            onClick={() => onSelect('text')}
            className="p-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="w-12 h-12 mx-auto mb-3 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div className="text-white font-semibold">Text Input</div>
            <div className="text-white/60 text-xs mt-1">Type your answer</div>
          </button>

          {/* Voice Input */}
          <button
            onClick={() => onSelect('voice')}
            className="p-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <div className="text-white font-semibold">Voice Input</div>
            <div className="text-white/60 text-xs mt-1">Record your answer</div>
          </button>
        </div>

      </GlassCard>
    </div>
  );
};

export default InputModeModal;
