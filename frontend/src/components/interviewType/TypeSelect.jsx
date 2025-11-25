/**
 * TypeSelect
 * -----------------------------------------------------------------------------
 * Responsive grid selector for interview types.
 * Renders a list of `InterviewTypeCard` items with dimming + animation effects.
 *
 * Props:
 * - typeCards: array of { key, title, desc, color }
 * - selected: currently selected type key
 * - onSelect: callback(key) when a type is chosen
 *
 * UI behavior:
 * - Selected card stays highlighted
 * - Non-selected cards dim when one is selected
 * - Staggered fade-in animation for each card
 */
import InterviewTypeCard from "../common/InterviewTypeCard";

export default function TypeSelect({ typeCards, selected, onSelect }) {
    return (
        <section>
            <div className="grid md:grid-cols-3 gap-6 items-stretch">
                {typeCards.map((c, i) => {
                    const isSelected = selected === c.key;
                    const isDim = selected && !isSelected;

                    return (
                        <div
                            key={c.key}
                            style={{ animationDelay: `${i * 60}ms` }}
                            className={[
                                "h-full animate-fade-in-up",
                                isDim
                                    ? "brightness-95 saturate-75 grayscale-[.08] [transform:none] hover:[transform:none]"
                                    : "",
                            ].join(" ")}
                        >
                            <InterviewTypeCard
                                title={c.title}
                                description={c.desc}
                                color={c.color}
                                selected={isSelected}
                                onClick={() => onSelect(c.key)}
                                className="h-full flex flex-col transform-gpu"
                            />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
