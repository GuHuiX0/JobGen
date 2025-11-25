import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { interviewAPI } from "../services/api";

import {
  LoadingScreen,
  ErrorScreen,
  HeaderSection,
  OverallScoreCard,
  SummarySection,
  QuestionCard
} from "../components/feedback";

/**
 * ============================================================================
 * FeedbackPage
 * ----------------------------------------------------------------------------
 * Displays post-interview feedback including:
 *   • Overall performance scores
 *   • Summary insights
 *   • Per-question analysis (text + voice replay)
 *
 * Responsibilities:
 * - Fetch interview feedback from backend (with polling while processing)
 * - Lazy-load voice replay audio URLs per question
 * - Manage expanded question state and audio loading status
 * - Render structured feedback sections
 *
 * UX Goals:
 * - Smooth loading experience with fallback states
 * - Clear separation of summary vs. detailed analysis
 * - Minimal unnecessary network requests through caching
 * ============================================================================
 */
const FeedbackPage = () => {
  const { interviewId } = useParams();

  /** Loading / error state for fetching feedback */
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  /** Expanded question index (accordion-like UI) */
  const [expandedIndex, setExpandedIndex] = useState(null);

  /** Audio replay status maps */
  const [audioSources, setAudioSources] = useState({});  // questionId → audio URL
  const [audioLoading, setAudioLoading] = useState({});  // questionId → true/false
  const [audioErrors, setAudioErrors] = useState({});    // questionId → error message

  /**
   * ============================================================================
   * Fetch Feedback (with polling)
   * ----------------------------------------------------------------------------
   * Backend may return {status: "processing"} if AI evaluation is not ready.
   * Poll every 2 seconds until the final feedback is available.
   * ============================================================================
   */
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const data = await interviewAPI.getFeedback(interviewId);

        // Backend still processing → re-poll
        if (data.status === "processing") {
          return setTimeout(fetchFeedback, 2000);
        }

        setFeedback(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [interviewId]);

  /**
   * ============================================================================
   * Fetch Voice Replay Audio
   * ----------------------------------------------------------------------------
   * Fetches signed URL for a question’s audio answer.
   * - Prevents duplicate requests via caching + loading flags
   * - Optionally forces re-fetch when needed
   * ============================================================================
   */
  const fetchVoiceReplay = useCallback(
    async (identifier, { force = false } = {}) => {
      if (!identifier) return;

      // Cached or already loading → skip unless forced
      if (!force && (audioLoading[identifier] || audioSources[identifier])) return;

      try {
        setAudioLoading((prev) => ({ ...prev, [identifier]: true }));

        const data = await interviewAPI.getVoiceResponseAudio(interviewId, identifier);

        setAudioSources((prev) => ({ ...prev, [identifier]: data.audio_url }));
      } catch (err) {
        setAudioErrors((prev) => ({
          ...prev,
          [identifier]: err.message || "语音加载失败",
        }));
      } finally {
        setAudioLoading((prev) => ({ ...prev, [identifier]: false }));
      }
    },
    [interviewId, audioLoading, audioSources]
  );

  /**
   * ============================================================================
   * Auto-load voice replay when a question card is expanded
   * ----------------------------------------------------------------------------
   * Only applies to questions with input_mode === "voice".
   * Avoids unnecessary API calls by checking cache + loading state.
   * ============================================================================
   */
  useEffect(() => {
    if (!feedback || expandedIndex === null) return;

    const item = feedback.items?.[expandedIndex];
    if (!item || item.input_mode !== "voice") return;

    const id = item.question_id || expandedIndex.toString();

    // Lazy-load if not already loaded/loading
    if (!audioSources[id] && !audioLoading[id]) {
      fetchVoiceReplay(id);
    }
  }, [feedback, expandedIndex, audioSources, audioLoading, fetchVoiceReplay]);

  /** Render fallback loading/error UI */
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <HeaderSection />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Overall scoring summary */}
        <OverallScoreCard overall={feedback?.overall} />

        {/* Global summary narrative */}
        <SummarySection summary={feedback?.overall?.summary} />

        {/* Question-by-question details */}
        <h2 className="text-2xl font-light text-gray-900 mb-8">
          Question Analysis
        </h2>

        <div className="space-y-8">
          {feedback?.items?.map((item, idx) => (
            <QuestionCard
              key={idx}
              idx={idx}
              item={item}
              expandedIndex={expandedIndex}
              setExpandedIndex={setExpandedIndex}
              audioSources={audioSources}
              audioLoading={audioLoading}
              audioErrors={audioErrors}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
