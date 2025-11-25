import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { ApiError } from '../../src/types/index.js'

let mockCollection
let mockCursor

const collectionFactories = {
  usersCollection: jest.fn(() => mockCollection),
  interviewSessionsCollection: jest.fn(() => mockCollection),
  interviewQuestionsCollection: jest.fn(() => mockCollection),
  interviewResponsesCollection: jest.fn(() => mockCollection),
  interviewFeedbacksCollection: jest.fn(() => mockCollection),
  storiesCollection: jest.fn(() => mockCollection),
  readinessTrendsCollection: jest.fn(() => mockCollection),
  typeRadarsCollection: jest.fn(() => mockCollection)
}

await jest.unstable_mockModule('../../src/mongodb.client.js', () => collectionFactories)
const { MongoDBService } = await import('../../src/services/mongodb.service.js')

describe('MongoDBService', () => {
  let mongoDBService

  const createCollection = () => ({
    insertOne: jest.fn(),
    insertMany: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    deleteMany: jest.fn(),
    deleteOne: jest.fn(),
    find: jest.fn(() => mockCursor),
    countDocuments: jest.fn(),
    toArray: jest.fn()
  })

  const createCursor = () => ({
    sort: jest.fn().mockReturnThis(),
    toArray: jest.fn(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis()
  })

  beforeEach(() => {
    mongoDBService = new MongoDBService()
    mockCursor = createCursor()
    mockCollection = createCollection()
    Object.values(collectionFactories).forEach((factory) => factory.mockClear())
  })

  describe('createInterviewSession', () => {
    it('creates a session document', async () => {
      const payload = {
        interview_id: 'ivw_1',
        user_id: 'user_1',
        type: 'behavioral',
        created_at: '2024-01-01T00:00:00Z'
      }

      const result = await mongoDBService.createInterviewSession(payload)

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({ interview_id: 'ivw_1', user_id: 'user_1' })
      )
      expect(result).toEqual(payload)
    })

    it('wraps driver failures in ApiError', async () => {
      mockCollection.insertOne.mockRejectedValue(new Error('boom'))

      await expect(
        mongoDBService.createInterviewSession({ interview_id: 'ivw', user_id: 'user' })
      ).rejects.toThrow(ApiError)
    })
  })

  describe('getInterviewSession', () => {
    it('fetches a session by user and interview id', async () => {
      const session = { interview_id: 'ivw', user_id: 'user' }
      mockCollection.findOne.mockResolvedValue(session)

      const result = await mongoDBService.getInterviewSession('user', 'ivw')

      expect(mockCollection.findOne).toHaveBeenCalledWith({ user_id: 'user', interview_id: 'ivw' })
      expect(result).toEqual(session)
    })
  })

  describe('updateInterviewSession', () => {
    it('updates and returns the session document', async () => {
      const updated = { interview_id: 'ivw', user_id: 'user', status: 'completed' }
      mockCollection.findOne.mockResolvedValue(updated)

      const result = await mongoDBService.updateInterviewSession('user', 'ivw', {
        status: 'completed'
      })

      expect(mockCollection.updateOne).toHaveBeenCalled()
      expect(result).toEqual(updated)
    })
  })

  describe('createInterviewQuestions', () => {
    it('persists questions and returns normalized docs', async () => {
      const questions = [
        { question_id: 'q1', question_text: 'first', order: 1 },
        { question_id: 'q2', question_text: 'second', order: 2 }
      ]

      const docs = await mongoDBService.createInterviewQuestions('ivw', 'user', questions)

      expect(mockCollection.deleteMany).toHaveBeenCalledWith({ interview_id: 'ivw', user_id: 'user' })
      expect(mockCollection.insertMany).toHaveBeenCalled()
      expect(docs).toHaveLength(2)
      expect(docs[0]).toMatchObject({ interview_id: 'ivw', user_id: 'user' })
    })

    it('short-circuits empty payloads', async () => {
      const result = await mongoDBService.createInterviewQuestions('ivw', 'user', [])
      expect(result).toEqual([])
      expect(mockCollection.insertMany).not.toHaveBeenCalled()
    })
  })

  describe('createInterviewResponses', () => {
    it('inserts and returns responses', async () => {
      mockCursor.toArray.mockResolvedValue([{ question_id: 'q1' }])

      const responses = await mongoDBService.createInterviewResponses('ivw', 'user', [
        { question_id: 'q1', text: 'answer' }
      ])

      expect(mockCollection.insertMany).toHaveBeenCalled()
      expect(responses).toEqual([{ question_id: 'q1' }])
    })
  })

  describe('getAllUserInterviewSessions', () => {
    it('returns sorted sessions', async () => {
      const docs = [{ interview_id: 'ivw' }]
      mockCursor.toArray.mockResolvedValue(docs)

      const result = await mongoDBService.getAllUserInterviewSessions('user')

      expect(mockCollection.find).toHaveBeenCalledWith({ user_id: 'user' })
      expect(mockCursor.sort).toHaveBeenCalledWith({ created_at: -1 })
      expect(result).toEqual(docs)
    })
  })
})

