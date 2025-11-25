import { Router } from 'express'
import { mongoDBService } from '../services/mongodb.service.js'
import { ApiError } from '../types/index.js'
import { asyncHandler, validateUserId, validatePagination } from '../middleware/validation.middleware.js'

const router = Router()

/**
 * POST /story-bank
 * Save a story to the story bank
 */
router.post('/', validateUserId, asyncHandler(async (req, res) => {
  const userId = req.userId
  const { interview_id, question_id, response_id, title, transcript, tags } = req.body

  // Validate required fields
  if (!title || !transcript) {
    throw new ApiError({
      message: 'Missing required fields: title, transcript',
      code: 'MISSING_REQUIRED_FIELDS',
      statusCode: 400
    })
  }

  // Generate story ID
  const storyId = `st_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Create story data
  const storyData = {
    story_id: storyId,
    user_id: userId,
    interview_id,
    question_id,
    response_id,
    title,
    transcript,
    tags: Array.isArray(tags) ? tags : [],
    created_at: new Date().toISOString()
  }

  // Save to MongoDB
  await mongoDBService.createStory(storyData)

  res.status(201).json({ story_id: storyId })
}))

/**
 * GET /story-bank
 * Query stories from the story bank
 */
router.get('/', validateUserId, validatePagination, asyncHandler(async (req, res) => {
  const userId = req.userId
  const { page, size } = req.pagination
  const { tags } = req.query

  // Parse tags filter
  let tagFilter = []
  if (tags) {
    tagFilter = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())
  }

  // Get stories from MongoDB
  const result = await mongoDBService.getUserStories(userId, page, size, tagFilter)

  res.status(200).json(result)
}))

/**
 * GET /story-bank/tags
 * Get all available tags for the user's stories
 */
router.get('/tags', validateUserId, asyncHandler(async (req, res) => {
  const userId = req.userId

  const tags = await mongoDBService.getUserStoryTags(userId)

  res.status(200).json({ tags })
}))

/**
 * GET /story-bank/:id
 * Get a specific story by ID
 */
router.get('/:id', validateUserId, asyncHandler(async (req, res) => {
  const userId = req.userId
  const { id: storyId } = req.params

  if (!storyId) {
    throw new ApiError({
      message: 'Story ID is required',
      code: 'MISSING_STORY_ID',
      statusCode: 400
    })
  }

  const story = await mongoDBService.getStory(userId, storyId)

  if (!story) {
    throw new ApiError({
      message: 'Story not found',
      code: 'STORY_NOT_FOUND',
      statusCode: 404
    })
  }

  res.status(200).json(story)
}))

/**
 * PUT /story-bank/:id
 * Update a specific story
 */
router.put('/:id', validateUserId, asyncHandler(async (req, res) => {
  const userId = req.userId
  const { id: storyId } = req.params
  const { title, transcript, tags } = req.body

  if (!storyId) {
    throw new ApiError({
      message: 'Story ID is required',
      code: 'MISSING_STORY_ID',
      statusCode: 400
    })
  }

  // Check if story exists
  const existingStory = await mongoDBService.getStory(userId, storyId)
  if (!existingStory) {
    throw new ApiError({
      message: 'Story not found',
      code: 'STORY_NOT_FOUND',
      statusCode: 404
    })
  }

  // Prepare update data
  const updateData = {}
  if (title !== undefined) updateData.title = title
  if (transcript !== undefined) updateData.transcript = transcript
  if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : []
  updateData.updated_at = new Date().toISOString()

  // Update story
  const updatedStory = await mongoDBService.updateStory(userId, storyId, updateData)

  res.status(200).json(updatedStory)
}))

/**
 * DELETE /story-bank/:id
 * Delete a specific story
 */
router.delete('/:id', validateUserId, asyncHandler(async (req, res) => {
  const userId = req.userId
  const { id: storyId } = req.params

  if (!storyId) {
    throw new ApiError({
      message: 'Story ID is required',
      code: 'MISSING_STORY_ID',
      statusCode: 400
    })
  }

  // Check if story exists
  const existingStory = await mongoDBService.getStory(userId, storyId)
  if (!existingStory) {
    throw new ApiError({
      message: 'Story not found',
      code: 'STORY_NOT_FOUND',
      statusCode: 404
    })
  }

  // Delete story
  const deleted = await mongoDBService.deleteStory(userId, storyId)

  if (deleted) {
    res.status(200).json({ message: 'Story deleted successfully' })
  } else {
    throw new ApiError({
      message: 'Failed to delete story',
      code: 'DELETE_FAILED',
      statusCode: 500
    })
  }
}))

export default router
