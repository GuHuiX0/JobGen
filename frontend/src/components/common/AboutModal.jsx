/**
 * AboutModal
 * ------------------------------------------------------------------
 * A fullscreen accessibility-friendly modal describing the purpose
 * and features of the AI Interview Coach platform.
 *
 * Features:
 * - ESC to close
 * - Backdrop click to close
 * - Framer Motion for enter/exit animations
 * - createPortal to avoid layout constraints
 * - Fully ARIA-compliant & keyboard accessible
 *
 * Props:
 * - open    : boolean — controls visibility
 * - onClose : function — triggered on close events
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';

export default function AboutModal({ open, onClose }) {

    /** Allow ESC to close modal */
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onClose?.();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    const modalContent = (
        <AnimatePresence>
            {open && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="about-title"
                    className="fixed inset-0 z-[1000]"
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/45"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.18 } }}
                        exit={{ opacity: 0, transition: { duration: 0.12 } }}
                        onClick={onClose}
                    />

                    {/* Centered panel */}
                    <div className="absolute inset-0 grid place-items-center pointer-events-none">
                        <motion.div
                            className="
                                pointer-events-auto w-[92vw] max-w-[720px]
                                macos-window bg-white/90 animate-pop
                                max-h-[80vh] overflow-y-auto custom-scrollbar pr-1.5
                            "
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                transition: { type: 'spring', stiffness: 420, damping: 26 },
                            }}
                            exit={{
                                opacity: 0,
                                y: -6,
                                scale: 0.98,
                                transition: { duration: 0.12 },
                            }}
                            style={{
                                paddingInline:
                                    'max(0.75rem, env(safe-area-inset-left)) max(0.75rem, env(safe-area-inset-right))',
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 pt-5 pb-3">
                                <h3
                                    id="about-title"
                                    className="text-xl sm:text-2xl font-semibold text-gray-900"
                                >
                                    About — AI Interview Coach
                                </h3>

                                <button
                                    aria-label="Close"
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg hover:bg-gray-100
                                               focus-visible:outline-none focus-visible:ring-2
                                               focus-visible:ring-blue-400"
                                >
                                    <CloseIcon sx={{ fontSize: 22 }} />
                                </button>
                            </div>

                            <div className="border-t border-gray-200/80" />

                            {/* Body */}
                            <div className="p-5 space-y-4">
                                <p className="text-sm text-gray-700">
                                    AI Interview Coach helps you rehearse interviews with structured,
                                    instant feedback. Choose a mode, answer by voice or text, and
                                    receive guidance on STAR storytelling, clarity, confidence,
                                    and keyword usage.
                                </p>

                                {/* What you can do */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                        What you can do here
                                    </h4>
                                    <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                                        <li>Practice Behavioral (STAR), Technical, and Psychometric interviews</li>
                                        <li>Answer using voice or text with auto-transcription</li>
                                        <li>Receive instant improvement feedback</li>
                                        <li>Save polished answers to your Story Bank</li>
                                        <li>Track progress across sessions</li>
                                    </ul>
                                </div>

                                {/* Two-column blocks */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {/* Key features */}
                                    <div className="rounded-xl border border-gray-200/80 bg-white/80 p-4">
                                        <div className="text-[13px] font-semibold text-gray-900 mb-1">
                                            Key features
                                        </div>
                                        <ul className="text-[13px] text-gray-700 list-disc pl-4 space-y-1">
                                            <li>Behavioral / Technical / Psychometric modes</li>
                                            <li>Voice & text modes with timers</li>
                                            <li>STAR highlighting & keyword detection</li>
                                            <li>Filler-word & confidence indicators</li>
                                            <li>Story Bank for saved responses</li>
                                        </ul>
                                    </div>

                                    {/* How it works */}
                                    <div className="rounded-xl border border-gray-200/80 bg-white/80 p-4">
                                        <div className="text-[13px] font-semibold text-gray-900 mb-1">
                                            How it works
                                        </div>
                                        <ul className="text-[13px] text-gray-700 list-disc pl-4 space-y-1">
                                            <li>Select an interview type</li>
                                            <li>Answer prompts via voice or text</li>
                                            <li>Review instant feedback</li>
                                            <li>Save strong answers</li>
                                            <li>Repeat and improve</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Privacy */}
                                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
                                    <div className="text-[13px] font-semibold text-indigo-900 mb-1">
                                        Privacy & data
                                    </div>
                                    <p className="text-[13px] text-indigo-900/90">
                                        Your practice content is used only to generate feedback and
                                        track your progress. You may clear saved answers anytime.
                                    </p>
                                </div>

                                {/* Why it matters */}
                                <div className="rounded-xl border border-gray-200/80 bg-white/80 p-4">
                                    <div className="text-[13px] font-semibold text-gray-900 mb-1">
                                        Why it matters
                                    </div>
                                    <p className="text-[13px] text-gray-700">
                                        Interviews are high-stakes and repetitive. Focused practice with
                                        clear feedback helps you communicate confidently and present your
                                        best self consistently.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
