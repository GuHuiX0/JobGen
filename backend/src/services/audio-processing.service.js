/**
 * @fileoverview Audio processing service for handling interview voice responses.
 * Processes audio files: uploads to S3, transcribes using Whisper, and performs voice analysis.
 * @module services/audio-processing
 */

import { s3Service } from './s3.service.js'
import { whisperService } from './whisper.service.js'
import { ApiError, AUDIO_CONSTANTS, INPUT_MODES } from '../types/index.js'
import { execFile } from 'child_process'
import os from 'os'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Minimum audio file size to consider valid (bytes).
 * Files smaller than this are treated as empty/no speech.
 * @constant {number}
 * @readonly
 */
const MIN_AUDIO_SIZE = AUDIO_CONSTANTS.MIN_FILE_SIZE

/**
 * Python execution timeout for voice analysis (milliseconds).
 * @constant {number}
 * @readonly
 */
const VOICE_ANALYSIS_TIMEOUT = 30000

/**
 * Maximum buffer size for Python subprocess execution (10MB).
 * @constant {number}
 * @readonly
 */
const MAX_BUFFER_SIZE = 10 * 1024 * 1024

/**
 * AudioProcessingService class for processing interview voice responses.
 * Handles audio upload, transcription, and voice analysis.
 * @class AudioProcessingService
 */
