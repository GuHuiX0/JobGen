/**
 * GlassCard
 * ---------------------------------------------------------------------------
 * Reusable glass-morphism container.
 *
 * Purpose:
 * - Provides a consistent translucent + blurred card style
 * - Wraps arbitrary children without adding layout logic
 */

const GlassCard = ({ children, className = '' }) => (
  <div
    className={`bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl ${className}`}
  >
    {children}
  </div>
);

export default GlassCard;
