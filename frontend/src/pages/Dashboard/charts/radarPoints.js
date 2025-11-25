/**
 * Generate polygon points for a 3-axis radar chart.
 *
 * Converts behavioral/technical/psychometric scores (0–100)
 * into (x, y) coordinates on a triangular radar plot.
 */
export const generateRadarPoints = (scores) => {
  if (!scores) return '';

  const types = ['behavioral', 'technical', 'psychometric'];
  const center = 100;
  const maxRadius = 80;

  return types
    .map((type, i) => {
      const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
      const value = scores[type] || 0;
      const radius = (value / 100) * maxRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');
};
