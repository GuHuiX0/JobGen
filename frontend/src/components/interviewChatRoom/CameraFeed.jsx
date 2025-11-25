/**
 * CameraFeed
 * -----------------------------------------------------------------------------
 * Lightweight webcam preview for the interview room.
 *
 * Responsibilities:
 * - Request and display a video stream via getUserMedia
 * - Handle permission errors with clean UI feedback
 * - Support auto-start mode
 * - Clean up media tracks on unmount
 *
 * Notes:
 * - Video only (no audio)
 * - Errors normalized for consistent user messaging
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl ${className}`}>
    {children}
  </div>
);

const CameraFeed = ({ autoStart = false, className = '' }) => {
  const videoRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /** Start camera */
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsEnabled(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError(getErrorMessage(err));
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Stop camera */
  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsEnabled(false);
  };

  /** Toggle camera */
  const toggleCamera = () => {
    isEnabled ? stopCamera() : startCamera();
  };

  /** Error mapping */
  const getErrorMessage = (err) => {
    if (err.name === 'NotAllowedError') return 'Camera permission denied.';
    if (err.name === 'NotFoundError') return 'No camera device detected.';
    if (err.name === 'NotReadableError') return 'Camera is in use.';
    if (err.name === 'OverconstrainedError') return 'Unsupported camera configuration.';
    return `Camera error: ${err.message || 'Unknown error'}`;
  };

  /** Auto start */
  useEffect(() => {
    if (autoStart && !isEnabled && !isLoading && !error) startCamera();
  }, [autoStart, isEnabled, isLoading, error, startCamera]);

  /** Cleanup */
  useEffect(() => stopCamera, []);

  return (
    <GlassCard
      className={`relative overflow-hidden rounded-2xl border-2 border-white/30 shadow-2xl w-[240px] h-[180px] ${className}`}
    >

      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ display: isEnabled && !error ? 'block' : 'none' }}
      />

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-white text-xs">Starting camera...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-3">
          <div className="text-center">
            <svg className="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white text-xs mb-2">{error}</p>
            <button
              onClick={startCamera}
              className="px-3 py-1 bg-emerald-500/80 hover:bg-emerald-500 text-white text-xs rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Idle */}
      {!isEnabled && !error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800/60 to-gray-900/60">
          <div className="text-center">
            <svg className="w-12 h-12 text-white/60 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-white/70 text-xs mb-3">Camera Off</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-emerald-500/80 hover:bg-emerald-500 text-white text-xs rounded-lg flex items-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Enable Camera
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-2">
        <div className="flex items-center gap-2">
          {isEnabled && (
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
          )}
          <span className="text-white text-xs font-medium">
            {isEnabled ? 'Recording' : 'Camera Off'}
          </span>
        </div>
      </div>

    </GlassCard>
  );
};

export default CameraFeed;
