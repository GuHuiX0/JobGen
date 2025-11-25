/**
 * WhatYouGet
 * -----------------------------------------------------------------------------
 * Feature highlight section for the landing page.
 * Displays four key value propositions with gradient tags.
 */

export default function WhatYouGet() {
    const items = [
        {
            t: 'Realistic practice',
            d: 'Simulated rounds with adaptive follow-ups and interview-grade timing.',
            color: 'from-blue-500 to-indigo-500',
            tag: 'Simulation',
        },
        {
            t: 'Specific feedback',
            d: 'Clarity, conciseness, and impact metrics, plus suggested improvements.',
            color: 'from-emerald-500 to-teal-400',
            tag: 'Feedback',
        },
        {
            t: 'STAR guidance',
            d: 'Detects Situation/Task/Action/Result patterns to strengthen storytelling.',
            color: 'from-purple-500 to-pink-500',
            tag: 'Structure',
        },
        {
            t: 'Review history',
            d: 'Track answers, notes, and progress across sessions.',
            color: 'from-rose-500 to-amber-400',
            tag: 'Progress',
        },
    ];

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900">What you’ll get</h3>
            <div className="mt-2 h-px bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent opacity-60" />

            <div className="mt-5">
                {items.map(({ t, d, color, tag }) => (
                    <div
                        key={t}
                        className="mb-3 rounded-2xl border border-gray-200/10 bg-white/10 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="text-[15px] font-medium text-gray-900">{t}</h4>

                            <span
                                className={`text-[11px] font-semibold uppercase px-2.5 py-1 rounded-full bg-gradient-to-r ${color} text-white shadow-sm`}
                            >
                                {tag}
                            </span>
                        </div>

                        <p className="mt-2 text-[13px] text-gray-600 leading-relaxed">{d}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
