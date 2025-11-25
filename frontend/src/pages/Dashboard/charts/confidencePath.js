/**
 * Generates an SVG path for confidence trend visualization.
 *
 * - Maps confidence values (0–100) to a fixed SVG coordinate space
 * - Supports any number of points (including 1)
 * - Returns empty string when no data is provided
 */
export const generateConfidencePath = (trend) => {
  if (!trend.length) return '';

  const width = 600;
  const height = 150;
  const pad = 20;

  const xStep = (width - 2 * pad) / Math.max(trend.length - 1, 1);
  const yScale = height - 2 * pad;

  return trend
    .map((p, i) => {
      const x = pad + i * xStep;
      const y = height - pad - (p.confidence / 100) * yScale;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
};
