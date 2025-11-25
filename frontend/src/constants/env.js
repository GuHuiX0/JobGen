// JobGen Auth Environment Config
// -----------------------------------------------------------------------------
// Centralized access to environment variables for OAuth and API integration.
// Note: CRA/webpack exposes variables via process.env.*, not import.meta.env.

export const CLIENT_ID =
  process.env.REACT_APP_JOBGEN_CLIENT_ID || 'demo_client_id';

export const JOBGEN_AUTH_URL =
  process.env.REACT_APP_JOBGEN_AUTH_URL || 'https://jobgen.ai';

export const API_BASE =
  process.env.REACT_APP_API_BASE || 'http://localhost:3001';

// OAuth redirect (JobGen → frontend)
export const REDIRECT_URI = `${window.location.origin}/login`;
