/**
 * @fileoverview Error handling middleware for Express application.
 * Provides centralized error handling and async route wrapper.
 * @module middleware/error
 */

import { ApiError } from '../types/index.js'
import { config } from '../config/index.js'

/**
 * Wraps async route handlers to automatically catch and forward errors to error middleware.
 * Prevents unhandled promise rejections in async route handlers.
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsers()
 *   res.json(users)
 * }))
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    try {
      return Promise.resolve(fn(req, res, next)).catch(next)
    } catch (error) {
      return next(error)
    }
  }
}

/**
 * Logs error information for debugging purposes.
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request object
 * @private
 */
function logError(err, req) {
  const errorInfo = {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  }

  // Only log sensitive data in development
  if (config.server.nodeEnv === 'development') {
    errorInfo.body = req.body
    errorInfo.headers = req.headers
  }

  console.error('❌ Error:', errorInfo)
}

/**
 * Centralized error handler middleware.
 * Formats all errors consistently and sends appropriate HTTP responses.
 * Must be registered as the last middleware in the Express app.
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  logError(err, req)

  // Handle custom ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.details && { details: err.details })
    })
  }

  // Handle MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(500).json({
      success: false,
      message: 'Database error occurred',
      code: 'DATABASE_ERROR',
      ...(config.server.nodeEnv === 'development' && { details: err.message })
    })
  }

  // Handle validation errors (Joi)
  if (err.name === 'ValidationError' && err.details) {
    const details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }))

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details
    })
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format',
      code: 'INVALID_JSON'
    })
  }

  // Handle request timeout errors
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
    return res.status(408).json({
      success: false,
      message: 'Request timeout',
      code: 'REQUEST_TIMEOUT'
    })
  }

  // Handle file size limit errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large',
      code: 'FILE_TOO_LARGE'
    })
  }

  // Handle connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      message: 'Service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    })
  }

  // Default server error handler
  const isProduction = config.server.nodeEnv === 'production'
  const message = isProduction
    ? 'Internal server error'
    : err.message

  res.status(500).json({
    success: false,
    message,
    code: 'INTERNAL_SERVER_ERROR',
    ...(!isProduction && { stack: err.stack })
  })
}

/**
 * 404 Not Found handler middleware.
 * Handles requests to non-existent routes.
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError({
    message: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
    statusCode: 404
  })
  next(error)
}