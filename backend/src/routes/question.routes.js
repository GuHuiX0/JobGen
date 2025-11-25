import { Router } from 'express'
import { jobGenService } from '../services/jobgen.service.js'
import { gptService } from '../services/gpt.service.js'
import { mongoDBService } from '../services/mongodb.service.js'
import { ApiError } from '../types/index.js'
import {
  asyncHandler,
  validateUserId,
  validateAuth,
  validateInterviewType,
  validateQuestionCount
} from '../middleware/validation.middleware.js'

const router = Router()

/**
 * POST /interviews/:interviewId/questions
 * Generate customized questions for a specific interview session
 */
router.post(
  '/:interviewId/questions',
  validateUserId,
  validateAuth,
  validateInterviewType,
  validateQuestionCount,
  asyncHandler(async (req, res) => {
    const { interviewId } = req.params
    const { type, count } = req.body
    const jwtToken = req.token
    const userId = req.userId

    if (!interviewId || interviewId.trim().length === 0) {
      throw new ApiError({
        message: 'Interview ID is required',
        code: 'MISSING_INTERVIEW_ID',
        statusCode: 400
      })
    }

    const session = await mongoDBService.getInterviewSession(userId, interviewId)

    if (!session) {
      throw new ApiError({
        message: 'Interview session not found',
        code: 'SESSION_NOT_FOUND',
        statusCode: 404
      })
    }

    let userProfile = null
    let generatedQuestions = []

    try {
      userProfile = await jobGenService.fetchUserSnapshot(jwtToken)
      generatedQuestions = await gptService.generateQuestions(type, userProfile, count)
    } catch (error) {
      throw new ApiError({
        message: 'Failed to generate questions',
        code: 'QUESTION_GENERATION_ERROR',
        statusCode: 500,
        details: error
      })
    }

    const questionsWithMetadata = generatedQuestions.map((question, index) => ({
      question_id: question.id,
      order: index + 1,
      question_type: question.type,
      question_text: question.text,
      category: question.category,
      difficulty: question.difficulty,
      expected_duration: question.expected_duration,
      duration_seconds: question.expected_duration
    }))

    await mongoDBService.createInterviewQuestions(interviewId, userId, questionsWithMetadata)
    await mongoDBService.updateInterviewSession(userId, interviewId, {
      question_count: questionsWithMetadata.length,
      status: 'questions_generated',
      updated_at: new Date()
    })

    const response = {
      interview_id: interviewId,
      type,
      count: questionsWithMetadata.length,
      questions: questionsWithMetadata,
      user_context: userProfile
        ? {
            name: userProfile.personal_info?.first_name || 'User',
            job_title: userProfile.work_preferences?.job_title || 'Professional',
            industry: userProfile.work_preferences?.industry || 'General'
          }
        : null,
      generated_at: new Date().toISOString()
    }

    res.status(200).json(response)
  })
)

/**
 * POST /interviews/:interviewId/questions/:questionId/hint
 * Generate a short hint for a specific question within an interview
 */
router.post(
  '/:interviewId/questions/:questionId/hint',
  validateUserId,
  validateAuth,
  asyncHandler(async (req, res) => {
    const { interviewId, questionId } = req.params
    const { prompt } = req.body || {}
    const userId = req.userId

    if (!interviewId || !interviewId.trim()) {
      throw new ApiError({
        message: 'Interview ID is required',
        code: 'MISSING_INTERVIEW_ID',
        statusCode: 400
      })
    }

    if (!questionId || !questionId.trim()) {
      throw new ApiError({
        message: 'Question ID is required',
        code: 'MISSING_QUESTION_ID',
        statusCode: 400
      })
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new ApiError({
        message: 'User prompt text is required',
        code: 'MISSING_USER_PROMPT',
        statusCode: 400
      })
    }

    const session = await mongoDBService.getInterviewSession(userId, interviewId)

    if (!session) {
      throw new ApiError({
        message: 'Interview session not found',
        code: 'SESSION_NOT_FOUND',
        statusCode: 404
      })
    }

    const question = await mongoDBService.getInterviewQuestion(interviewId, userId, questionId)

    if (!question) {
      throw new ApiError({
        message: 'Interview question not found',
        code: 'QUESTION_NOT_FOUND',
        statusCode: 404
      })
    }

    const hint = await gptService.generateQuestionHint(question, prompt.trim())

    res.status(200).json({
      interview_id: interviewId,
      question_id: questionId,
      hint
    })
  })
)

export default router
