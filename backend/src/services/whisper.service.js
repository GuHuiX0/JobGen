import OpenAI from 'openai'
import { config } from '../config/index.js'
import { ApiError } from '../types/index.js'
import axios from 'axios'

export class WhisperService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    })
  }

  /**
   * Transcribe audio from a URL using OpenAI Whisper API
   * @param {string} audioUrl - URL of the audio file to transcribe
   * @param {Object} options - Additional options for transcription
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribeAudioFromUrl(audioUrl, options = {}) {
    try {
      // Download audio file from URL
      const response = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        timeout: 30000 // 30 second timeout
      })

      const audioBuffer = Buffer.from(response.data)

      // Create a File-like object for OpenAI API
      const audioFile = new File([audioBuffer], 'audio.webm', {
        type: this._getContentTypeFromUrl(audioUrl)
      })

      // Call OpenAI Whisper API
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: options.model || 'whisper-1',
        language: options.language || 'en',
        response_format: 'text',
        temperature: options.temperature || 0
      })

      return transcription
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      // Handle specific OpenAI errors
      if (error.response?.status === 429) {
        throw new ApiError({
          message: 'OpenAI API rate limit exceeded',
          code: 'WHISPER_RATE_LIMIT_ERROR',
          statusCode: 429,
          details: error.response.data
        })
      }

      if (error.response?.status === 400) {
        throw new ApiError({
          message: 'Invalid audio file format or corrupted audio',
          code: 'WHISPER_INVALID_AUDIO_ERROR',
          statusCode: 400,
          details: error.response.data
        })
      }

      throw new ApiError({
        message: 'Failed to transcribe audio',
        code: 'WHISPER_TRANSCRIPTION_ERROR',
        statusCode: 500,
        details: error.message
      })
    }
  }

  /**
   * Transcribe audio from a buffer using OpenAI Whisper API
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {string} fileName - Name of the audio file
   * @param {string} mimeType - MIME type of the audio file
   * @param {Object} options - Additional options for transcription
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribeAudioFromBuffer(audioBuffer, fileName, mimeType, options = {}) {
    try {
      // For Node.js environment, we need to handle File differently
      // Create a Blob-like object that OpenAI SDK can handle
      const audioBlob = new Blob([audioBuffer], { type: mimeType });

      // Create a File-like object for OpenAI API (this works in Node.js with proper polyfill)
      // For testing/development, return mock transcription if OpenAI key is not available
      if (!config.openai.apiKey || config.openai.apiKey === 'your_openai_api_key_here') {
        console.log('⚠️ OpenAI API key not configured - using mock transcription for testing');
        return "I would approach system design by first understanding the requirements, considering scalability and security factors, then planning the architecture and implementation steps.";
      }

      // In Node.js, we need to use a different approach for File objects
      // Create a readable stream from the buffer
      const { Readable } = await import('stream');
      const audioStream = Readable.from(audioBuffer);

      // Create a FormData-like object for the request
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('file', audioStream, {
        filename: fileName,
        contentType: mimeType
      });
      formData.append('model', options.model || 'whisper-1');
      formData.append('language', options.language || 'en');
      formData.append('response_format', 'verbose_json'); // Use verbose_json to get word-level timestamps
      formData.append('timestamp_granularities[]', 'word'); // Request word-level timestamps
      // Add prompt to encourage including filler words (limited effect but worth trying)
      formData.append('prompt', 'um, uh, like, you know, so, well, I mean, actually, basically'); // Provide examples of filler words
      if (options.temperature !== undefined) {
        formData.append('temperature', options.temperature.toString());
      } else {
        formData.append('temperature', '0.2'); // Slightly higher temperature may help preserve natural speech
      }

      // Make direct HTTP request since OpenAI SDK has issues with Node.js File objects
      const axios = (await import('axios')).default;
      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          'Authorization': `Bearer ${config.openai.apiKey}`,
          ...formData.getHeaders()
        },
        timeout: 60000 // 60 second timeout for transcription
      });

      // Handle verbose_json response format
      if (response.data && typeof response.data === 'object') {
        // Log word-level data for debugging
        if (response.data.words) {
          console.log('📝 Word-level timestamps:', response.data.words.length, 'words');
          
          // Check for potential filler words in the response
          const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'well', 'i mean', 'actually', 'basically'];
          const detectedFillers = response.data.words.filter(w => 
            fillerWords.some(filler => w.word?.toLowerCase().includes(filler))
          );
          
          if (detectedFillers.length > 0) {
            console.log('✅ Detected filler words:', detectedFillers.map(w => w.word));
          } else {
            console.log('⚠️ No filler words detected in Whisper transcription');
          }
        }
        
        // Return the text content
        return response.data.text || '';
      }
      
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      // Handle specific OpenAI errors
      if (error.response?.status === 429) {
        throw new ApiError({
          message: 'OpenAI API rate limit exceeded',
          code: 'WHISPER_RATE_LIMIT_ERROR',
          statusCode: 429,
          details: error.response.data
        })
      }

      if (error.response?.status === 400) {
        throw new ApiError({
          message: 'Invalid audio file format or corrupted audio',
          code: 'WHISPER_INVALID_AUDIO_ERROR',
          statusCode: 400,
          details: error.response.data
        })
      }

      throw new ApiError({
        message: 'Failed to transcribe audio',
        code: 'WHISPER_TRANSCRIPTION_ERROR',
        statusCode: 500,
        details: error.message
      })
    }
  }

  /**
   * Get content type from URL or default to webm
   * @param {string} url - Audio file URL
   * @returns {string} - MIME type
   */
  _getContentTypeFromUrl(url) {
    if (url.includes('.mp3')) return 'audio/mpeg'
    if (url.includes('.wav')) return 'audio/wav'
    if (url.includes('.m4a')) return 'audio/mp4'
    if (url.includes('.ogg')) return 'audio/ogg'
    return 'audio/webm' // Default for webm files
  }

  /**
   * Validate audio file format and size
   * @param {string} mimeType - MIME type of the audio file
   * @param {number} size - Size of the audio file in bytes
   * @returns {boolean} - Whether the file is valid
   */
  validateAudioFile(mimeType, size) {
    const supportedTypes = [
      'audio/webm',
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'audio/ogg'
    ]

    const maxSize = 25 * 1024 * 1024 // 25MB limit for Whisper API

    return supportedTypes.includes(mimeType) && size <= maxSize
  }
}

// Export singleton instance
export const whisperService = new WhisperService()
