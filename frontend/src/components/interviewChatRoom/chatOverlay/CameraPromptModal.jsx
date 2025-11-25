/**
 * CameraPromptModal
 * ---------------------------------------------------------------------------
 * Simple confirmation dialog for enabling the camera.
 *
 * Props:
 * - visible: boolean — controls modal visibility
 * - onYes:   callback — user agrees to enable camera
 * - onNo:    callback — user declines
 */

import GlassCard from './GlassCard';

const CameraPromptModal = ({ visible, onYes, onNo }) => {
  if (!visible) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
      <GlassCard className="p-6 max-w-md mx-4 animate-fadeIn">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">Enable Camera?</h3>
            <p className="text-sm text-white/70">
              Would you like to enable your camera for this interview?
            </p>
          </div>
        </div>

        {/* Body */}
        <p className="text-white/80 text-sm mb-6">
          Enabling your camera helps create a more immersive and realistic interview
          experience. You can turn it off anytime.
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onNo}
            className="px-4 py-2 text-white/70 hover:text-white font-medium transition-colors"
          >
            Not Now
          </button>

          <button
            onClick={onYes}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Yes, Enable Camera
          </button>
        </div>

      </GlassCard>
    </div>
  );
};

export default CameraPromptModal;
