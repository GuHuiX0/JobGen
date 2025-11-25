/**
 * Generate SVG path for readiness trend line.
 *
 * Maps score values to (x, y) coordinates within a fixed chart size
 * and returns a path string ("M x y L x y ...") for <path d="..."/>.
 */
export const generateReadinessPath = (recentPoints, minScore, maxScore) => {
  if (!recentPoints.length) return '';

  const width = 600;
  const height = 200;
  const padding = 20;

  const xStep = (width - 2 * padding) / Math.max(recentPoints.length - 1, 1);
  const yRange = maxScore - minScore || 1; // Avoid division by zero

  return recentPoints
    .map((p, i) => {
      const x = padding + i * xStep;
      const y =
        height -
        padding -
        ((p.score - minScore) / yRange) * (height - 2 * padding);

      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
};
