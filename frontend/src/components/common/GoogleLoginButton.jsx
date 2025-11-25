import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { loginWithGoogle } from '../../services/auth';

/**
 * GoogleLoginButton
 * -------------------------------------------------------------
 * Renders Google One-Tap/Popup Sign-In button.
 * After receiving Google's ID token (JWT),
 * exchanges it for JobGen's application JWT.
 *
 * Props:
 * - onSuccess: callback after successful login
 * - onError:   callback when login fails
 */
const GOOGLE_CLIENT_ID =
  '683152684683-srfgigkrr9n37v5k0uhtes2i924b6vim.apps.googleusercontent.com';

export default function GoogleLoginButton({ onSuccess, onError }) {
  const googleButtonRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  /**
   * Detect Google SDK availability
   */
  useEffect(() => {
    const poll = setInterval(() => {
      if (window.google) {
        clearInterval(poll);
        setSdkLoaded(true);
        initializeGoogle();
      }
    }, 100);

    // Fallback timeout
    const timeout = setTimeout(() => {
      clearInterval(poll);
      if (!window.google) console.error('Google SDK failed to load');
    }, 10000);

    return () => {
      clearInterval(poll);
      clearTimeout(timeout);
    };
  }, []);

  /**
   * Initialize Google Sign-In and mount the button
   */
  const initializeGoogle = () => {
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'filled_blue',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 300,
        });
      }
    } catch (err) {
      console.error('Error initializing Google Sign-In:', err);
    }
  };

  /**
   * Handle Google Token → exchange for JobGen token
   */
  const handleGoogleResponse = async (response) => {
    setIsLoading(true);

    try {
      const googleJwt = response.credential;
      const payload = JSON.parse(atob(googleJwt.split('.')[1]));
      const email = payload.email;

      const result = await loginWithGoogle(email, googleJwt);
      onSuccess?.(result);
    } catch (err) {
      console.error('Login error:', err);
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Google OAuth button mount point */}
      <div
        ref={googleButtonRef}
        className={`transition-opacity ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      />

      {/* Loading overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 
                   1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm text-gray-700 font-medium">Verifying...</span>
          </div>
        </motion.div>
      )}

      {/* SDK loading text */}
      {!sdkLoaded && (
        <div className="text-sm text-gray-500 mt-2">Loading Google Sign-In...</div>
      )}
    </div>
  );
}
