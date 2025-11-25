/**
 * RingTimer
 * ---------------------------------------------------------------------------
 * Circular countdown indicator for the interview timer.
 *
 * Responsibilities:
 * - Render an SVG ring with progress based on remaining time
 * - Change ring color based on percentage (green → amber → red)
 * - Display numeric seconds beside the ring
 *
 * Notes:
 * - Pure visual component, no interval logic inside
 * - Always clamps remaining time at 0 for safety
 */

const RingTimer = ({ total, remain }) => {
  const r = 20;
  const c = 2 * Math.PI * r; // circumference
  const pct = Math.max(0, remain) / total;
  const dash = c * (1 - pct);

  const color =
    pct > 0.6
      ? 'stroke-emerald-400'
      : pct > 0.3
      ? 'stroke-amber-400'
      : 'stroke-rose-400';

  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 64 64" className="w-10 h-10 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={r}
          className="stroke-white/25"
          strokeWidth="4"
          fill="none"
        />

        <circle
          cx="32"
          cy="32"
          r={r}
          className={color}
          strokeWidth="4"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={dash}
          strokeLinecap="round"
        />
      </svg>

      <div className="text-white">
        <div className="text-sm tabular-nums">
          {Math.max(0, Math.floor(remain))}s
        </div>
      </div>
    </div>
  );
};

export default RingTimer;
