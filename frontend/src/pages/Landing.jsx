import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import bg from "../assets/bg.jpg";
import { getMe } from "../services/auth";
import AboutModal from "../components/common/AboutModal";
import GoogleLoginButton from "../components/common/GoogleLoginButton";

/**
 * ============================================================================
 * Landing Page
 * ----------------------------------------------------------------------------
 * The entry screen of the application. Responsible for:
 * - Validating existing session and auto-redirecting authenticated users
 * - Handling Google OAuth redirect parameters and error states
 * - Displaying the animated landing UI (background, floating card, text)
 * - Exposing Google login button
 * - Toggling the "About" modal for product information
 *
 * UX Goals:
 * - Smooth on-boarding experience
 * - Clear login pathway
 * - Minimal distractions with gentle animations
 * ============================================================================
 */
export default function Landing() {
    const navigate = useNavigate();
    const location = useLocation();
    const reduceMotion = useReducedMotion();

    /** Local UI state */
    const [checking, setChecking] = useState(true);      // Validating local session
    const [error, setError] = useState("");              // Login / OAuth error message
    const [aboutOpen, setAboutOpen] = useState(false);   // Controls About modal visibility

    /**
     * Session validation workflow:
     * ------------------------------------------------------------------------
     * On mount:
     *   1. Detect OAuth redirect params (?code, ?state, ?error)
     *   2. Check if a valid local session exists (via getMe)
     *   3. If authenticated:
     *        - Strip OAuth params (if present)
     *        - Redirect user into interview flow
     *   4. If OAuth error encountered:
     *        - Display UI error message
     *        - Reset URL parameters
     * ------------------------------------------------------------------------
     */
    useEffect(() => {
        let mounted = true;

        (async () => {
            const params = new URLSearchParams(location.search);
            const hasAuthParams =
                params.has("code") || params.has("state") || params.has("error");

            const me = await getMe();
            if (!mounted) return;

            // Rule: Authenticated users should not stay on the landing page
            if (me) {
                if (hasAuthParams) navigate("/", { replace: true }); // Remove OAuth query params
                navigate("/interview", { replace: true });
                return;
            }

            // OAuth failure state
            if (hasAuthParams && params.get("error")) {
                setError("Login failed. Please try again.");
                navigate("/", { replace: true });
            }

            setChecking(false);
        })();

        return () => {
            mounted = false;
        };
    }, [location.search, navigate]);

    /** Successful Google login → redirect into interview flow */
    const handleLoginSuccess = () => {
        navigate("/interview");
    };

    /** Google login failure → display message */
    const handleLoginError = (err) => {
        setError(err.message || "Login failed. Please try again.");
    };

    /** Framer Motion animation variants ------------------------------------ */
    const fadeIn = {
        initial: { opacity: 0, y: 12 },
        animate: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 110, damping: 16, delay: 0.05 },
        },
    };

    const bgZoom = reduceMotion
        ? { initial: {}, animate: {} }
        : {
            initial: { scale: 1.02 },
            animate: {
                scale: 1.06,
                transition: {
                    duration: 18,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "linear",
                },
            },
        };

    const float = reduceMotion
        ? { initial: {}, animate: {} }
        : {
            initial: { y: 0 },
            animate: {
                y: [0, -6, 0],
                transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            },
        };

    return (
        <div className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden">

            {/* Background Image (slow zoom animation) */}
            <motion.div
                {...bgZoom}
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bg})` }}
            />

            {/* Layered overlays: gradients, vignette mask, texture, scanning light */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/20" />
                <div className="absolute inset-0 [mask-image:radial-gradient(75%_75%_at_50%_50%,#000_55%,transparent_100%)] bg-black/15" />
                <div className="absolute inset-0 macos-noise opacity-25 mix-blend-overlay" />

                {/* Scanning light effect (disabled if reduce-motion enabled) */}
                {!reduceMotion && (
                    <motion.div
                        aria-hidden
                        className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/6 to-transparent"
                        initial={{ x: "-30%", skewX: -15 }}
                        animate={{ x: "130%" }}
                        transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
                    />
                )}
            </div>

            {/* Main Landing Card */}
            <div className="relative z-10 w-full px-6 flex items-center justify-center">
                <motion.div
                    {...fadeIn}
                    {...float}
                    className="macos-window p-10 sm:p-12 max-w-3xl w-full text-center bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-black/5"
                >
                    {/* Title */}
                    <motion.h1
                        className="text-4xl sm:text-6xl font-extrabold text-gray-900"
                        initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ delay: 0.15, duration: 0.5 }}
                    >
                        Ready to ace your next interview?
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        className="mt-3 text-gray-600 text-base sm:text-lg"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.28, duration: 0.45 }}
                    >
                        Your AI-powered interview practice starts here.
                    </motion.p>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                        >
                            <p className="text-sm text-red-600">{error}</p>
                        </motion.div>
                    )}

                    {/* Login Button */}
                    <motion.div
                        className="mt-8 flex justify-center"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.36, duration: 0.45 }}
                    >
                        {checking ? (
                            <div className="text-gray-600">Checking your session…</div>
                        ) : (
                            <GoogleLoginButton
                                onSuccess={handleLoginSuccess}
                                onError={handleLoginError}
                            />
                        )}
                    </motion.div>

                    {/* Footer: shortcuts & About link */}
                    <motion.div
                        className="mt-8 pt-6 border-t border-white/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                    >
                        <p className="text-xs sm:text-sm text-gray-500">
                            Tip: Press <span className="font-semibold text-gray-500">Enter</span> to continue • Best in latest <span className="font-semibold text-gray-500">Safari/Chrome</span>
                        </p>

                        <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1 tracking-tight">
                            For details on features, privacy, and data use, see{" "}
                            <button
                                onClick={() => setAboutOpen(true)}
                                className="font-semibold text-gray-600 border-b border-gray-300/80 hover:text-gray-800 hover:border-gray-500 transition"
                            >
                                About
                            </button>
                            .
                        </p>
                    </motion.div>
                </motion.div>
            </div>

            {/* About Modal */}
            <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
        </div>
    );
}
