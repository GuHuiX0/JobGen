/**
 * ============================================================================
 * Global Application Configuration
 * ----------------------------------------------------------------------------
 * Centralized definition of environment-specific settings used throughout
 * the application. This helps prevent hard-coded values and ensures consistent
 * behavior across development, staging, and production environments.
 *
 * Responsibilities:
 * - Expose a unified API base URL
 * - Enable seamless environment switching via environment variables
 * ============================================================================
 */

export const CONFIG = {
  /**
   * API_BASE_URL
   * --------------------------------------------------------------------------
   * The base URL for backend API requests.
   *
   * - Primary source: process.env.REACT_APP_API_URL
   * - Fallback:       http://localhost:8081 (local development)
   *
   * This prevents scattering API endpoints around the codebase and makes the
   * application easier to configure for multiple environments.
   * --------------------------------------------------------------------------
   */
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8081',
};

export default CONFIG;
