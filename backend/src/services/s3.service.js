/**
 * @fileoverview AWS S3 service for audio file storage and management.
 * Handles audio file uploads, signed URL generation, and file operations.
 * @module services/s3
 */

import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { config } from '../config/index.js'
import { ApiError, S3_CONSTANTS, AUDIO_CONSTANTS } from '../types/index.js'

/**
 * Supported audio file extensions for validation.
 * @constant {string[]}
 * @readonly
 */
const AUDIO_EXTENSIONS = ['.webm', '.mp3', '.wav']

/**
 * Configure AWS S3 client with credentials from config.
 * @constant {S3Client}
 * @readonly
 */
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
  }
})

/**
 * S3Service class for managing audio files in AWS S3.
 * Provides methods for uploading, downloading, and managing audio files.
 * @class S3Service
 */
export class S3Service {
  /**
   * Creates an instance of S3Service.
   */
  constructor() {
    this.bucketName = config.aws.s3Bucket
  }

  /**
   * Validates that the S3 key is for an audio file.
   * @param {string} key - S3 object key
   * @throws {ApiError} If key is not for an audio file
   * @private
   */
  _validateAudioKey(key) {
    const isAudioPath = key.includes('/audio/')
    const hasAudioExtension = AUDIO_EXTENSIONS.some(ext => key.endsWith(ext))

    if (!isAudioPath && !hasAudioExtension) {
      throw new ApiError({
        message: 'S3 service is only for audio files. Use MongoDB for other data.',
        code: 'S3_AUDIO_ONLY_ERROR',
        statusCode: 400
      })
    }
  }

  /**
   * Generates a pre-signed URL for S3 operations (audio files only).
   * @param {string} key - S3 object key
   * @param {string} operation - Operation type: 'get' or 'put'
   * @param {string} [contentType] - Content type for PUT operations
   * @param {number} [expiresIn=S3_CONSTANTS.DEFAULT_EXPIRES_IN] - URL expiration time in seconds
   * @returns {Promise<string>} Pre-signed URL
   * @throws {ApiError} If key validation fails or URL generation fails
   */
  async generateSignedUrl(key, operation, contentType, expiresIn = S3_CONSTANTS.DEFAULT_EXPIRES_IN) {
    try {
      this._validateAudioKey(key)

      const command = operation === 'get'
        ? new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key
        })
        : new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          ContentType: contentType
        })

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })

      return signedUrl
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError({
        message: 'Failed to generate signed URL',
        code: 'S3_SIGNED_URL_ERROR',
        statusCode: 500,
        details: error.message
      })
    }
  }

  /**
   * Uploads an audio file to S3.
   * @param {string} key - S3 object key
   * @param {Buffer} buffer - Audio file buffer
   * @param {string} contentType - MIME type of the audio file
   * @param {Object} [metadata] - Optional metadata to attach to the object
   * @returns {Promise<string>} Public URL of the uploaded file
   * @throws {ApiError} If validation fails or upload fails
   */
  async uploadAudioFile(key, buffer, contentType, metadata) {
    try {
      this._validateAudioKey(key)

      // Validate content type
      if (!AUDIO_CONSTANTS.SUPPORTED_MIME_TYPES.includes(contentType)) {
        throw new ApiError({
          message: `Unsupported audio content type: ${contentType}`,
          code: 'INVALID_CONTENT_TYPE',
          statusCode: 400
        })
      }

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata
      })

      await s3Client.send(command)
      return `https://${this.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError({
        message: 'Failed to upload audio file to S3',
        code: 'S3_AUDIO_UPLOAD_ERROR',
        statusCode: 500,
        details: error.message
      })
    }
  }

  /**
   * Checks if an audio file exists in S3.
   * @param {string} key - S3 object key
   * @returns {Promise<boolean>} True if file exists, false otherwise
   * @throws {ApiError} If validation fails or check fails
   */
  async audioFileExists(key) {
    try {
      this._validateAudioKey(key)

      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      })

      await s3Client.send(command)
      return true
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      // S3 returns NotFound error when object doesn't exist
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false
      }
      throw new ApiError({
        message: 'Failed to check audio file existence',
        code: 'S3_HEAD_ERROR',
        statusCode: 500,
        details: error.message
      })
    }
  }

  /**
   * Deletes an audio file from S3.
   * @param {string} key - S3 object key
   * @returns {Promise<void>}
   * @throws {ApiError} If validation fails or deletion fails
   */
  async deleteAudioFile(key) {
    try {
      this._validateAudioKey(key)

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      })

      await s3Client.send(command)
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError({
        message: 'Failed to delete audio file from S3',
        code: 'S3_DELETE_ERROR',
        statusCode: 500,
        details: error.message
      })
    }
  }

  /**
   * Generates a canonical S3 key for an interview response audio file.
   * @param {string} userId - User identifier
   * @param {string} interviewId - Interview session identifier
   * @param {string} responseId - Response identifier
   * @returns {string} S3 object key
   */
  getAudioFileKey(userId, interviewId, responseId) {
    return `users/${userId}/interviews/${interviewId}/audio/${responseId}.webm`
  }
}

/**
 * Singleton instance of S3Service.
 * @constant {S3Service}
 */
export const s3Service = new S3Service()
