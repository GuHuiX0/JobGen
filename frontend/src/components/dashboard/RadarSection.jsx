/**
 * RadarSection
 * ---------------------------------------------------------------------------
 * Renders:
 * - Radar performance chart (Behavioral / Technical / Psychometric)
 * - AI-powered insights (strengths, weaknesses, suggested focus areas)
 *
 * Props:
 * - radarData: {
 *     scores: { behavioral, technical, psychometric },
 *     gpt_insights: {
 *       strengths: string[],
 *       weaknesses: string[],
 *       suggested_focus: string[]
 *     }
 *   }
 */

import { generateRadarPoints } from '../../pages/Dashboard/charts/radarPoints';

const RadarSection = ({ radarData }) => {
  if (!radarData) return null;

  const strengths = radarData?.gpt_insights?.strengths || [];
  const weaknesses = radarData?.gpt_insights?.weaknesses || [];
  const suggested = radarData?.gpt_insights?.suggested_focus || [];

  return (
    <div className="grid md:grid-cols-2 gap-12">
      {/* ------------------------------------------------------------------ */}
      {/*                          Radar Chart                               */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <h2 className="text-2xl font-light text-gray-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
          Performance by Interview Type
        </h2>

        <div className="border border-indigo-100/70 bg-white/80 backdrop-blur rounded-3xl p-8 flex justify-center shadow-xl shadow-indigo-100/50">
          <svg viewBox="0 0 200 200" className="w-64 h-64">

            {/* Gradient fill for performance polygon */}
            <defs>
              <radialGradient id="radarGradient" cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#4338ca" stopOpacity="0.1" />
              </radialGradient>
            </defs>

            {/* Grid Rings */}
            {[25, 50, 75, 100].map(radius => (
              <circle
                key={radius}
                cx="100"
                cy="100"
                r={radius * 0.8}
                fill="none"
                stroke="#e0e7ff"
                strokeWidth="1"
              />
            ))}

            {/* Axes + Labels */}
            {['Behavioral', 'Technical', 'Psychometric'].map((label, i) => {
              const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
              const x = 100 + 80 * Math.cos(angle);
              const y = 100 + 80 * Math.sin(angle);
              const lx = 100 + 95 * Math.cos(angle);
              const ly = 100 + 95 * Math.sin(angle);

              return (
                <g key={i}>
                  <line x1="100" y1="100" x2={x} y2={y} stroke="#c7d2fe" strokeWidth="1" />
                  <text
                    x={lx}
                    y={ly}
                    fontSize="11"
                    fill="#4f46e5"
                    fontWeight="600"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Main radar polygon */}
            <polygon
              points={generateRadarPoints(radarData?.scores)}
              fill="url(#radarGradient)"
              stroke="#4338ca"
              strokeWidth="2"
            />

            {/* Data points */}
            {['behavioral', 'technical', 'psychometric'].map((type, i) => {
              const value = radarData?.scores?.[type] || 0;
              const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
              const radius = (value / 100) * 80;
              const x = 100 + radius * Math.cos(angle);
              const y = 100 + radius * Math.sin(angle);

              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="6" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                  <text
                    x={x}
                    y={y - 12}
                    fontSize="13"
                    fill="#312e81"
                    textAnchor="middle"
                    fontWeight="700"
                  >
                    {value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*                         AI Insights                                */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <h2 className="text-2xl font-light text-gray-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          AI-Powered Insights
        </h2>

        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 
                  1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="text-sm font-semibold text-gray-900">Your Strengths</h3>
            </div>

            <div className="space-y-2">
              {strengths.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl"
                >
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                  <p className="text-sm text-emerald-900 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weaknesses */}
        {weaknesses.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 
                  3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 
                  2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 
                  13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 
                  00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="text-sm font-semibold text-gray-900">Areas to Improve</h3>
            </div>

            <div className="space-y-2">
              {weaknesses.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl"
                >
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2"></span>
                  <p className="text-sm text-amber-900 leading-relaxed">{w}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Focus Areas */}
        {suggested.length > 0 && (
          <div className="p-5 bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-600 text-white rounded-2xl shadow-xl shadow-indigo-200/50">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 
                1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 
                0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 
                00-.364 1.118l1.07 3.292c.3.921-.755 
                1.688-1.54 1.118l-2.8-2.034a1 1 0 
                00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 
                1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 
                1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h3 className="text-sm font-semibold">Suggested Focus Areas</h3>
            </div>

            <div className="space-y-2">
              {suggested.map((focus, i) => (
                <div key={i} className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 
                      0l6 6a1 1 0 010 1.414l-6 
                      6a1 1 0 01-1.414-1.414L14.586 
                      11H3a1 1 0 110-2h11.586l-4.293-4.293a1 
                      1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-white/95 leading-relaxed">{focus}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RadarSection;
