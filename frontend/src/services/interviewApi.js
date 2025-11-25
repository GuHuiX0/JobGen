/**
 * ============================================================================
 * Mock Interview Utilities
 * ----------------------------------------------------------------------------
 * Helpers used for simulating backend interview creation in mock or
 * development environments. These utilities mirror the expected backend
 * response shape to ensure compatibility with real API integration later.
 * ============================================================================
 */

/**
 * sleep
 * ---------------------------------------------------------------------------
 * Promise-based delay helper used to simulate network latency.
 *
 * @param {number} ms - Duration to wait in milliseconds (default: 500ms)
 * @returns {Promise<void>}
 */
function sleep(ms = 500) {
    return new Promise((res) => setTimeout(res, ms));
}

/**
 * genInterviewId
 * ---------------------------------------------------------------------------
 * Generates a lightweight, pseudo-random interview session ID.
 *
 * Format:
 *   ivw_<last-5-digits-of-timestamp><4-char-random-string>
 *
 * Example:
 *   ivw_12345ab9d
 *
 * Used only in mock mode to emulate backend-issued IDs.
 *
 * @returns {string} Generated interview session ID
 */
function genInterviewId() {
    const ts = Date.now().toString().slice(-5);
    const rnd = Math.random().toString(36).slice(2, 6);
    return `ivw_${ts}${rnd}`;
}

/**
 * Supported static interview categories.
 * No backend request required.
 */
export const INTERVIEW_TYPES = ['behavioral', 'technical', 'psychometric'];

/**
 * createInterview
 * ---------------------------------------------------------------------------
 * Creates a mock interview session object, simulating a backend POST request.
 * Performs lightweight validation, waits for an artificial delay, generates
 * a session ID, and returns an object matching the real backend response shape.
 *
 * Parameters:
 * - payload.type (required)
 * - payload.question_count (optional)
 * - payload.job_name / job_description (optional job context)
 *
 * Stored Behavior:
 * - Saves the generated interview object to localStorage under "last_interview"
 *   for cross-page usage (best-effort; failure ignored)
 *
 * @param {Object} payload - Interview creation parameters
 * @returns {Promise<Object>} Backend-compatible mock interview object
 * @throws {Error} If required fields are missing
 */
export async function createInterview(payload) {
    if (!payload?.type) {
        const err = new Error('type is required');
        err.code = 'BAD_REQUEST';
        throw err;
    }

    await sleep(500);

    const interview_id = genInterviewId();

    const resp = {
        interview_id,
        type: payload.type,
        question_count: payload.question_count ?? 5,
        status: 'created',
        created_at: new Date().toISOString(),
        ...(payload.job_name || payload.job_description
            ? {
                job_context: {
                    job_name: payload.job_name || '',
                    job_description: payload.job_description || ''
                }
            }
            : {})
    };

    /** Cache the mock interview for optional cross-page retrieval */
    try {
        localStorage.setItem('last_interview', JSON.stringify(resp));
    } catch {}

    return resp;
}
