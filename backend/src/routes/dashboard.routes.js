import { Router } from 'express'
import { mongoDBService } from '../services/mongodb.service.js'
import { gptService } from '../services/gpt.service.js'
import { ApiError } from '../types/index.js'
import { asyncHandler, validateUserId } from '../middleware/validation.middleware.js'

const router = Router()

/**
 * GET /dashboard/readiness-trend
 * Get readiness trend data with GPT insights
 */
router.get('/readiness-trend', validateUserId, asyncHandler(async (req, res) => {
  const userId = req.userId
  const { from, to } = req.query

  // Always generate fresh trend data from interview sessions (like radar chart)
  const generatedPoints = await mongoDBService.generateReadinessTrendFromSessions(userId)
  
  if (!generatedPoints || generatedPoints.length === 0) {
    throw new ApiError({
      message: 'No readiness trend data found',
      code: 'NO_TREND_DATA',
      statusCode: 404
    })
  }

  // Create fresh trend data structure
  const trendData = {
    user_id: userId,
    points: generatedPoints,
    gpt_insights: null,
    created_at: new Date().toISOString()
  }

  // Use all available points (no date filtering)
  let filteredPoints = trendData.points

  // Check if we have existing insights (similar to radar chart logic)
  const existingTrend = await mongoDBService.getReadinessTrend(userId)
  let gptInsights = existingTrend?.gpt_insights

  // Generate insights if needed
  if (!gptInsights || shouldRegenerateInsights(existingTrend, filteredPoints)) {
    try {
      gptInsights = await gptService.generateReadinessTrendInsights(filteredPoints)

      // Save the trend data with insights
      await mongoDBService.createOrUpdateReadinessTrend({
        user_id: userId,
        points: trendData.points,
        gpt_insights: gptInsights,
        updated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to generate GPT insights:', error)
      // Continue without insights if GPT fails
      gptInsights = null
    }
  }

  const response = {
    points: filteredPoints
  }

  if (gptInsights) {
    response.gpt_insights = gptInsights
  }

  res.status(200).json(response)
}))

/**
 * GET /dashboard/type-radar
 * Get interview type radar chart data with GPT insights
 */
router.get('/type-radar', validateUserId, asyncHandler(async (req, res) => {
  const userId = req.userId
  const { window = '90d' } = req.query

  // Parse window parameter (e.g., "90d" -> 90 days)
  const windowMatch = window.match(/^(\d+)d$/)
  if (!windowMatch) {
    throw new ApiError({
      message: 'Invalid window format. Use format like "90d"',
      code: 'INVALID_WINDOW_FORMAT',
      statusCode: 400
    })
  }
  const windowDays = parseInt(windowMatch[1], 10)

  // Calculate scores from interview data
  const scores = await mongoDBService.calculateTypeRadarScores(userId, windowDays)

  if (!scores) {
    throw new ApiError({
      message: 'No interview data found in the specified time window',
      code: 'NO_INTERVIEW_DATA',
      statusCode: 404
    })
  }

  // Check if radar data already exists and is recent
  const existingRadar = await mongoDBService.getTypeRadar(userId)
  let gptInsights = existingRadar?.gpt_insights

  // Generate or regenerate insights if needed
  if (!gptInsights || shouldRegenerateRadarInsights(existingRadar, scores)) {
    try {
      gptInsights = await gptService.generateTypeRadarInsights(scores)

      // Store the radar data with insights
      await mongoDBService.createOrUpdateTypeRadar({
        user_id: userId,
        scores,
        gpt_insights: gptInsights,
        window_days: windowDays,
        updated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to generate GPT insights:', error)
      // Continue without insights if GPT fails
      gptInsights = null
    }
  }

  const response = {
    scores
  }

  if (gptInsights) {
    response.gpt_insights = gptInsights
  }

  res.status(200).json(response)
}))

/**
 * Helper function to determine if insights should be regenerated
 */
function shouldRegenerateInsights(existingTrend, newPoints) {
  if (!existingTrend || !existingTrend.points) {
    return true
  }

  // Regenerate if points have changed significantly
  if (existingTrend.points.length !== newPoints.length) {
    return true
  }

  // Regenerate if last insight generation was more than 24 hours ago
  if (existingTrend.updated_at) {
    const lastUpdate = new Date(existingTrend.updated_at)
    const now = new Date()
    const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60)
    return hoursDiff > 24
  }

  return false
}

/**
 * Helper function to determine if radar insights should be regenerated
 */
function shouldRegenerateRadarInsights(radarData, newScores) {
  if (!radarData || !radarData.scores) {
    return true
  }

  // Regenerate if scores have changed significantly
  const oldScores = radarData.scores
  const scoreChanged = Object.keys(newScores).some(type => {
    return Math.abs((oldScores[type] || 0) - newScores[type]) > 5 // 5 point threshold
  })

  if (scoreChanged) {
    return true
  }

  // Regenerate if last update was more than 24 hours ago
  if (radarData.updated_at) {
    const lastUpdate = new Date(radarData.updated_at)
    const now = new Date()
    const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60)
    return hoursDiff > 24
  }

  return false
}

export default router

