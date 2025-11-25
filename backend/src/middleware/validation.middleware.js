/**
 * @fileoverview Validation middleware for Express routes.
 * Provides request validation, header validation, and parameter validation.
 * @module middleware/validation
 */

import { ApiError } from '../types/index.js'
import { asyncHandler } from './error.middleware.js'
import {
  INTERVIEW_TYPES,
  PAGINATION,
  QUESTION_CONSTANTS
} from '../types/index.js'

// Re-export asyncHandler for convenience
export { asyncHandler }

/**
 * Validation middleware factory.
 * Creates validation middleware based on provided Joi schema.
 * Validates request body and replaces it with sanitized data.
 * @param {import('joi').ObjectSchema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 * @example
 * const schema = Joi.object({
 *   name: Joi.string().required(),
 *   email: Joi.string().email().required()
 * })
 * router.post('/users', validate(schema), handler)
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      })

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }))

        throw new ApiError({
          statusCode: 400,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details
        })
      }

      // Replace req.body with validated and sanitized data
      req.body = value
      next()
    } catch (err) {
      next(err)
    }
  }
}

/**
 * Validates that required HTTP headers are present in the request.
 * @param {string[]} requiredHeaders - Array of required header names
 * @returns {Function} Express middleware function
 * @example
 * router.get('/protected', validateHeaders(['authorization', 'x-user-id']), handler)
 */
