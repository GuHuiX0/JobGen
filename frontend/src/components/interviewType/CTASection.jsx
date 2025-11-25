/**
 * CTASection
 * -----------------------------------------------------------------------------
 * Action bar for "Clear" and "Continue" controls.
 *
 * Responsibilities:
 * - Handle Skip/Clear and Continue actions
 * - Reflect disabled/loading/error states
 * - Prevent duplicate submissions while loading
 *
 * Props:
 * - selected: boolean        Whether a valid option is selected
 * - onSkip: function         Clear handler
 * - onContinue: function     Continue handler
 * - loading: boolean         Shows spinner + disables actions
 * - error: string            Optional error message
 */
export default function CTASection({
    selected,
    onSkip,
    onContinue,
    loading = false,
    error = '',
}) {
    const disabled = !selected || loading;

    const handleSkip = () => {
        if (!loading) onSkip?.();
    };

    const handleContinue = () => {
        if (!disabled) onContinue?.();
    };

    return (
        <div className="px-6 sm:p-7 mt-1 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="sm:ml-auto flex items-center gap-3">
                <div className="pt-4 flex items-center justify-center gap-4">

                    {/* Clear button */}
                    <button
                        type="button"
                        onClick={handleSkip}
                        disabled={loading}
                        className={[
                            "px-8 py-3 rounded-xl border border-[rgba(43,107,245,1)] text-[rgba(43,107,245,1)] bg-white/70",
                            "hover:bg-[rgba(43,107,245,1)] hover:text-white active:bg-[rgba(43,107,245,1)] active:text-white",
                            "transition-all duration-300 text-sm font-semibold shadow-sm shadow-indigo-200/60",
                            loading ? "opacity-60 cursor-not-allowed" : "",
                        ].join(" ")}
                        aria-disabled={loading}
                    >
                        {loading ? "Please wait…" : "Clear"}
                    </button>

                    {/* Continue button */}
                    <button
                        type="button"
                        onClick={handleContinue}
                        disabled={disabled}
                        className={[
                            "px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300",
                            disabled ? "opacity-60 cursor-not-allowed" : "hover:opacity-90",
                        ].join(" ")}
                        style={{
                            backgroundColor: disabled
                                ? "rgba(43, 107, 245, 0.6)"
                                : "rgba(43, 107, 245, 1)",
                            boxShadow:
                                "0 10px 15px -3px rgba(43, 107, 245, 0.3), 0 4px 6px -2px rgba(43, 107, 245, 0.1)",
                        }}
                        aria-disabled={disabled}
                        aria-busy={loading}
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <svg
                                    className="animate-spin h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
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
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    />
                                </svg>
                                Creating…
                            </span>
                        ) : (
                            "Continue"
                        )}
                    </button>
                </div>

                {/* Error text */}
                {error ? (
                    <span className="text-sm text-rose-600" role="status" aria-live="polite">
                        {error}
                    </span>
                ) : null}
            </div>
        </div>
    );
}
