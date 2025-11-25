/**
 * @fileoverview Unit tests for validation middleware.
 * Tests data validation, error handling, and edge cases.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { ApiError } from '../../src/types/index.js'
import {
  validateUserId,
  validateAuth,
  validatePagination,
  validateInterviewType,
  validateQuestionCount,
  validateFileKey
} from '../../src/middleware/validation.middleware.js'

describe('Validation Middleware', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      headers: {},
      body: {},
      params: {},
      query: {}
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
    next = jest.fn()
  })

  describe('validateUserId', () => {
    it('should pass validation with valid user ID', () => {
      req.headers['x-user-id'] = 'user123'
      validateUserId(req, res, next)
      expect(req.userId).toBe('user123')
      expect(next).toHaveBeenCalledWith()
    })

    it('should reject missing user ID', () => {
      validateUserId(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
      const error = next.mock.calls[0][0]
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('MISSING_USER_ID')
    })

    it('should reject empty user ID', () => {
      req.headers['x-user-id'] = '   '
      validateUserId(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
      const error = next.mock.calls[0][0]
      expect(error.code).toBe('INVALID_USER_ID')
    })

    it('should trim whitespace from user ID', () => {
      req.headers['x-user-id'] = '  user123  '
      validateUserId(req, res, next)
      expect(req.userId).toBe('user123')
    })
  })

  describe('validateAuth', () => {
    it('should pass validation with valid Bearer token', () => {
      req.headers.authorization = 'Bearer valid_token_123'
      validateAuth(req, res, next)
      expect(req.token).toBe('valid_token_123')
      expect(next).toHaveBeenCalledWith()
    })

    it('should reject missing authorization header', () => {
      validateAuth(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
      const error = next.mock.calls[0][0]
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('MISSING_AUTH_HEADER')
    })

    it('should reject non-Bearer token format', () => {
      req.headers.authorization = 'Basic token123'
      validateAuth(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
      const error = next.mock.calls[0][0]
      expect(error.code).toBe('INVALID_AUTH_FORMAT')
    })

    it('should reject empty Bearer token', () => {
      req.headers.authorization = 'Bearer '
      validateAuth(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
      const error = next.mock.calls[0][0]
      expect(error.code).toBe('MISSING_TOKEN')
    })
  })

  describe('validatePagination', () => {
    it('should use default values when pagination not provided', () => {
      validatePagination(req, res, next)
      expect(req.pagination).toEqual({ page: 1, size: 20 })
      expect(next).toHaveBeenCalledWith()
    })

    it('should validate and parse valid pagination parameters', () => {
      req.query = { page: '2', size: '10' }
      validatePagination(req, res, next)
      expect(req.pagination).toEqual({ page: 2, size: 10 })
    })

    it('should reject invalid page number', () => {
      req.query = { page: '0' }
      validatePagination(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
      const error = next.mock.calls[0][0]
      expect(error.code).toBe('INVALID_PAGE')
    })

    it('should reject page size exceeding maximum', () => {
      req.query = { size: '101' }
      validatePagination(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
      const error = next.mock.calls[0][0]
      expect(error.code).toBe('INVALID_SIZE')
    })

    it('should reject negative page size', () => {
      req.query = { size: '-1' }
      validatePagination(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
    })

    it('should handle empty string as default', () => {
      req.query = { page: '', size: '' }
      validatePagination(req, res, next)
      expect(req.pagination).toEqual({ page: 1, size: 20 })
    })
  })

  describe('validateInterviewType', () => {
    it('should pass validation with valid interview type', () => {
      req.body.type = 'behavioral'
      validateInterviewType(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('should reject missing interview type', () => {
      validateInterviewType(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
      const error = next.mock.calls[0][0]
      expect(error.code).toBe('MISSING_INTERVIEW_TYPE')
    })

    it('should reject invalid interview type', () => {
      req.body.type = 'invalid_type'
      validateInterviewType(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
      const error = next.mock.calls[0][0]
      expect(error.code).toBe('INVALID_INTERVIEW_TYPE')
    })

    it('should accept all valid interview types', () => {
      const validTypes = ['behavioral', 'technical', 'psychometric']
      validTypes.forEach(type => {
        req.body.type = type
        next.mockClear()
        validateInterviewType(req, res, next)
        expect(next).toHaveBeenCalledWith()
      })
    })
  })

  describe('validateQuestionCount', () => {
    it('should use default count when not provided', () => {
      validateQuestionCount(req, res, next)
      expect(req.body.count).toBe(5)
      expect(next).toHaveBeenCalledWith()
    })

    it('should validate and set valid question count', () => {
      req.body.count = 7
      validateQuestionCount(req, res, next)
      expect(req.body.count).toBe(7)
    })

    it('should reject count below minimum', () => {
      req.body.count = 0
      validateQuestionCount(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
      const error = next.mock.calls[0][0]
      expect(error.code).toBe('INVALID_QUESTION_COUNT')
    })

    it('should reject count above maximum', () => {
      req.body.count = 11
      validateQuestionCount(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
    })

    it('should reject non-numeric count', () => {
      req.body.count = 'not_a_number'
      validateQuestionCount(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
    })
  })

  describe('validateFileKey', () => {
    it('should pass validation with valid file key', () => {
      req.body.key = 'users/user123/interviews/int1/audio/file.webm'
      validateFileKey(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('should reject missing file key', () => {
      validateFileKey(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
      const error = next.mock.calls[0][0]
      expect(error.code).toBe('MISSING_FILE_KEY')
    })

    it('should reject path traversal attempts', () => {
      req.body.key = '../../../etc/passwd'
      validateFileKey(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
      const error = next.mock.calls[0][0]
      expect(error.code).toBe('INVALID_FILE_KEY')
    })

    it('should reject keys starting with slash', () => {
      req.body.key = '/absolute/path'
      validateFileKey(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
    })

    it('should reject keys with double slashes', () => {
      req.body.key = 'path//with//slashes'
      validateFileKey(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ApiError))
    })

    it('should check params if body key not found', () => {
      req.body = null
      req.params.key = 'valid_key.webm'
      validateFileKey(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })
  })
})

