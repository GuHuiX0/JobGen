/**
 * ============================================================================
 * API Service Layer
 * ----------------------------------------------------------------------------
 * Centralized module responsible for all backend interactions. This layer
 * ensures consistent request behavior, unified error handling, and automatic
 * injection of authentication headers across the application.
 *
 * Responsibilities:
 * - Interview session creation, questions, submission, and feedback
 * - Dashboard analytics for readiness and type breakdown
 * - Speech-to-text conversions
 * - Story-bank management
 * - User profile lookup
 *
 * Features:
 * - Centralized fetch wrapper (`fetchAPI`)
 * - Normalized error responses
 * - Automatic Authorization + user-id header injection
 * - Debug logging for request/response visibility
 * ============================================================================
 */

import { getJobGenJwt, getUserId } from './auth';
import CONFIG from '../config';

const API_BASE_URL = CONFIG.API_BASE_URL;

// Debug environment validation (useful during deployment)
console.log('🔧 API Configuration:', {
  'process.env.REACT_APP_API_URL': process.env.REACT_APP_API_URL,
  'CONFIG.API_BASE_URL': CONFIG.API_BASE_URL,
  'Resolved API_BASE_URL': API_BASE_URL,
});

/**
 * fetchAPI
 * ----------------------------------------------------------------------------
 * Unified HTTP client wrapper for all API calls.
 *
 * Behavior:
 * - Prepends API base URL
 * - Automatically attaches:
 *     • Authorization: Bearer <jobgen_jwt>
 *     • x-user-id: <user_id>
 * - Merges custom headers with defaults
 * - Logs request + response metadata in dev mode
 * - Normalizes error responses for predictable handling
 *
 * @param {string} endpoint - Relative API endpoint (e.g. "/interviews")
 * @param {object} options  - Fetch options (method, headers, body, etc.)
 *
 * @returns {Promise<any>} Parsed JSON response
 * @throws {Error} Standardized error for failed responses
 */
const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const jwt = getJobGenJwt();
  const userId = getUserId();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (jwt) headers['Authorization'] = `Bearer ${jwt}`;
  if (userId) headers['x-user-id'] = userId;

  const finalOptions = { headers, ...options };

  // Debug log for visibility during development
  console.log('🔍 API Request:', {
    url,
    method: finalOptions.method || 'GET',
    headers: {
      ...headers,
      Authorization: jwt ? 'Bearer ***' : 'none', // Mask JWT
      'x-user-id': userId || 'none',
    },
    hasBody: !!finalOptions.body,
  });

  try {
    const response = await fetch(url, finalOptions);

    console.log('📡 API Response:', {
      url,
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error(`❌ API Error (${endpoint}):`, err);
    throw err;
  }
};

/* ============================================================================
 * INTERVIEW API
 * ============================================================================
 */
export const interviewAPI = {
  /**
   * getQuestions
   * --------------------------------------------------------------------------
   * Generates interview questions for a given session.
   *
   * @param {string} interviewId - ID of the interview session
   * @param {number} count       - Number of questions to generate
   *
   * @returns {Promise<{ items: Array<Question> }>}
   */
  getQuestions: async (interviewId, count = 5) => {
    const response = await fetchAPI(`/interviews/${interviewId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ type: 'behavioral', count }),
    });

    return {
      items:
        response.questions?.map((q) => ({
          question_id: q.question_id,
          text: q.question_text,
          type: q.question_type,
          category: q.category,
          difficulty: q.difficulty,
          duration_seconds: q.duration_seconds,
          order: q.order,
        })) || [],
    };
  },

  /** Retrieve dynamic hint for a question */
  getQuestionHint: (interviewId, questionId, prompt = '') =>
    fetchAPI(`/interviews/${interviewId}/questions/${questionId}/hint`, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  /** Submit user responses for the interview */
  submitResponses: (interviewId, responses) =>
    fetchAPI(`/interviews/${interviewId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ responses }),
    }),

  /** Retrieve feedback generated for the interview */
  getFeedback: (interviewId) => fetchAPI(`/interviews/${interviewId}/feedback`),

  /** Fetch signed audio URL used for playback of voice-based answers */
  getVoiceResponseAudio: (interviewId, identifier) =>
    fetchAPI(`/interviews/${interviewId}/questions/${identifier}/audio`),

  /** Create a new interview session */
  createInterview: (params) =>
    fetchAPI('/interviews', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  /** Fetch full interview history for the current user */
  getHistory: () => fetchAPI('/interviews/history'),
};

/* ============================================================================
 * SPEECH-TO-TEXT API
 * ============================================================================
 */
export const speechAPI = {
  /**
   * convertSpeechToText
   * --------------------------------------------------------------------------
   * Converts recorded audio into text via backend STT service.
   *
   * @param {Blob} audioBlob - Recorded audio data
   * @returns {Promise<any>} Parsed STT result
   */
  convertSpeechToText: async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await fetch(`${API_BASE_URL}/speech-to-text`, {
      method: 'POST',
      body: formData,
    });

    return response.json();
  },
};

/* ============================================================================
 * USER API
 * ============================================================================
 */
export const userAPI = {
  /** Retrieve authenticated user profile */
  getCurrentUser: () => fetchAPI('/me'),
};

/* ============================================================================
 * STORY BANK API
 * ============================================================================
 */
export const storyBankAPI = {
  /** Save a behavioral story / example for future use */
  saveStory: (storyData) =>
    fetchAPI('/story-bank', {
      method: 'POST',
      body: JSON.stringify(storyData),
    }),
};

/* ============================================================================
 * DASHBOARD API
 * ============================================================================
 */
export const dashboardAPI = {
  /**
   * getReadinessTrend
   * --------------------------------------------------------------------------
   * Fetch readiness score trend over a specified date window.
   */
  getReadinessTrend: (from, to) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const query = params.toString();
    const endpoint = query
      ? `/dashboard/readiness-trend?${query}`
      : '/dashboard/readiness-trend';

    return fetchAPI(endpoint);
  },

  /**
   * getTypeRadar
   * --------------------------------------------------------------------------
   * Fetch radar visualization data grouped by interview type.
   *
   * @param {string} window - e.g. "90d", "30d", etc.
   */
  getTypeRadar: (window = '90d') =>
    fetchAPI(`/dashboard/type-radar?window=${window}`),
};

/** Unified default export for external imports */
export default {
  interview: interviewAPI,
  speech: speechAPI,
  user: userAPI,
  storyBank: storyBankAPI,
  dashboard: dashboardAPI,
};