export class AudioProcessingService {
  /**
   * Processes an audio response: uploads to S3, transcribes, and performs voice analysis.
   * @param {Object} audioResponse - Audio response data
   * @param {string} audioResponse.question_id - Question identifier
   * @param {string} audioResponse.audio_data - Base64-encoded audio data
   * @param {string} audioResponse.audio_mime_type - MIME type of the audio
   * @param {number} [audioResponse.elapsed_seconds] - Response duration in seconds
   * @param {string} userId - User identifier
   * @param {string} interviewId - Interview session identifier
   * @returns {Promise<Object>} Processed response with transcript and voice analysis
   * @throws {ApiError} If audio processing fails
   */
  async processAudioResponse(audioResponse, userId, interviewId) {
    try {
      const { question_id, audio_data, audio_mime_type, elapsed_seconds } = audioResponse;

      // For testing/development, skip S3 upload if using dummy AWS credentials
      const skipS3Upload = process.env.AWS_ACCESS_KEY_ID === 'dummy_key' || !process.env.AWS_ACCESS_KEY_ID;

      // Generate responseId for both cases
      const responseId = `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Validate audio file
      const audioBuffer = Buffer.from(audio_data, 'base64');

      // Special handling for minimal/empty audio files (when user didn't speak)
      if (audioBuffer.length < MIN_AUDIO_SIZE) {
        console.log('⚠️ Minimal audio file detected, treating as no speech')
        return {
          response_id: responseId,
          question_id,
          text: '[No speech detected - user may not have spoken during recording]',
          audio_s3_key: null, // No S3 upload for empty recordings
          audio_mime_type: audio_mime_type || AUDIO_CONSTANTS.DEFAULT_MIME_TYPE,
          transcript: '[No speech detected]',
          elapsed_seconds: elapsed_seconds || 0,
          input_mode: INPUT_MODES.VOICE,
          voice_analysis: {
            prosody_score: 0.0,
            fluency_score: 0.0,
            confidence_score: 0.0,
            prosody_feedback: 'No speech detected in the recording.',
            filler_words: { count: 0, words: [] },
            speaking_rate: { words_per_minute: 0, assessment: 'no speech' },
            pause_patterns: { total_pauses: 0, avg_pause_duration: 0 }
          }
        }
      }

      if (!whisperService.validateAudioFile(audio_mime_type, audioBuffer.length)) {
        throw new ApiError({
          message: `Invalid audio file format or size too large (max ${AUDIO_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB)`,
          code: 'INVALID_AUDIO_FILE',
          statusCode: 400
        })
      }

      let transcript;
      let s3Key = null;
      if (skipS3Upload) {
        // Skip S3 upload for testing - just transcribe directly
        console.log('⚠️ Skipping S3 upload for testing - using direct transcription');
        transcript = await whisperService.transcribeAudioFromBuffer(
          audioBuffer,
          `test_${question_id}.wav`,
          audio_mime_type
        );
      } else {
        // Generate S3 key for the audio file
        s3Key = s3Service.getAudioFileKey(userId, interviewId, responseId);
        // Upload audio to S3
        await s3Service.uploadAudioFile(
          s3Key,
          audioBuffer,
          audio_mime_type,
          {
            userId,
            interviewId,
            questionId: question_id,
            responseId,
            uploadedAt: new Date().toISOString()
          }
        );
        // Transcribe audio using Whisper API
        transcript = await whisperService.transcribeAudioFromBuffer(
          audioBuffer,
          `${responseId}.webm`,
          audio_mime_type
        );
      }
      // Voice analysis via Python (skip for testing if S3 upload was skipped)
      let voiceAnalysis;
      if (skipS3Upload) {
        console.log('⚠️ Skipping voice analysis for testing - using mock analysis');
        voiceAnalysis = {
          prosody_score: 0.85,
          fluency_score: 0.82,
          confidence_score: 0.88,
          prosody_feedback: "Your speech delivery was clear and well-paced, with good intonation patterns.",
          filler_words: { count: 1, words: ["um"] },
          speaking_rate: { words_per_minute: 150, assessment: "good" },
          pause_patterns: { total_pauses: 3, avg_pause_duration: 0.8 }
        };
      } else {
        // Write audio to a temp file for the Python script
        const tempAudioPath = path.join(os.tmpdir(), `${responseId}.webm`);
        await fs.writeFile(tempAudioPath, audioBuffer);
        // Voice analysis via Python (cleanup temp always attempted)
        try {
          voiceAnalysis = await this.runVoiceAnalysis(tempAudioPath, transcript);
        } finally {
          try { await fs.unlink(tempAudioPath); } catch (e) {}
        }
      }

      return {
        response_id: responseId,
        question_id,
        text: transcript,
        audio_s3_key: s3Key,
        audio_mime_type: audio_mime_type || AUDIO_CONSTANTS.DEFAULT_MIME_TYPE,
        transcript,
        elapsed_seconds: elapsed_seconds || 0,
        input_mode: INPUT_MODES.VOICE,
        voice_analysis: voiceAnalysis
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError({
        message: 'Failed to process audio response',
        code: 'AUDIO_PROCESSING_ERROR',
        statusCode: 500,
        details: error.message
      });
    }
  }

  /**
   * Processes a text response (simple passthrough with validation).
   * @param {Object} textResponse - Text response data
   * @param {string} textResponse.question_id - Question identifier
   * @param {string} textResponse.text - Response text
   * @param {number} [textResponse.elapsed_seconds] - Response duration in seconds
   * @returns {Object} Processed text response
   */
  processTextResponse(textResponse) {
    return {
      question_id: textResponse.question_id,
      text: textResponse.text,
      elapsed_seconds: textResponse.elapsed_seconds || 0,
      input_mode: INPUT_MODES.TEXT
    }
  }

  /**
   * Validates and processes a single response (audio or text).
   * Automatically determines response type and routes to appropriate processor.
   * @param {Object} response - Response to process
   * @param {string} response.question_id - Question identifier (required)
   * @param {string} [response.text] - Text response content
   * @param {string} [response.audio_data] - Base64-encoded audio data
   * @param {string} [response.audio_mime_type] - MIME type of audio
   * @param {string} [response.input_mode] - Input mode: 'text' or 'voice'
   * @param {string} userId - User identifier
   * @param {string} interviewId - Interview session identifier
   * @returns {Promise<Object>} Processed response
   * @throws {ApiError} If response validation fails or processing fails
   */
  async processResponse(response, userId, interviewId) {
    const { question_id, text, audio_data, audio_mime_type, input_mode } = response

    // Validate response has required fields
    if (!question_id) {
      throw new ApiError({
        message: 'Question ID is required for all responses',
        code: 'MISSING_QUESTION_ID',
        statusCode: 400
      })
    }

    // Determine response type and process accordingly
    const hasAudio = audio_data && audio_mime_type
    const hasText = text && text.trim().length > 0
    const isVoiceMode = input_mode === INPUT_MODES.VOICE

    if (hasAudio || (isVoiceMode && hasAudio)) {
      // Has audio data - process as audio response
      return this.processAudioResponse(response, userId, interviewId)
    } else if (hasText) {
      // Text-only response
      return this.processTextResponse(response)
    } else {
      // Invalid response format
      throw new ApiError({
        message: 'Response must contain either text or valid audio data',
        code: 'INVALID_RESPONSE_FORMAT',
        statusCode: 400,
        details: {
          hasText,
          hasAudio,
          inputMode: input_mode
        }
      })
    }
  }
}

/**
 * Runs voice analysis on audio file using Python analyzer module.
 * @param {string} tempAudioPath - Path to temporary audio file
 * @param {string} transcript - Transcribed text from audio
 * @returns {Promise<Object>} Voice analysis results
 * @private
 */
AudioProcessingService.prototype.runVoiceAnalysis = async function (tempAudioPath, transcript) {
  // Prefer explicit env vars, fall back to system python (python3 on Unix, python on Win)
  const pythonPath =
    process.env.VOICE_ANALYSIS_PYTHON ||
    process.env.PYTHON_PATH ||
    process.env.PYTHON ||
    (process.platform === 'win32' ? 'python' : 'python3')

  // Run analyzer as a module so that its relative imports (e.g. `.audio_features`) work
  const projectRoot = path.join(__dirname, '..', '..', '..')
  let voiceAnalysis = null

  try {
    const execArgs = [
      '-m',
      'voice_analysis.analyzer',
      '--audio_path', tempAudioPath,
      '--transcript', transcript
    ]

    const result = await new Promise((resolve, reject) => {
      execFile(
        pythonPath,
        execArgs,
        { cwd: projectRoot, maxBuffer: MAX_BUFFER_SIZE },
        (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Voice analysis CLI failed:', stderr)
            return reject(error)
          }
          resolve(stdout)
        }
      )
    })

    voiceAnalysis = JSON.parse(result)
  } catch (err) {
    console.error('❌ Voice analysis integration failed:', err)
    // Return fallback analysis instead of failing completely
    voiceAnalysis = {
      warning: 'Voice analysis failed or unavailable',
      prosody_score: 0.5,
      fluency_score: 0.5,
      confidence_score: 0.5
    }
  }

  return voiceAnalysis
}

/**
 * Singleton instance of AudioProcessingService.
 * @constant {AudioProcessingService}
 */
export const audioProcessingService = new AudioProcessingService()
