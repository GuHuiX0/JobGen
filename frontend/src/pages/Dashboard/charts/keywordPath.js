/**
 * Generate an SVG polyline path for keyword frequency trend.
 */
export const generateKeywordPath = (counts) => {
  if (!counts.length) return '';

  const width = 200;
  const height = 60;
  const pad = 10;
  const xStep = (width - 2 * pad) / Math.max(counts.length - 1, 1);
  const maxCount = Math.max(...counts) || 1;

  return counts
    .map((c, i) => {
      const x = pad + i * xStep;
      const y = height - pad - (c / maxCount) * (height - 2 * pad);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
};
