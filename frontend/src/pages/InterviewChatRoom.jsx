/**
 * ============================================================================
 * InterviewChatRoom Page
 * ----------------------------------------------------------------------------
 * Renders the full interactive interview environment consisting of:
 *   • 3D virtual studio scene (background)
 *   • Chat panel for questions + text/voice interactions
 *   • Optional camera feed for video answers
 *   • Exit confirmation modal
 *
 * Responsibilities:
 * - Manage local UI state:
 *      • Camera auto-start toggle
 *      • Loading status of questions (controls camera visibility)
 *      • Exit confirmation dialog visibility
 * - Handle navigation:
 *      • Returning back to interview selection on exit
 * - Coordinate communication between ChatOverlay ↔ CameraFeed ↔ Scene
 *
 * UX Goal:
 * - Provide an immersive, focused interview environment with layered UI.
 * ============================================================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import WhiteStudioScene from '../components/interviewChatRoom/WhiteStudioScene';
import ChatOverlay from '../components/interviewChatRoom/ChatOverlay';
import CameraFeed from '../components/interviewChatRoom/CameraFeed';

const InterviewChatRoom = () => {
    const navigate = useNavigate();

    /** Whether the exit confirmation dialog is visible */
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    /** Controls whether the camera feed auto-starts once displayed */
    const [cameraAutoStart, setCameraAutoStart] = useState(false);

    /** Indicates if initial questions are still loading (prevents camera display) */
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

    /** Trigger exit modal */
    const handleExitInterview = () => {
        setShowExitConfirm(true);
    };

    /** Callback from ChatOverlay to update camera auto-start preference */
    const handleCameraAutoStartChange = (enabled) => {
        setCameraAutoStart(enabled);
    };

    /** Confirm exit → navigate back to type selection page */
    const confirmExit = () => {
        navigate('/interview');
    };

    /** Cancel exit → hide confirmation dialog */
    const cancelExit = () => {
        setShowExitConfirm(false);
    };

    return (
        <div className="relative w-full h-screen overflow-hidden">

            {/* ------------------------------------------------------------------
               Background Studio Scene (3D environment)
            ------------------------------------------------------------------ */}
            <WhiteStudioScene layoutPreset="leftThirds" />

            {/* ------------------------------------------------------------------
               Chat Panel UI (questions, mic controls, exit button, etc.)
               Communicates:
                 - onExitInterview → show exit modal
                 - onCameraAutoStartChange → toggle camera
                 - onLoadingChange → notify question load completion
            ------------------------------------------------------------------ */}
            <ChatOverlay
                onExitInterview={handleExitInterview}
                onCameraAutoStartChange={handleCameraAutoStartChange}
                onLoadingChange={setIsLoadingQuestions}
            />

            {/* ------------------------------------------------------------------
               Camera Feed (video preview)
               Only appears once:
                 • Questions are loaded (isLoadingQuestions = false)
                 • Prevents premature camera activation
            ------------------------------------------------------------------ */}
            {!isLoadingQuestions && (
                <div className="absolute top-[72px] right-8 z-30 pointer-events-auto animate-slideInRight">
                    <CameraFeed autoStart={cameraAutoStart} />
                </div>
            )}

            {/* ------------------------------------------------------------------
               Exit Confirmation Modal
               Warns user that all progress will be lost upon exit.
            ------------------------------------------------------------------ */}
            {showExitConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4 animate-in fade-in slide-in-from-bottom-4 duration-300">

                        {/* Header Section */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-amber-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Exit Interview?</h3>
                                <p className="text-sm text-gray-500">Your progress will be lost</p>
                            </div>
                        </div>

                        {/* Body Text */}
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to exit? Answers will not be saved.
                        </p>

                        {/* Actions */}
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelExit}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                            >
                                Continue
                            </button>

                            <button
                                onClick={confirmExit}
                                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                            >
                                Exit
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default InterviewChatRoom;
