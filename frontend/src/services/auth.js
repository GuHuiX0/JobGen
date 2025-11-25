// ============================================================================
// JobGen Authentication & Session Service
// ----------------------------------------------------------------------------
// Provides helpers for interacting with JobGen’s authentication workflow and
// maintaining local client-side session state.
//
// Core Responsibilities:
//   • Exchange Google JWT → JobGen JWT
//   • Fetch user interview-prep metadata from JobGen API
//   • Persist JWT, email, and user_id to localStorage
//   • Provide login, logout, session inspection utilities
// ============================================================================

const JOBGEN_API_URL = 'https://jobgen.ai/version-test/api/1.1/wf';

/**
 * fetchUserInterviewPrepData
 * ----------------------------------------------------------------------------
 * Fetches resume/job-context metadata used for personalized interview
 * generation. Requires a valid JobGen-issued JWT obtained from Google token
 * verification.
 *
 * Response shape (expected from JobGen backend):
 *   {
 *     status: "success",
 *     response: {
 *       status: "200",
 *       user_id: "...",
 *       resume_extract: "...",
 *       job_description: "..."
 *     }
 *   }
 *
 * @param {string} jobgenJwt - Valid JWT from JobGen token verification.
 * @returns {Promise<{ user_id: string, resume_extract: string, job_description: string }>}
 * @throws {Error} On invalid JWT, missing user, or unexpected API response.
 */
async function fetchUserInterviewPrepData(jobgenJwt) {
    try {
        const response = await fetch(`${JOBGEN_API_URL}/jobgen_interview_prep`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jobgenJwt}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) throw new Error('Invalid or expired JWT');
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status === 'success' && data.response) {
            const r = data.response;

            if (r.status === '200' && r.message === 'User not found')
                throw new Error('User not found');

            if (r.status === '200' && r.user_id) {
                return {
                    user_id: r.user_id,
                    resume_extract: r.resume_extract || '',
                    job_description: r.job_description || '',
                };
            }
        }

        throw new Error('Unexpected response from JobGen Interview Prep API');

    } catch (err) {
        console.error('Fetch user prep error:', err);
        throw err;
    }
}

/**
 * loginWithGoogle
 * ----------------------------------------------------------------------------
 * Main authentication pipeline:
 *   1. POST Google JWT → JobGen API to obtain a JobGen JWT
 *   2. Fetch extended interview-prep user metadata
 *   3. Persist the JobGen JWT, email, and user_id into localStorage
 *
 * Fallback behavior:
 *   - If interview-prep fetch fails, generate a synthetic user_id based on email
 *
 * @param {string} email - User's email from Google sign-in
 * @param {string} googleJwt - JWT returned by Google identity services
 * @returns {Promise<{ jwt: string, email: string, user_id: string }>}
 * @throws {Error} On token verification or session setup failure
 */
export async function loginWithGoogle(email, googleJwt) {
    try {
        // 1. Exchange Google JWT → JobGen JWT
        const response = await fetch(`${JOBGEN_API_URL}/jobgen_token_verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, google_jwt: googleJwt }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const jobgenJwt =
            data?.response?.jwt_token ||
            data?.Response?.jwt_token || // API sometimes capitalizes keys
            data?.jwt_token ||
            null;

        if (!jobgenJwt) throw new Error('JobGen JWT missing in API response');

        // 2. Fetch extended interview-prep profile
        let userId = null;
        try {
            const prep = await fetchUserInterviewPrepData(jobgenJwt);
            userId = prep.user_id;
        } catch (err) {
            console.warn('Prep data fetch failed:', err?.message);
            userId = 'usr_' + email.split('@')[0];
        }

        // 3. Persist session values
        localStorage.setItem('jobgen_jwt', jobgenJwt);
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_id', userId);

        return { jwt: jobgenJwt, email, user_id: userId };

    } catch (err) {
        console.error('Login error:', err);
        throw err;
    }
}

/**
 * getMe
 * ----------------------------------------------------------------------------
 * Retrieves the currently authenticated user session from localStorage.
 * No API calls are performed.
 *
 * @returns {Promise<{
 *   user_id: string,
 *   name: string,
 *   email: string,
 *   jwt: string,
 *   has_master_resume: boolean
 * } | null>}
 */
export async function getMe() {
    const jwt = localStorage.getItem('jobgen_jwt');
    const email = localStorage.getItem('user_email');
    const userId = localStorage.getItem('user_id');

    if (!jwt || !email) return null;

    return {
        user_id: userId || 'usr_' + email.split('@')[0],
        name: email.split('@')[0],
        email,
        jwt,
        has_master_resume: true, // placeholder: real API may extend this later
    };
}

/**
 * logout
 * ----------------------------------------------------------------------------
 * Clears all locally stored session values associated with JobGen login.
 */
export async function logout() {
    localStorage.removeItem('jobgen_jwt');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
}

/**
 * isLoggedIn
 * ----------------------------------------------------------------------------
 * Quick local check to determine if the user appears authenticated.
 *
 * @returns {boolean}
 */
export function isLoggedIn() {
    return !!(
        localStorage.getItem('jobgen_jwt') &&
        localStorage.getItem('user_email')
    );
}

/**
 * getJobGenJwt
 * ----------------------------------------------------------------------------
 * @returns {string | null} Stored JobGen JWT
 */
export function getJobGenJwt() {
    return localStorage.getItem('jobgen_jwt');
}

/**
 * getUserId
 * ----------------------------------------------------------------------------
 * @returns {string | null} Stored JobGen user ID
 */
export function getUserId() {
    return localStorage.getItem('user_id');
}
