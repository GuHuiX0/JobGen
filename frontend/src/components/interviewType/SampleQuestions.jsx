/**
 * SampleQuestions
 * -----------------------------------------------------------------------------
 * Structured list of sample interview questions by type (Behavioral / Technical /
 * Psychometric). Each question is shown inside an expandable <details> block.
 *
 * Features:
 * - Category-based grouping with themed accent colors
 * - Smooth staggered fade-in animations
 * - Click-to-expand answers with auto-highlight bar
 *
 * Pure presentational component used on the landing page.
 */
export default function SampleQuestions() {
    const blocks = [
        {
            type: "behavioral",
            title: "Sample questions — Behavioral",
            items: [
                [
                    "Tell me about a time you handled a conflict in a team.",
                    "Focus on the situation, your role, actions, and measurable outcomes."
                ],
                [
                    "Describe a time you had to meet a tight deadline.",
                    "Highlight prioritization, communication, trade-offs, and impact."
                ]
            ]
        },
        {
            type: "technical",
            title: "Sample questions — Technical",
            items: [
                [
                    "Given a stream of numbers, find the median at any point.",
                    "Discuss heap structures, complexity, and edge cases."
                ],
                [
                    "Design a URL shortener.",
                    "Cover API, hashing, storage, scaling, collisions, and observability."
                ]
            ]
        },
        {
            type: "psychometric",
            title: "Sample questions — Psychometric",
            items: [
                [
                    "How do you approach ambiguous problems?",
                    "Explain reasoning steps, comfort with uncertainty, and iteration style."
                ],
                [
                    "If you had to make a tough decision with incomplete data, what would you do?",
                    "Focus on structure, prioritization, and transparent decision-making."
                ]
            ]
        }
    ];

    const accents = {
        behavioral: {
            title: "text-emerald-700",
            underline: "from-emerald-500/60",
            openBar: "before:bg-emerald-400",
            ring: "ring-emerald-300"
        },
        technical: {
            title: "text-blue-700",
            underline: "from-blue-500/60",
            openBar: "before:bg-blue-400",
            ring: "ring-blue-300"
        },
        psychometric: {
            title: "text-purple-700",
            underline: "from-purple-500/60",
            openBar: "before:bg-purple-400",
            ring: "ring-purple-300"
        }
    };

    return (
        <section>
            {blocks.map((b, bi) => {
                const tone = accents[b.type] || accents.technical;

                return (
                    <div
                        key={b.title}
                        style={{ animationDelay: `${bi * 80}ms` }}
                        className="
                            mb-3 rounded-3xl border border-indigo-100/80 bg-white/80 backdrop-blur
                            p-6 sm:p-7 shadow-lg shadow-indigo-100/50
                            hover:shadow-2xl transition-shadow duration-300
                            animate-[fadeInUp_.28s_ease-out_both]
                        "
                    >
                        <h4 className={`text-[15px] font-semibold tracking-tight ${tone.title}`}>
                            {b.title}
                        </h4>
                        <div
                            className={`mt-2 h-px bg-gradient-to-r ${tone.underline} via-black/10 to-transparent opacity-70`}
                        />

                        {b.items.map(([q, a], qi) => (
                            <details
                                key={q}
                                style={{ animationDelay: `${bi * 80 + qi * 40}ms` }}
                                className={`
                                    group relative mt-3 rounded-xl border border-white/60 bg-white/60 backdrop-blur-md p-4
                                    animate-[fadeInUp_.24s_ease-out_both]
                                    transition-all duration-200
                                    hover:shadow-md hover:translate-y-[-1px]
                                    open:bg-white/80 open:shadow-md open:ring-1 ${tone.ring}
                                    before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2
                                    before:w-[3px] before:rounded-full before:opacity-0
                                    group-open:before:opacity-100 ${tone.openBar}
                                `}
                            >
                                <summary className="cursor-pointer text-[14px] font-medium text-gray-800 select-none">
                                    {q}
                                </summary>
                                <p className="mt-2 text-[13px] text-gray-600 leading-relaxed">{a}</p>
                                <div className="pointer-events-none mt-3 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent opacity-60" />
                            </details>
                        ))}
                    </div>
                );
            })}
        </section>
    );
}
