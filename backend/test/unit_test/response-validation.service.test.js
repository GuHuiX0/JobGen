import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { ResponseValidationService } from '../../src/services/response-validation.service.js'
import { ApiError } from '../../src/types/index.js'
import { mongoDBService } from '../../src/services/mongodb.service.js'

describe('ResponseValidationService', () => {
  let service

  beforeEach(() => {
    service = new ResponseValidationService()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('validateResponseFormat', () => {
    it('accepts responses that include text content', () => {
      const responses = [
        {
          question_id: 'q1',
          text: 'I handled the outage by coordinating with infra.',
          elapsed_seconds: 42
        }
      ]

      expect(() => service.validateResponseFormat(responses)).not.toThrow()
    })

    it('rejects duplicate question ids inside the submission', () => {
      const responses = [
        { question_id: 'q1', text: 'first answer' },
        { question_id: 'q1', text: 'second answer' }
      ]

      expect.assertions(2)
      try {
        service.validateResponseFormat(responses)
        throw new Error('Expected duplicate questions to throw')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect(error.code).toBe('DUPLICATE_QUESTIONS_IN_SUBMISSION')
      }
    })

    it('rejects responses without question ids', () => {
      const responses = [{ text: 'missing question id' }]

      expect.assertions(2)
      try {
        service.validateResponseFormat(responses)
        throw new Error('Expected missing question id to throw')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect(error.code).toBe('MISSING_QUESTION_ID')
      }
    })

    it('rejects responses that contain neither text nor audio payloads', () => {
      const responses = [{ question_id: 'q-empty', text: '   ' }]

      expect.assertions(3)
      try {
        service.validateResponseFormat(responses)
        throw new Error('Expected empty response to throw')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect(error.code).toBe('EMPTY_RESPONSE')
        expect(error.details.question_id).toBe('q-empty')
      }
    })

    it('rejects invalid audio payloads that are missing base64 strings', () => {
      const responses = [
        {
          question_id: 'q-audio',
          audio_data: 12345,
          audio_mime_type: 'audio/wav'
        }
      ]

      expect.assertions(2)
      try {
        service.validateResponseFormat(responses)
        throw new Error('Expected invalid audio to throw')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect(error.code).toBe('INVALID_AUDIO_FORMAT')
      }
    })
  })

  describe('validateUniqueQuestions', () => {
    it('allows submissions when MongoDB has no conflicting responses', async () => {
      jest.spyOn(mongoDBService, 'getInterviewResponses').mockResolvedValue([
        { question_id: 'q-existing' }
      ])

      await expect(
        service.validateUniqueQuestions([{ question_id: 'q-new' }], 'ivw_1', 'user_1')
      ).resolves.not.toThrow()

      expect(mongoDBService.getInterviewResponses).toHaveBeenCalledWith('ivw_1')
    })

    it('rejects submissions that reuse answered questions', async () => {
      jest.spyOn(mongoDBService, 'getInterviewResponses').mockResolvedValue([
        { question_id: 'q-dup' },
        { question_id: 'q-other' }
      ])

      await expect(
        service.validateUniqueQuestions([{ question_id: 'q-dup' }], 'ivw_2', 'user_2')
      ).rejects.toMatchObject({ code: 'QUESTIONS_ALREADY_ANSWERED', statusCode: 409 })
    })

    it('wraps unexpected errors with VALIDATION_ERROR for observability', async () => {
      jest.spyOn(mongoDBService, 'getInterviewResponses').mockRejectedValue(new Error('boom'))

      await expect(
        service.validateUniqueQuestions([{ question_id: 'q3' }], 'ivw_3', 'user_3')
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    })
  })

  describe('validateResponses', () => {
    it('runs format and uniqueness validation sequentially', async () => {
      const formatSpy = jest
        .spyOn(service, 'validateResponseFormat')
        .mockImplementation(() => {})
      const uniqueSpy = jest
        .spyOn(service, 'validateUniqueQuestions')
        .mockResolvedValue()

      const payload = [{ question_id: 'q1', text: 'answer' }]
      await service.validateResponses(payload, 'ivw_4', 'user_4')

      expect(formatSpy).toHaveBeenCalledWith(payload)
      expect(uniqueSpy).toHaveBeenCalledWith(payload, 'ivw_4', 'user_4')
    })
  })
})

