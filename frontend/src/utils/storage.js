/**
 * ============================================================================
 * Local Storage Authentication Utilities
 * ----------------------------------------------------------------------------
 * Centralized helpers for persisting and retrieving authentication-related
 * values in localStorage. This avoids scattered storage access and ensures
 * consistent key usage across the application.
 *
 * Responsibilities:
 * - Store and retrieve:
 *     • Application-level token
 *     • User profile information
 *     • User ID
 *     • JobGen-issued JWT
 * - Provide safe JSON parsing for user profiles
 * - Simplify testing and maintenance through predictable behavior
 * ============================================================================
 */

/* ------------------------------------------
   Storage Key Definitions
   Centralized keys to avoid duplication.
------------------------------------------- */
const TOKEN_KEY = 'jobgen_token';
const USER_KEY = 'jobgen_user';
const USER_ID_KEY = 'user_id';
const JWT_KEY = 'jobgen_jwt';

/* ============================================================================
 * Token Handling
 * ----------------------------------------------------------------------------
 * Functions for storing, retrieving, and clearing the app-level auth token.
 * ========================================================================== */

/** Save the application token into localStorage. */
export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token);

/** Retrieve the stored application token, or null if missing. */
export const getToken = () => localStorage.getItem(TOKEN_KEY);

/** Remove the stored token from localStorage. */
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/* ============================================================================
 * User Profile Handling
 * ----------------------------------------------------------------------------
 * Functions for storing and safely parsing user profile objects.
 * ========================================================================== */

/** Save the user profile (stored as a JSON string). */
export const saveUser = (user) =>
  localStorage.setItem(USER_KEY, JSON.stringify(user));

/**
 * Retrieve the stored user profile.
 * Safely parses JSON; returns null if parsing fails or key is missing.
 */
export const getUserFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
};

/* ============================================================================
 * User ID Handling
 * ----------------------------------------------------------------------------
 * Functions for storing, retrieving, and clearing the user ID.
 * ========================================================================== */

/** Persist the current user ID. */
export const saveUserId = (userId) =>
  localStorage.setItem(USER_ID_KEY, userId);

/** Retrieve the stored user ID, or null if not present. */
export const getUserId = () => localStorage.getItem(USER_ID_KEY);

/** Clear the stored user ID. */
export const clearUserId = () => localStorage.removeItem(USER_ID_KEY);

/* ============================================================================
 * JWT Handling (JobGen-issued Tokens)
 * ----------------------------------------------------------------------------
 * Functions for managing JWT tokens provided by the JobGen backend.
 * ========================================================================== */

/** Save the JobGen-issued JWT. */
export const saveJwt = (jwt) => localStorage.setItem(JWT_KEY, jwt);

/** Retrieve the JobGen-issued JWT. */
export const getJwt = () => localStorage.getItem(JWT_KEY);

/** Clear the stored JWT. */
export const clearJwt = () => localStorage.removeItem(JWT_KEY);

/* ============================================================================
 * Clear All Auth Keys
 * ----------------------------------------------------------------------------
 * Removes all authentication-related data from localStorage.
 * Used on logout or session invalidation.
 * ========================================================================== */

/** Remove all authentication keys and related auxiliary values. */
export const clearAuth = () => {
  clearToken();
  clearUserId();
  clearJwt();
  localStorage.removeItem('user_email'); // stored independently
};
