import { mongoDBService } from './mongodb.service.js'
import { ApiError } from '../types/index.js'

export class ResponseValidationService {
  /**
   * Validate that each question in responses is unique for the interview
   * @param {Array} responses - Array of responses to validate
   * @param {string} interviewId - Interview ID
   * @param {string} userId - User ID
   * @returns {Promise<void>} - Throws error if validation fails
   */
  async validateUniqueQuestions(responses, interviewId, userId) {
    try {
      // Extract question IDs from current responses
      const currentQuestionIds = responses.map(r => r.question_id)

      // Get existing responses for this interview
      const existingResponses = await mongoDBService.getInterviewResponses(interviewId)
      
      if (existingResponses && existingResponses.length > 0) {
        // Extract existing question IDs
        const existingQuestionIds = existingResponses.map(r => r.question_id)
        
        // Check for conflicts with existing questions
        const conflictingQuestionIds = currentQuestionIds.filter(id => 
          existingQuestionIds.includes(id)
        )
        
        if (conflictingQuestionIds.length > 0) {
          throw new ApiError({
            message: `Questions already answered for this interview: ${conflictingQuestionIds.join(', ')}`,
            code: 'QUESTIONS_ALREADY_ANSWERED',
            statusCode: 409 // Conflict status code
          })
        }
      }

      console.log(`✅ Validated ${responses.length} unique questions for interview ${interviewId}`)
      
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      throw new ApiError({
        message: 'Failed to validate response questions',
        code: 'VALIDATION_ERROR',
        statusCode: 500,
        details: error.message
      })
    }
  }

  /**
   * Validate response format and required fields
   * @param {Array} responses - Array of responses to validate
   * @returns {void} - Throws error if validation fails
   */
  validateResponseFormat(responses) {
    if (!Array.isArray(responses) || responses.length === 0) {
      throw new ApiError({
        message: 'Responses array is required and cannot be empty',
        code: 'INVALID_RESPONSES_FORMAT',
        statusCode: 400
      })
    }

    // Check for duplicate question IDs within the current submission
    const questionIds = responses.map(r => r.question_id)
    const duplicateQuestionIds = questionIds.filter((id, index) => 
      questionIds.indexOf(id) !== index
    )
    
    if (duplicateQuestionIds.length > 0) {
      throw new ApiError({
        message: `Duplicate question IDs found in submission: ${duplicateQuestionIds.join(', ')}`,
        code: 'DUPLICATE_QUESTIONS_IN_SUBMISSION',
        statusCode: 400
      })
    }

    responses.forEach((response, index) => {
      // Check required fields
      if (!response.question_id) {
        throw new ApiError({
          message: `Question ID is required for response at index ${index}`,
          code: 'MISSING_QUESTION_ID',
          statusCode: 400
        })
      }

      // Check that response has either text or audio data
      const hasText = response.text && typeof response.text === 'string' && response.text.trim().length > 0
      const hasAudio = response.audio_data && response.audio_mime_type
      
      if (!hasText && !hasAudio) {
        throw new ApiError({
          message: `Response at index ${index} must contain either text or audio data. Received: text="${response.text}", audio_data=${!!response.audio_data}`,
          code: 'EMPTY_RESPONSE',
          statusCode: 400,
          details: {
            question_id: response.question_id,
            text_length: response.text ? response.text.length : 0,
            has_audio: !!response.audio_data
          }
        })
      }

      // Validate audio format if present
      if (hasAudio) {
        if (!response.audio_mime_type || typeof response.audio_data !== 'string') {
          throw new ApiError({
            message: `Invalid audio data format for response at index ${index}`,
            code: 'INVALID_AUDIO_FORMAT',
            statusCode: 400
          })
        }
      }
    })

    console.log(`✅ Validated ${responses.length} response formats`)
  }

  /**
   * Comprehensive validation of responses before processing
   * @param {Array} responses - Array of responses to validate
   * @param {string} interviewId - Interview ID
   * @param {string} userId - User ID
   * @returns {Promise<void>} - Throws error if validation fails
   */
  async validateResponses(responses, interviewId, userId) {
    // Validate response format first
    this.validateResponseFormat(responses)
    
    // Then validate unique questions
    await this.validateUniqueQuestions(responses, interviewId, userId)
    
    console.log(`✅ All validations passed for ${responses.length} responses`)
  }
}

// Export singleton instance
export const responseValidationService = new ResponseValidationService()
