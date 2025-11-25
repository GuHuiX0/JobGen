import request from 'supertest'
import express from 'express'
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import questionRoutes from '../../src/routes/question.routes.js'
import { mongoDBService } from '../../src/services/mongodb.service.js'
import { jobGenService } from '../../src/services/jobgen.service.js'
import { gptService } from '../../src/services/gpt.service.js'
import { errorHandler, notFoundHandler } from '../../src/middleware/error.middleware.js'

const buildApp = () => {
  const app = express()
  app.use(express.json())
  app.use('/interviews', questionRoutes)
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}

describe('Question routes integration', () => {
  let app

  beforeEach(() => {
    app = buildApp()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('POST /interviews/:interviewId/questions', () => {
    it('returns generated questions along with stored metadata', async () => {
      jest.spyOn(mongoDBService, 'getInterviewSession').mockResolvedValue({
        interview_id: 'ivw_abc',
        user_id: 'user_1'
      })
      jest.spyOn(jobGenService, 'fetchUserSnapshot').mockResolvedValue({
        personal_info: { first_name: 'Ava' },
        work_preferences: { job_title: 'Engineer', industry: 'Tech' }
      })
      jest.spyOn(gptService, 'generateQuestions').mockResolvedValue([
        {
          id: 'q1',
          text: 'Describe a time you solved a production issue.',
          type: 'behavioral',
          category: 'Problem Solving',
          difficulty: 'medium',
          expected_duration: 120
        },
        {
          id: 'q2',
          text: 'Tell me about cross-team leadership.',
          type: 'behavioral',
          category: 'Leadership',
          difficulty: 'hard',
          expected_duration: 150
        }
      ])
      jest.spyOn(mongoDBService, 'createInterviewQuestions').mockResolvedValue([])
      jest.spyOn(mongoDBService, 'updateInterviewSession').mockResolvedValue({})

      const response = await request(app)
        .post('/interviews/ivw_abc/questions')
        .set('x-user-id', 'user_1')
        .set('Authorization', 'Bearer token-123')
        .send({ type: 'behavioral', count: 2 })

      expect(response.status).toBe(200)
      expect(response.body.questions).toHaveLength(2)
      expect(response.body.user_context).toEqual({
        name: 'Ava',
        job_title: 'Engineer',
        industry: 'Tech'
      })
      expect(jobGenService.fetchUserSnapshot).toHaveBeenCalledWith('token-123')
      expect(gptService.generateQuestions).toHaveBeenCalledWith(
        'behavioral',
        expect.objectContaining({ personal_info: { first_name: 'Ava' } }),
        2
      )
      expect(mongoDBService.createInterviewQuestions).toHaveBeenCalledWith(
        'ivw_abc',
        'user_1',
        expect.any(Array)
      )
      expect(mongoDBService.updateInterviewSession).toHaveBeenCalledWith(
        'user_1',
        'ivw_abc',
        expect.objectContaining({ status: 'questions_generated' })
      )
    })

    it('returns 404 when interview session is missing', async () => {
      jest.spyOn(mongoDBService, 'getInterviewSession').mockResolvedValue(null)

      const response = await request(app)
        .post('/interviews/ivw_missing/questions')
        .set('x-user-id', 'user_2')
        .set('Authorization', 'Bearer token-456')
        .send({ type: 'behavioral', count: 2 })

      expect(response.status).toBe(404)
      expect(response.body.code).toBe('SESSION_NOT_FOUND')
    })

    it('surfaces QUESTION_GENERATION_ERROR when GPT calls fail', async () => {
      jest.spyOn(mongoDBService, 'getInterviewSession').mockResolvedValue({
        interview_id: 'ivw_fail',
        user_id: 'user_3'
      })
      jest.spyOn(jobGenService, 'fetchUserSnapshot').mockResolvedValue({
        personal_info: { first_name: 'Kai' },
        work_preferences: {}
      })
      jest.spyOn(gptService, 'generateQuestions').mockRejectedValue(new Error('GPT down'))

      const response = await request(app)
        .post('/interviews/ivw_fail/questions')
        .set('x-user-id', 'user_3')
        .set('Authorization', 'Bearer token-789')
        .send({ type: 'technical', count: 3 })

      expect(response.status).toBe(500)
      expect(response.body.code).toBe('QUESTION_GENERATION_ERROR')
      expect(response.body.message).toMatch(/Failed to generate questions/)
    })
  })

  describe('POST /interviews/:interviewId/questions/:questionId/hint', () => {
    it('returns a concise hint when question exists', async () => {
      jest.spyOn(mongoDBService, 'getInterviewSession').mockResolvedValue({
        interview_id: 'ivw_hint',
        user_id: 'user_hint'
      })
      jest.spyOn(mongoDBService, 'getInterviewQuestion').mockResolvedValue({
        question_id: 'q1',
        question_text: 'Describe a time you managed risk.',
        question_type: 'behavioral'
      })
      jest.spyOn(gptService, 'generateQuestionHint').mockResolvedValue('Highlight quantified impact.')

      const response = await request(app)
        .post('/interviews/ivw_hint/questions/q1/hint')
        .set('x-user-id', 'user_hint')
        .set('Authorization', 'Bearer hint-token')
        .send({ prompt: 'Need inspiration' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        interview_id: 'ivw_hint',
        question_id: 'q1',
        hint: 'Highlight quantified impact.'
      })
      expect(gptService.generateQuestionHint).toHaveBeenCalledWith(
        expect.objectContaining({ question_text: 'Describe a time you managed risk.' }),
        'Need inspiration'
      )
    })

    it('returns 404 when the requested question cannot be found', async () => {
      jest.spyOn(mongoDBService, 'getInterviewSession').mockResolvedValue({
        interview_id: 'ivw_hint',
        user_id: 'user_hint'
      })
      jest.spyOn(mongoDBService, 'getInterviewQuestion').mockResolvedValue(null)

      const response = await request(app)
        .post('/interviews/ivw_hint/questions/missing/hint')
        .set('x-user-id', 'user_hint')
        .set('Authorization', 'Bearer hint-token')
        .send({ prompt: 'Need inspiration' })

      expect(response.status).toBe(404)
      expect(response.body.code).toBe('QUESTION_NOT_FOUND')
    })
  })
})

