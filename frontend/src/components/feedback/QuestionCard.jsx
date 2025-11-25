/**
 * QuestionCard
 * -------------------------------------------------------------
 * Renders an expandable question panel in the interview feedback page.
 *
 * Content displayed when expanded:
 * - User's answer (voice or text)
 * - AI-generated feedback (STAR score, breakdown, tips)
 * - Clarity / Confidence / Keywords / Example metric cards
 * - Pause detection & filler-word analysis
 * - Voice performance analysis (for voice inputs)
 * - Keyword frequency & matched/missing keyword tags
 * - Coach example answer & improvement points
 *
 * Component responsibilities:
 * - Expand / collapse a question block
 * - Display voice/text badges and answer content
 * - Render visual score indicators (bars, circles, tags)
 * - Handle audio loading/error states for voice answers
 *
 * Props:
 * - idx              : index position of the question
 * - item             : question + user answer + AI feedback object
 * - expandedIndex    : global currently-expanded card index
 * - setExpandedIndex : setter to open/close this card
 * - audioSources     : loaded audio blobs for voice answers
 * - audioLoading     : loading state per audio clip
 * - audioErrors      : error state per audio clip
 */

const QuestionCard = ({
  idx,
  item,
  expandedIndex,
  setExpandedIndex,
  audioSources,
  audioLoading,
  audioErrors
}) => {
  const isOpen = expandedIndex === idx;
  const analysis = item.feedback?.analysis || {};
  const missingPoints = item.feedback?.missing_points || [];
  const improvements = item.feedback?.improvements || [];
  const keywordFrequency = item.feedback?.keyword_frequency || [];
  const fillerWords = item.feedback?.filler_words;
  const userAnswer = item.answer || "No response recorded.";

  const metricCards = [
    { key: "clarity", label: "Clarity", value: analysis.clarity?.score, description: analysis.clarity?.comment },
    { key: "example", label: "Example", value: analysis.example?.score, description: analysis.example?.comment },
    { key: "keywords", label: "Keywords", value: analysis.keywords?.score, description: analysis.keywords?.comment },
    { key: "confidence", label: "Confidence", value: analysis.confidence?.score, description: analysis.confidence?.comment }
  ];

  const hasMetrics = metricCards.some((m) => typeof m.value === "number" && !Number.isNaN(m.value));

  const isVoiceResponse = item.input_mode === "voice";
  const identifier = item.question_id || idx.toString();
  const audioSrc = audioSources[identifier];
  const audioError = audioErrors[identifier];
  const isAudioLoading = audioLoading[identifier];

  const inputModeBadge = isVoiceResponse ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
          clipRule="evenodd"
        />
      </svg>
      Voice response
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
          clipRule="evenodd"
        />
      </svg>
      Text response
    </span>
  );

  return (
    <div
      className="border border-indigo-100/80 bg-white/80 backdrop-blur rounded-3xl p-6 shadow-lg shadow-indigo-100/50 hover:shadow-2xl hover:border-indigo-200 transition-all duration-300"
    >
      {/* BUTTON - expand/collapse */}
      <button
        type="button"
        onClick={() => setExpandedIndex(isOpen ? null : idx)}
        className="w-full flex items-start justify-between gap-4 text-left focus:outline-none"
      >
        <div className="flex-1">
          <div className="inline-block px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-semibold rounded-full shadow-sm shadow-indigo-200/60 mb-3">
            Question {idx + 1}
          </div>
          <h3 className="text-xl font-light text-gray-900 leading-relaxed line-clamp-2">{item.question}</h3>
          <div className="mt-3">{inputModeBadge}</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-4xl font-light text-gray-900">
              {Math.round((item.feedback?.star?.score || 0) * 100)}
            </div>
            <div className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Score</div>
          </div>

          <div
            className={`p-2 rounded-full border border-gray-200 bg-white/70 transition-transform ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="mt-6 space-y-6 border-t border-indigo-50 pt-6">
          {/* ----- USER ANSWER ----- */}
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold tracking-widest text-indigo-500 uppercase">Your Answer</div>

              <div
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                  isVoiceResponse ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                }`}
              >
                {isVoiceResponse ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                    Voice Response
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                    </svg>
                    Text Response
                  </>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{userAnswer}</p>
          </div>

          {/* ----- GOOD ANSWER (coach example) ----- */}
          {item.feedback?.good_answer && (
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
                  Coach Example Answer
                </div>
              </div>
              <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-line">
                {item.feedback.good_answer}
              </p>
            </div>
          )}

          {/* ----- STAR Breakdown pie circles ----- */}
          {item.feedback?.star?.breakdown && (
            <div>
              <div className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>STAR Structure</span>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {Object.entries(item.feedback.star.breakdown).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      <svg className="transform -rotate-90" width="64" height="64">
                        <circle cx="32" cy="32" r="28" stroke="#e0e7ff" strokeWidth="4" fill="none" />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="#6366f1"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 * Math.PI * 28 * (1 - value)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-semibold text-indigo-600">
                          {Math.round(value * 100)}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">{key}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----- Detailed Analysis ----- */}
          {hasMetrics && (
            <div>
              <div className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                <span>Detailed Analysis</span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {metricCards.map((card) => (
                  <div key={card.key} className="p-4 border border-gray-100 rounded-2xl bg-white/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                        {card.label}
                      </span>

                      {typeof card.value === "number" && (
                        <span className="text-sm font-semibold text-indigo-600">
                          {Math.round(card.value * 100)}
                        </span>
                      )}
                    </div>

                    {typeof card.value === "number" && (
                      <div className="h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          style={{ width: `${Math.round(card.value * 100)}%` }}
                        ></div>
                      </div>
                    )}

                    <p className="text-xs text-gray-600 leading-relaxed min-h-[2.5rem]">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----- Pause & Filler Words ----- */}
          {(analysis.pauses?.assessment || typeof fillerWords?.count === "number") && (
            <div className="grid md:grid-cols-2 gap-4">
              {analysis.pauses?.assessment && (
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                  <div className="text-xs font-semibold text-purple-700 uppercase mb-2">
                    Pause Detection
                  </div>
                  <p className="text-sm text-purple-900 leading-relaxed">
                    {analysis.pauses.assessment}
                  </p>

                  {analysis.pauses.severity && (
                    <div className="mt-2 text-xs text-purple-600">
                      Severity: {analysis.pauses.severity}
                    </div>
                  )}
                </div>
              )}

              {typeof fillerWords?.count === "number" && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <div className="text-xs font-semibold text-amber-700 uppercase mb-2">
                    Filler Word Count
                  </div>
                  <p className="text-sm text-amber-900">
                    {fillerWords.count} filler words detected{" "}
                    {fillerWords.top?.length ? `(${fillerWords.top.join(", ")})` : ""}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ----- Voice Analysis (Only voice input) ----- */}
          {isVoiceResponse && item.feedback?.voice_analysis && (
            <div>
              <div className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>

                <span>Voice Performance Analysis</span>
                <span className="text-xs font-normal text-gray-500">
                  Fluency Score: {Math.round((item.feedback.voice_analysis.fluency_score || 0) * 100)}%
                </span>
              </div>

              <div className="space-y-3">
                {item.feedback.voice_analysis.pause_analysis && (
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
                    <div className="text-xs font-semibold text-purple-700 uppercase mb-1">
                      Pause Patterns
                    </div>
                    <p className="text-sm text-purple-800">
                      {item.feedback.voice_analysis.pause_analysis}
                    </p>
                  </div>
                )}

                {item.feedback.voice_analysis.speech_rate_assessment && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="text-xs font-semibold text-blue-700 uppercase mb-1">
                      Speech Rate
                    </div>
                    <p className="text-sm text-blue-800">
                      {item.feedback.voice_analysis.speech_rate_assessment}
                    </p>
                  </div>
                )}

                {item.feedback.voice_analysis.prosody_feedback && (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                    <div className="text-xs font-semibold text-green-700 uppercase mb-1">
                      Voice Delivery
                    </div>
                    <p className="text-sm text-green-800">
                      {item.feedback.voice_analysis.prosody_feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----- Missing Points & Improvements ----- */}
          {(missingPoints.length > 0 || improvements.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              {missingPoints.length > 0 && (
                <div className="p-4 border border-rose-100 rounded-2xl bg-rose-50/60">
                  <div className="text-xs font-semibold tracking-widest text-rose-600 uppercase mb-2">
                    Missing Points
                  </div>

                  <ul className="space-y-2 text-sm text-rose-900">
                    {missingPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-2" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {improvements.length > 0 && (
                <div className="p-4 border border-emerald-100 rounded-2xl bg-emerald-50/60">
                  <div className="text-xs font-semibold tracking-widest text-emerald-600 uppercase mb-2">
                    Improvements
                  </div>

                  <ul className="space-y-2 text-sm text-emerald-900">
                    {improvements.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ----- Keyword Frequency ----- */}
          {keywordFrequency.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span>Keyword Frequency</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {keywordFrequency.map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-xs font-medium text-gray-700 flex items-center gap-1.5"
                  >
                    <span>{kw.keyword}</span>
                    <span className="px-1.5 py-0.5 bg-indigo-500 text-white rounded-full text-[10px] font-semibold">
                      ×{kw.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ----- Suggestions (STAR tips) ----- */}
          {item.feedback?.star?.tips && item.feedback.star.tips.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Suggestions</span>
              </div>

              <div className="space-y-2">
                {item.feedback.star.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-amber-50/50 border border-amber-100/50 rounded-xl">
                    <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----- Keyword Tags (matched / missing) ----- */}
          {item.feedback?.keywords && (
            <div className="flex flex-wrap gap-2">
              {/* Matched keywords */}
              {item.feedback.keywords.matched?.map((kw, i) => (
                <span
                  key={`matched-${i}`}
                  className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-medium rounded-full shadow-sm shadow-indigo-200/60"
                >
                  {kw}
                </span>
              ))}

              {/* Missing keywords */}
              {item.feedback.keywords.missing?.map((kw, i) => (
                <span
                  key={`missing-${i}`}
                  className="px-3 py-1 border border-indigo-200 text-indigo-500/70 text-xs rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
