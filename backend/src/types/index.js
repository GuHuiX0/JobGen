/**
 * @fileoverview Type definitions, constants, and utility functions for the AI Interview Coach backend.
 * @module types
 */

/**
 * S3 path helper functions for generating consistent S3 object keys.
 * @namespace S3Paths
 */
export const S3Paths = {
  /**
   * Generate S3 key for story JSON file.
   * @param {string} userId - User identifier
   * @param {string} storyId - Story identifier
   * @returns {string} S3 key path
   */
  story: (userId, storyId) => `users/${userId}/stories/${storyId}/story.json`,

  /**
   * Generate S3 key for interview response audio file.
   * @param {string} userId - User identifier
   * @param {string} interviewId - Interview session identifier
   * @param {string} responseId - Response identifier
   * @returns {string} S3 key path
   */
  audioFile: (userId, interviewId, responseId) =>
    `users/${userId}/interviews/${interviewId}/audio/${responseId}.webm`
}

/**
 * Custom API error class for consistent error handling across the application.
 * Extends the native Error class with additional properties for API responses.
 * @class ApiError
 * @extends {Error}
 */
export class ApiError extends Error {
  /**
   * Create an API error instance.
   * @param {Object} params - Error parameters
   * @param {string} params.message - Human-readable error message
   * @param {string} params.code - Machine-readable error code
   * @param {number} params.statusCode - HTTP status code
   * @param {*} [params.details] - Additional error details
   */
  constructor(params) {
    super(params.message)
    this.name = 'ApiError'
    this.code = params.code
    this.statusCode = params.statusCode
    this.details = params.details
  }
}

/**
 * Valid interview types supported by the system.
 * @constant {Object<string, string>}
 * @readonly
 */
export const INTERVIEW_TYPES = {
  /** Behavioral interview type */
  BEHAVIORAL: 'behavioral',
  /** Technical interview type */
  TECHNICAL: 'technical',
  /** Psychometric interview type */
  PSYCHOMETRIC: 'psychometric'
}

/**
 * Valid interview session status values.
 * @constant {Object<string, string>}
 * @readonly
 */
export const INTERVIEW_STATUS = {
  /** Interview session has been created */
  CREATED: 'created',
  /** Interview is currently in progress */
  IN_PROGRESS: 'in_progress',
  /** Interview responses have been submitted */
  SUBMITTED: 'submitted',
  /** Interview has been completed with feedback generated */
  COMPLETED: 'completed',
  /** Questions have been generated for the interview */
  QUESTIONS_GENERATED: 'questions_generated'
}

/**
 * Valid feedback generation status values.
 * @constant {Object<string, string>}
 * @readonly
 */
export const FEEDBACK_STATUS = {
  /** Feedback is currently being generated */
  PROCESSING: 'processing',
  /** Feedback has been generated and is ready */
  READY: 'ready'
}

/**
 * Input modes for interview responses.
 * @constant {Object<string, string>}
 * @readonly
 */
export const INPUT_MODES = {
  /** Text input mode */
  TEXT: 'text',
  /** Voice input mode */
  VOICE: 'voice'
}

/**
 * Audio file size and format constants.
 * @constant {Object}
 * @readonly
 */
export const AUDIO_CONSTANTS = {
  /** Maximum audio file size in bytes (25MB) */
  MAX_FILE_SIZE: 25 * 1024 * 1024,
  /** Minimum audio file size to consider valid (100 bytes) */
  MIN_FILE_SIZE: 100,
  /** Supported audio MIME types */
  SUPPORTED_MIME_TYPES: [
    'audio/webm',
    'audio/mp3',
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'audio/ogg'
  ],
  /** Default audio MIME type */
  DEFAULT_MIME_TYPE: 'audio/webm'
}

/**
 * Pagination constants.
 * @constant {Object}
 * @readonly
 */
export const PAGINATION = {
  /** Default page number */
  DEFAULT_PAGE: 1,
  /** Default page size */
  DEFAULT_SIZE: 20,
  /** Maximum page size */
  MAX_SIZE: 100,
  /** Minimum page size */
  MIN_SIZE: 1
}

/**
 * Question generation constants.
 * @constant {Object}
 * @readonly
 */
export const QUESTION_CONSTANTS = {
  /** Minimum number of questions */
  MIN_COUNT: 1,
  /** Maximum number of questions */
  MAX_COUNT: 10,
  /** Default number of questions */
  DEFAULT_COUNT: 5
}

/**
 * S3 signed URL expiration constants.
 * @constant {Object}
 * @readonly
 */
export const S3_CONSTANTS = {
  /** Default signed URL expiration time in seconds (1 hour) */
  DEFAULT_EXPIRES_IN: 3600,
  /** Short-lived signed URL expiration time in seconds (5 minutes) */
  SHORT_EXPIRES_IN: 300
}

/**
 * Validation schema definitions (for reference/documentation).
 * Note: Actual validation is performed using Joi schemas in middleware.
 * @constant {Object}
 * @readonly
 */
export const VALIDATION_SCHEMAS = {
  /** Create interview request schema */
  createInterview: {
    type: ['behavioral', 'technical', 'psychometric'],
    duration_seconds: 'number',
    question_count: 'number'
  },
  /** Submit responses request schema */
  submitResponses: {
    responses: 'array'
  },
  /** Story bank request schema */
  storyBank: {
    interview_id: 'string',
    question_id: 'string',
    response_id: 'string',
    title: 'string',
    transcript: 'string',
    tags: 'array'
  },
  /** Signed URL request schema */
  signedUrl: {
    key: 'string',
    operation: ['get', 'put'],
    contentType: 'string',
    expiresIn: 'number'
  }
}

// Legacy exports for backward compatibility
/** @deprecated Use VALIDATION_SCHEMAS.createInterview instead */
export const createInterviewSchema = VALIDATION_SCHEMAS.createInterview
/** @deprecated Use VALIDATION_SCHEMAS.submitResponses instead */
export const submitResponsesSchema = VALIDATION_SCHEMAS.submitResponses
/** @deprecated Use VALIDATION_SCHEMAS.storyBank instead */
export const storyBankSchema = VALIDATION_SCHEMAS.storyBank
/** @deprecated Use VALIDATION_SCHEMAS.signedUrl instead */
export const signedUrlSchema = VALIDATION_SCHEMAS.signedUrl
