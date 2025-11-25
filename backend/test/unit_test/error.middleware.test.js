/**
 * @fileoverview Unit tests for error handling middleware.
 * Tests error handling patterns, error types, and error responses.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { ApiError } from '../../src/types/index.js'
import { errorHandler, notFoundHandler, asyncHandler } from '../../src/middleware/error.middleware.js'
import { config } from '../../src/config/index.js'

const originalNodeEnv = config.server.nodeEnv

describe('Error Handling Middleware', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      originalUrl: '/api/test',
      method: 'GET',
      body: {},
      headers: {}
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
    next = jest.fn()
    config.server.nodeEnv = originalNodeEnv
  })

  afterEach(() => {
    config.server.nodeEnv = originalNodeEnv
  })

  describe('errorHandler', () => {
    it('should handle ApiError instances correctly', () => {
      const error = new ApiError({
        message: 'Test error',
        code: 'TEST_ERROR',
        statusCode: 400
      })
      errorHandler(error, req, res, next)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Test error',
        code: 'TEST_ERROR'
      })
    })

    it('should include details in ApiError response', () => {
      const error = new ApiError({
        message: 'Test error',
        code: 'TEST_ERROR',
        statusCode: 400,
        details: { field: 'value' }
      })
      errorHandler(error, req, res, next)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: { field: 'value' }
        })
      )
    })

    it('should handle MongoDB errors', () => {
      const error = {
        name: 'MongoError',
        message: 'Database connection failed'
      }
      errorHandler(error, req, res, next)
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error occurred',
        code: 'DATABASE_ERROR'
      })
    })

    it('should handle validation errors (Joi)', () => {
      const error = {
        name: 'ValidationError',
        details: [
          {
            path: ['email'],
            message: 'Email is required',
            context: { value: null }
          }
        ]
      }
      errorHandler(error, req, res, next)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: [
          {
            field: 'email',
            message: 'Email is required',
            value: null
          }
        ]
      })
    })

    it('should handle JSON parsing errors', () => {
      const error = new SyntaxError('Unexpected token')
      error.status = 400
      error.body = {}
      errorHandler(error, req, res, next)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid JSON format',
        code: 'INVALID_JSON'
      })
    })

    it('should handle request timeout errors', () => {
      const error = { code: 'ETIMEDOUT' }
      errorHandler(error, req, res, next)
      expect(res.status).toHaveBeenCalledWith(408)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Request timeout',
        code: 'REQUEST_TIMEOUT'
      })
    })

    it('should handle file size limit errors', () => {
      const error = { code: 'LIMIT_FILE_SIZE' }
      errorHandler(error, req, res, next)
      expect(res.status).toHaveBeenCalledWith(413)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'File too large',
        code: 'FILE_TOO_LARGE'
      })
    })

    it('should handle connection errors', () => {
      const error = { code: 'ECONNREFUSED' }
      errorHandler(error, req, res, next)
      expect(res.status).toHaveBeenCalledWith(503)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      })
    })

    it('should handle unknown errors with 500 status', () => {
      const error = new Error('Unknown error')
      config.server.nodeEnv = 'production'
      errorHandler(error, req, res, next)
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR'
      })
    })

    it('should include stack trace in development mode', () => {
      const error = new Error('Test error')
      config.server.nodeEnv = 'development'
      errorHandler(error, req, res, next)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: expect.any(String)
        })
      )
    })
  })

  describe('notFoundHandler', () => {
    it('should create 404 ApiError for non-existent routes', () => {
      req.originalUrl = '/api/nonexistent'
      notFoundHandler(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
      const error = next.mock.calls[0][0]
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('ROUTE_NOT_FOUND')
      expect(error.message).toContain('/api/nonexistent')
    })
  })

  describe('asyncHandler', () => {
    it('should pass through successful async handlers', async () => {
      const handler = async (req, res, next) => {
        res.json({ success: true })
      }
      const wrapped = asyncHandler(handler)
      await wrapped(req, res, next)
      expect(res.json).toHaveBeenCalledWith({ success: true })
      expect(next).not.toHaveBeenCalled()
    })

    it('should catch and forward async errors', async () => {
      const handler = async (req, res, next) => {
        throw new Error('Async error')
      }
      const wrapped = asyncHandler(handler)
      await wrapped(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle synchronous errors', async () => {
      const handler = (req, res, next) => {
        throw new Error('Sync error')
      }
      const wrapped = asyncHandler(handler)
      await wrapped(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle promise rejections', async () => {
      const handler = async (req, res, next) => {
        return Promise.reject(new Error('Promise rejection'))
      }
      const wrapped = asyncHandler(handler)
      await wrapped(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })
  })
})

