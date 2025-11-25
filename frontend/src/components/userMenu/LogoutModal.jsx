import { useEffect } from 'react';

/**
 * ConfirmModal
 * -----------------------------------------------------------------------------
 * Generic confirmation dialog with optional loading state.
 *
 * Features:
 *  - ESC key to dismiss
 *  - Backdrop click to close
 *  - Prevent duplicate actions via loading flag
 *
 * Props:
 *  - open: boolean → whether modal is visible
 *  - title: dialog heading text
 *  - message: body text
 *  - confirmText / cancelText: button labels
 *  - onConfirm: handler for confirm action
 *  - onCancel: handler for cancel/close
 *  - loading: disables actions and shows spinner
 */
export default function ConfirmModal({
    open,
    title = 'Confirm',
    message = 'Are you sure?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    loading = false,
}) {
    /**
     * Close when ESC is pressed.
     */
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onCancel?.();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.25)_0%,rgba(0,0,0,0.35)_100%)] backdrop-blur-md animate-fade-in"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative z-10 w-[340px] max-w-[90%] rounded-2xl border border-white/20 bg-white dark:bg-gray-800/60 backdrop-blur-2xl shadow-[0_8px_40px_-4px_rgba(0,0,0,0.25)] p-6 text-center animate-fade-in-up select-none">
                <div className="macos-noise absolute inset-0 rounded-2xl opacity-25 pointer-events-none" />

                <h3 id="confirm-title" className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {title}
                </h3>

                <p id="confirm-desc" className="text-gray-600 dark:text-gray-300 text-[14px] leading-relaxed mb-5">
                    {message}
                </p>

                {/* Actions */}
                <div className="flex justify-center gap-4 mt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className={[
                            "px-5 py-2.5 rounded-full bg-white/70 hover:bg-white/90 text-gray-800 font-medium",
                            "border border-gray-300/60 shadow-sm transition-all active:scale-[0.97]",
                            loading ? "opacity-60 cursor-not-allowed" : "",
                        ].join(" ")}
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={[
                            "px-5 py-2.5 rounded-full font-medium text-white shadow-md transition-all active:scale-[0.97]",
                            "bg-gradient-to-r from-rose-600 via-rose-500 to-red-500 hover:from-red-600 hover:to-rose-700",
                            loading ? "opacity-60 cursor-not-allowed" : "",
                        ].join(" ")}
                        aria-busy={loading}
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                Logging out…
                            </span>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
