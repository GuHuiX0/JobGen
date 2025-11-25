/**
 * PracticeTips
 * -----------------------------------------------------------------------------
 * Small static section used on the landing page to surface quick,
 * high-value interview preparation tips.
 *
 * Characteristics:
 * - Minimal presentational component
 * - Gradient accent markers per tip
 * - Subtle hover/blur effects for consistency with landing-page visuals
 */
export default function PracticeTips() {
    const tips = [
        {
            text: "Keep each answer under 180 seconds",
            color: "from-blue-500 to-indigo-500"
        },
        {
            text: "Lead with outcomes; quantify impact",
            color: "from-emerald-500 to-teal-400"
        },
        {
            text: "Pre-write 5–7 STAR stories",
            color: "from-rose-500 to-amber-400"
        }
    ];

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900">Practice tips</h3>
            <div className="mt-2 h-px bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent opacity-70" />

            <ul className="mt-4 space-y-3 text-[13px] text-gray-700">
                {tips.map(({ text, color }) => (
                    <li
                        key={text}
                        className="
                            flex items-start gap-3 rounded-xl border border-gray-200/10
                            bg-white/10 backdrop-blur-md px-4 py-3 shadow-sm
                            hover:shadow-md transition-all duration-300
                        "
                    >
                        <div className={`mt-1 w-2 h-2 rounded-full bg-gradient-to-r ${color}`} />
                        <p className="leading-relaxed">{text}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
