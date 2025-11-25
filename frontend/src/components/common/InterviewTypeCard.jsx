/**
 * InterviewTypeCard
 * -----------------------------------------------------------------------------
 * Interactive card used on the interview-type selection screen.
 *
 * Responsibilities:
 * - Display a themed card with title + description
 * - Support mouse + keyboard activation (Enter/Space)
 * - Reflect selected vs. unselected states with animations
 *
 * Props:
 * - title: string          Label text
 * - description: string    Supporting text
 * - color: string          Theme key ("green" | "blue" | "purple")
 * - selected: boolean      Whether the card is active
 * - onClick: function      Selection handler
 * - className: string      Additional wrapper classes (optional)
 */
export default function InterviewTypeCard({
    title,
    description,
    color,
    selected,
    onClick,
    className = '',
}) {
    /** Predefined color accents */
    const tones = {
        green:  { ring: 'ring-emerald-300',  badge: 'from-emerald-500 to-green-500' },
        blue:   { ring: 'ring-blue-300',     badge: 'from-blue-500 to-indigo-500' },
        purple: { ring: 'ring-purple-300',   badge: 'from-purple-500 to-pink-500' },
    };
    const tone = tones[color] || tones.blue;

    /** Enable keyboard activation */
    const handleKey = (e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
    };

    return (
        <div
            role="button"
            tabIndex={0}
            aria-pressed={!!selected}
            onClick={onClick}
            onKeyDown={handleKey}
            className={[
                'relative isolate overflow-hidden group select-none p-6',
                'rounded-3xl border border-indigo-100/80 bg-white/80 backdrop-blur',
                'shadow-lg shadow-indigo-100/50 transition-all duration-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1',
                'h-full flex flex-col',
                selected
                    ? `z-10 ring-2 ${tone.ring} bg-white animate-pop selected-sheen`
                    : 'hover:shadow-2xl hover:-translate-y-0.5',
                className,
            ].join(' ')}
        >
            {/* Selected ring animation */}
            {selected && (
                <span className="absolute -inset-1 rounded-[22px] pointer-events-none animate-pulse-ring" />
            )}

            {/* Header */}
            <div>
                <span
                    className={`inline-flex items-center px-3 py-1 text-sm font-semibold tracking-widest uppercase text-white bg-gradient-to-r ${tone.badge} rounded-full shadow-sm`}
                >
                    {title}
                </span>

                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {description}
                </p>
            </div>

            {/* Footer CTA */}
            <div className="mt-auto">
                <div className="mt-4 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent opacity-60" />

                <div className="mt-4 flex items-center gap-2 text-sm font-medium">
                    {selected ? (
                        <>
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] shadow-md animate-check">
                                ✓
                            </span>
                            <span className="text-emerald-600">Selected</span>
                        </>
                    ) : (
                        <>
                            <span className="inline-block w-5 h-5 rounded-full border border-gray-300/80 bg-white/60" />
                            <span className="text-indigo-600 group-hover:underline">Select</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
