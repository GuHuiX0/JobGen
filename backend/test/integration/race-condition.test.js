/**
 * @fileoverview Integration tests for race conditions.
 * Tests concurrent operations, database race conditions, and concurrent request handling.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { mongoDBService } from '../../src/services/mongodb.service.js'
import { responseValidationService } from '../../src/services/response-validation.service.js'
import { ApiError } from '../../src/types/index.js'

describe('Race Condition Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Concurrent Interview Session Creation', () => {
    it('should handle concurrent session creation requests', async () => {
      const userId = 'user_race_test'
      const sessions = []

      // Simulate concurrent session creation
      const promises = Array.from({ length: 5 }, (_, i) => {
        const sessionData = {
          interview_id: `ivw_race_${Date.now()}_${i}`,
          user_id: userId,
          type: 'behavioral',
          question_count: 5,
          duration_seconds: 600,
          status: 'created',
          created_at: new Date().toISOString()
        }
        return mongoDBService.createInterviewSession(sessionData)
          .then(session => sessions.push(session))
          .catch(err => sessions.push({ error: err.message }))
      })

      await Promise.all(promises)

      // All sessions should be created successfully
      expect(sessions.length).toBe(5)
      sessions.forEach(session => {
        expect(session.error).toBeUndefined()
        expect(session.interview_id).toBeDefined()
      })
    })
  })

  describe('Concurrent Response Submission', () => {
    it('should handle concurrent response submissions for same interview', async () => {
      const interviewId = 'ivw_concurrent_test'
      const userId = 'user_concurrent_test'

      // Create interview session first
      await mongoDBService.createInterviewSession({
        interview_id: interviewId,
        user_id: userId,
        type: 'behavioral',
        question_count: 3,
        duration_seconds: 600,
        status: 'created',
        created_at: new Date().toISOString()
      })

      // Create questions
      await mongoDBService.createInterviewQuestions(interviewId, userId, [
        { question_id: 'q1', question_text: 'Question 1', order: 1 },
        { question_id: 'q2', question_text: 'Question 2', order: 2 },
        { question_id: 'q3', question_text: 'Question 3', order: 3 }
      ])

      // Simulate concurrent response submissions
      const responses1 = [
        { question_id: 'q1', text: 'Response 1', elapsed_seconds: 30 }
      ]
      const responses2 = [
        { question_id: 'q2', text: 'Response 2', elapsed_seconds: 25 }
      ]

      const [result1, result2] = await Promise.allSettled([
        mongoDBService.createInterviewResponses(interviewId, userId, responses1),
        mongoDBService.createInterviewResponses(interviewId, userId, responses2)
      ])

      // Both should succeed as they have different question IDs
      expect(result1.status).toBe('fulfilled')
      expect(result2.status).toBe('fulfilled')
    })

    it('should detect duplicate question submissions in concurrent requests', async () => {
      const interviewId = 'ivw_duplicate_test'
      const userId = 'user_duplicate_test'

      await mongoDBService.createInterviewSession({
        interview_id: interviewId,
        user_id: userId,
        type: 'behavioral',
        question_count: 1,
        duration_seconds: 600,
        status: 'created',
        created_at: new Date().toISOString()
      })

      await mongoDBService.createInterviewQuestions(interviewId, userId, [
        { question_id: 'q1', question_text: 'Question 1', order: 1 }
      ])

      // First submission succeeds
      await mongoDBService.createInterviewResponses(interviewId, userId, [
        { question_id: 'q1', text: 'First response', elapsed_seconds: 30 }
      ])

      // Concurrent submission with same question should be detected
      const responses = [
        { question_id: 'q1', text: 'Duplicate response', elapsed_seconds: 25 }
      ]

      // Validation should catch this
      await expect(
        responseValidationService.validateUniqueQuestions(responses, interviewId, userId)
      ).rejects.toThrow(ApiError)
    })
  })

  describe('Concurrent Feedback Generation', () => {
    it('should handle concurrent feedback requests gracefully', async () => {
      const interviewId = 'ivw_feedback_race'
      const userId = 'user_feedback_race'

      // Create interview and feedback entry
      await mongoDBService.createInterviewSession({
        interview_id: interviewId,
        user_id: userId,
        type: 'behavioral',
        question_count: 1,
        duration_seconds: 600,
        status: 'submitted',
        created_at: new Date().toISOString()
      })

      // Simulate concurrent feedback creation requests
      const feedback1 = {
        interview_id: interviewId,
        user_id: userId,
        status: 'processing',
        items: [],
        overall: { score: 0 }
      }

      const feedback2 = {
        interview_id: interviewId,
        user_id: userId,
        status: 'processing',
        items: [],
        overall: { score: 0 }
      }

      const [result1, result2] = await Promise.allSettled([
        mongoDBService.createOrUpdateInterviewFeedback(feedback1),
        mongoDBService.createOrUpdateInterviewFeedback(feedback2)
      ])

      // At least one should succeed
      expect(result1.status === 'fulfilled' || result2.status === 'fulfilled').toBe(true)
    })
  })

  describe('Concurrent Session Updates', () => {
    it('should handle concurrent session status updates', async () => {
      const interviewId = 'ivw_update_race'
      const userId = 'user_update_race'

      await mongoDBService.createInterviewSession({
        interview_id: interviewId,
        user_id: userId,
        type: 'behavioral',
        question_count: 1,
        duration_seconds: 600,
        status: 'created',
        created_at: new Date().toISOString()
      })

      // Simulate concurrent updates
      const updates = [
        { status: 'in_progress' },
        { status: 'submitted' },
        { status: 'completed', completed_at: new Date().toISOString() }
      ]

      const results = await Promise.allSettled(
        updates.map(update =>
          mongoDBService.updateInterviewSession(userId, interviewId, update)
        )
      )

      // All updates should complete (last one wins)
      results.forEach(result => {
        expect(result.status).toBe('fulfilled')
      })

      // Verify final state
      const finalSession = await mongoDBService.getInterviewSession(userId, interviewId)
      expect(finalSession).toBeDefined()
    })
  })
})