export const validateHeaders = (requiredHeaders = []) => {
  return (req, res, next) => {
    try {
      const missingHeaders = []

      for (const header of requiredHeaders) {
        const headerValue = req.headers[header.toLowerCase()]
        if (!headerValue || (typeof headerValue === 'string' && headerValue.trim() === '')) {
          missingHeaders.push(header)
        }
      }

      if (missingHeaders.length > 0) {
        throw new ApiError({
          statusCode: 400,
          message: `Missing required headers: ${missingHeaders.join(', ')}`,
          code: 'MISSING_HEADERS',
          details: { missingHeaders }
        })
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}

/**
 * Validates and extracts user ID from 'x-user-id' header.
 * Attaches validated userId to req.userId for use in route handlers.
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @throws {ApiError} If user ID is missing or invalid
 */
export const validateUserId = (req, res, next) => {
  try {
    const userId = req.headers['x-user-id']

    if (!userId) {
      throw new ApiError({
        statusCode: 400,
        message: 'User ID is required in x-user-id header',
        code: 'MISSING_USER_ID'
      })
    }

    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new ApiError({
        statusCode: 400,
        message: 'Invalid User ID format. User ID must be a non-empty string',
        code: 'INVALID_USER_ID'
      })
    }

    // Attach validated userId to request object
    req.userId = userId.trim()
    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Validates and extracts Bearer token from Authorization header.
 * Attaches validated token to req.token for use in route handlers.
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @throws {ApiError} If authorization header is missing or invalid
 */
export const validateAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      throw new ApiError({
        statusCode: 401,
        message: 'Authorization header is required',
        code: 'MISSING_AUTH_HEADER'
      })
    }

    const BEARER_PREFIX = 'Bearer '
    if (!authHeader.startsWith(BEARER_PREFIX)) {
      throw new ApiError({
        statusCode: 401,
        message: 'Authorization header must be Bearer token',
        code: 'INVALID_AUTH_FORMAT'
      })
    }

    const token = authHeader.substring(BEARER_PREFIX.length)
    if (!token || token.trim().length === 0) {
      throw new ApiError({
        statusCode: 401,
        message: 'Bearer token is required',
        code: 'MISSING_TOKEN'
      })
    }

    // Attach token to request object
    req.token = token.trim()
    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Validates and normalizes pagination query parameters.
 * Attaches validated pagination object to req.pagination.
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @throws {ApiError} If pagination parameters are invalid
 */
export const validatePagination = (req, res, next) => {
  try {
    const { page, size } = req.query

    // Use defaults if not provided, otherwise parse
    const pageNum = page === undefined || page === ''
      ? PAGINATION.DEFAULT_PAGE
      : parseInt(page, 10)
    const sizeNum = size === undefined || size === ''
      ? PAGINATION.DEFAULT_SIZE
      : parseInt(size, 10)

    // Validate parsed values - throw error if explicitly provided but invalid
    if (isNaN(pageNum) || pageNum < PAGINATION.MIN_SIZE) {
      throw new ApiError({
        statusCode: 400,
        message: `Page must be a positive integer (minimum: ${PAGINATION.MIN_SIZE})`,
        code: 'INVALID_PAGE'
      })
    }

    if (isNaN(sizeNum) || sizeNum < PAGINATION.MIN_SIZE || sizeNum > PAGINATION.MAX_SIZE) {
      throw new ApiError({
        statusCode: 400,
        message: `Size must be between ${PAGINATION.MIN_SIZE} and ${PAGINATION.MAX_SIZE}`,
        code: 'INVALID_SIZE'
      })
    }

    // Attach validated pagination to request object
    req.pagination = { page: pageNum, size: sizeNum }
    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Validates interview type in request body.
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @throws {ApiError} If interview type is missing or invalid
 */
export const validateInterviewType = (req, res, next) => {
  try {
    const { type } = req.body
    const validTypes = Object.values(INTERVIEW_TYPES)

    if (!type) {
      throw new ApiError({
        statusCode: 400,
        message: 'Interview type is required',
        code: 'MISSING_INTERVIEW_TYPE'
      })
    }

    if (!validTypes.includes(type)) {
      throw new ApiError({
        statusCode: 400,
        message: `Invalid interview type. Must be one of: ${validTypes.join(', ')}`,
        code: 'INVALID_INTERVIEW_TYPE',
        details: { validTypes }
      })
    }

    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Validates question count in request body.
 * Updates req.body.count with validated integer value.
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @throws {ApiError} If question count is invalid
 */
export const validateQuestionCount = (req, res, next) => {
  try {
    const { count = QUESTION_CONSTANTS.DEFAULT_COUNT } = req.body
    const questionCount = parseInt(count, 10)

    if (isNaN(questionCount) || questionCount < QUESTION_CONSTANTS.MIN_COUNT || questionCount > QUESTION_CONSTANTS.MAX_COUNT) {
      throw new ApiError({
        statusCode: 400,
        message: `Question count must be a number between ${QUESTION_CONSTANTS.MIN_COUNT} and ${QUESTION_CONSTANTS.MAX_COUNT}`,
        code: 'INVALID_QUESTION_COUNT',
        details: {
          min: QUESTION_CONSTANTS.MIN_COUNT,
          max: QUESTION_CONSTANTS.MAX_COUNT,
          default: QUESTION_CONSTANTS.DEFAULT_COUNT
        }
      })
    }

    // Update req.body with validated count
    req.body.count = questionCount
    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Validates S3 file key format for security.
 * Prevents path traversal attacks and invalid key formats.
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @throws {ApiError} If file key is missing or invalid
 */
export const validateFileKey = (req, res, next) => {
  try {
    const { key } = req.body || req.params

    if (!key) {
      throw new ApiError({
        statusCode: 400,
        message: 'File key is required',
        code: 'MISSING_FILE_KEY'
      })
    }

    // Basic security checks to prevent path traversal
    if (key.includes('..') || key.startsWith('/') || key.includes('//')) {
      throw new ApiError({
        statusCode: 400,
        message: 'Invalid key format. Key must not contain path traversal sequences or leading slashes',
        code: 'INVALID_FILE_KEY'
      })
    }

    // Ensure key is not empty after trimming
    if (key.trim().length === 0) {
      throw new ApiError({
        statusCode: 400,
        message: 'File key cannot be empty',
        code: 'INVALID_FILE_KEY'
      })
    }

    next()
  } catch (err) {
    next(err)
  }
}
