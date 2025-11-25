import { Router } from 'express'
import { s3Service } from '../services/s3.service.js'
import { ApiError } from '../types/index.js'
import { asyncHandler, validateFileKey, validateUserId } from '../middleware/validation.middleware.js'

const router = Router()

/**
 * POST /signed-url
 * Generate signed URL for S3 operations (audio files only)
 */
router.post('/', validateFileKey, asyncHandler(async (req, res) => {
  const { key, operation, contentType, expiresIn } = req.body

  // Validate request
  if (!operation) {
    throw new ApiError({
      message: 'Missing required field: operation',
      code: 'MISSING_OPERATION',
      statusCode: 400
    })
  }

  if (!['get', 'put'].includes(operation)) {
    throw new ApiError({
      message: 'Invalid operation. Must be "get" or "put"',
      code: 'INVALID_OPERATION',
      statusCode: 400
    })
  }

  // Validate that this is for audio files only
  if (
    !key.includes('/audio/') &&
    !key.endsWith('.webm') &&
    !key.endsWith('.mp3') &&
    !key.endsWith('.wav')
  ) {
    throw new ApiError({
      message: 'S3 service is now only for audio files. Use MongoDB for other data.',
      code: 'INVALID_FILE_TYPE',
      statusCode: 400
    })
  }

  // Generate signed URL
  const expiresInSeconds = expiresIn || 3600 // Default 1 hour
  const signedUrl = await s3Service.generateSignedUrl(
    key,
    operation,
    contentType,
    expiresInSeconds
  )

  // Calculate expiration time
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()

  const response = {
    signed_url: signedUrl,
    expires_at: expiresAt
  }

  res.status(200).json(response)
}))

/**
 * POST /signed-url/audio
 * Generate signed URL specifically for audio file upload
 */
router.post('/audio', validateUserId, asyncHandler(async (req, res) => {
  const userId = req.userId
  const { interview_id, response_id } = req.body

  if (!interview_id || !response_id) {
    throw new ApiError({
      message: 'Missing required fields: interview_id, response_id',
      code: 'MISSING_REQUIRED_FIELDS',
      statusCode: 400
    })
  }

  // Generate S3 key for audio file
  const key = s3Service.getAudioFileKey(userId, interview_id, response_id)

  // Generate signed URL for PUT operation (upload)
  const signedUrl = await s3Service.generateSignedUrl(
    key,
    'put',
    'audio/webm',
    3600 // 1 hour expiration
  )

  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()

  const response = {
    signed_url: signedUrl,
    expires_at: expiresAt,
    key
  }

  res.status(200).json(response)
}))

/**
 * GET /signed-url/:key
 * Generate signed URL for GET operation (download)
 */
router.get('/:key(*)', asyncHandler(async (req, res) => {
  const key = req.params.key
  const { expiresIn = 3600 } = req.query

  if (!key) {
    throw new ApiError({
      message: 'Key parameter is required',
      code: 'MISSING_KEY',
      statusCode: 400
    })
  }

  // Validate key format
  if (key.includes('..') || key.startsWith('/')) {
    throw new ApiError({
      message: 'Invalid key format',
      code: 'INVALID_KEY_FORMAT',
      statusCode: 400
    })
  }

  // Generate signed URL for GET operation
  const expiresInSeconds = parseInt(expiresIn, 10)
  const signedUrl = await s3Service.generateSignedUrl(key, 'get', undefined, expiresInSeconds)

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()

  const response = {
    signed_url: signedUrl,
    expires_at: expiresAt
  }

  res.json(response)
}))

/**
 * POST /signed-url/batch
 * Generate multiple signed URLs in one request
 */
router.post('/batch', async (req, res) => {
  try {
    const { urls } = req.body

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        message: 'urls array is required and must not be empty'
      })
    }

    if (urls.length > 10) {
      return res.status(400).json({
        message: 'Maximum 10 URLs can be requested at once'
      })
    }

    const results = await Promise.allSettled(
      urls.map(async (urlRequest) => {
        const { key, operation, contentType, expiresIn } = urlRequest

        if (!key || !operation) {
          throw new Error('Missing required fields: key, operation')
        }

        if (!['get', 'put'].includes(operation)) {
          throw new Error('Invalid operation. Must be "get" or "put"')
        }

        if (key.includes('..') || key.startsWith('/')) {
          throw new Error('Invalid key format')
        }

        const expiresInSeconds = expiresIn || 3600
        const signedUrl = await s3Service.generateSignedUrl(
          key,
          operation,
          contentType,
          expiresInSeconds
        )

        const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()

        return {
          key,
          signed_url: signedUrl,
          expires_at: expiresAt
        }
      })
    )

    const response = {
      results: results.map((result, index) => ({
        index,
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    }

    return res.status(200).json(response)
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        message: error.message,
        code: error.code
      })
    }
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
