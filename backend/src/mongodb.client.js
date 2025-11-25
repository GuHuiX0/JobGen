/**
 * @fileoverview MongoDB client module.
 * Manages MongoDB connection and provides collection access helpers.
 * @module mongodb.client
 */

import { MongoClient } from 'mongodb'
import { config } from './config/index.js'

/**
 * MongoDB connection pool size.
 * @constant {number}
 * @readonly
 */
const MAX_POOL_SIZE = 10

/**
 * Default database name if not specified in connection URI.
 * @constant {string}
 * @readonly
 */
const DEFAULT_DB_NAME = 'jobgen'

/**
 * MongoDB client instance.
 * @type {MongoClient|null}
 * @private
 */
let client = null

/**
 * MongoDB database instance.
 * @type {import('mongodb').Db|null}
 * @private
 */
let database = null

/**
 * Establishes connection to MongoDB database.
 * Uses connection pooling for efficient resource management.
 * Idempotent: safe to call multiple times.
 * @async
 * @function connectMongo
 * @returns {Promise<void>}
 * @throws {Error} If connection fails
 */
export async function connectMongo() {
  // Return early if already connected
  if (database) {
    return
  }

  try {
    client = new MongoClient(config.mongodb.uri, {
      maxPoolSize: MAX_POOL_SIZE
    })
    await client.connect()

    // Extract database name from URI or use default
    const uriPath = new URL(config.mongodb.uri).pathname.replace(/^\//, '')
    const dbName = uriPath || DEFAULT_DB_NAME
    database = client.db(dbName)

    console.log(`✅ Connected to MongoDB (native driver) - Database: ${dbName}`)
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error)
    throw new Error(`MongoDB connection failed: ${error.message}`)
  }
}

/**
 * Closes MongoDB connection gracefully.
 * Idempotent: safe to call multiple times.
 * @async
 * @function disconnectMongo
 * @returns {Promise<void>}
 */
export async function disconnectMongo() {
  if (client) {
    try {
      await client.close()
      client = null
      database = null
      console.log('✅ Disconnected from MongoDB')
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error)
      throw error
    }
  }
}

/**
 * Gets the MongoDB database instance.
 * @function db
 * @returns {import('mongodb').Db} MongoDB database instance
 * @throws {Error} If database is not connected
 */
export function db() {
  if (!database) {
    throw new Error(
      'MongoDB not connected. Call connectMongo() first.'
    )
  }
  return database
}

/**
 * Collection name constants for type safety and consistency.
 * @constant {Object<string, string>}
 * @readonly
 */
const COLLECTION_NAMES = {
  USERS: 'users',
  INTERVIEW_SESSIONS: 'interview_sessions',
  INTERVIEW_QUESTIONS: 'interview_questions',
  INTERVIEW_RESPONSES: 'interview_responses',
  INTERVIEW_FEEDBACKS: 'interview_feedbacks',
  STORIES: 'stories',
  READINESS_TRENDS: 'readiness_trends',
  TYPE_RADARS: 'type_radars'
}

/**
 * Gets the users collection.
 * @function usersCollection
 * @returns {import('mongodb').Collection} Users collection
 */
export function usersCollection() {
  return db().collection(COLLECTION_NAMES.USERS)
}

/**
 * Gets the interview sessions collection.
 * @function interviewSessionsCollection
 * @returns {import('mongodb').Collection} Interview sessions collection
 */
export function interviewSessionsCollection() {
  return db().collection(COLLECTION_NAMES.INTERVIEW_SESSIONS)
}

/**
 * Gets the interview questions collection.
 * @function interviewQuestionsCollection
 * @returns {import('mongodb').Collection} Interview questions collection
 */
export function interviewQuestionsCollection() {
  return db().collection(COLLECTION_NAMES.INTERVIEW_QUESTIONS)
}

/**
 * Gets the interview responses collection.
 * @function interviewResponsesCollection
 * @returns {import('mongodb').Collection} Interview responses collection
 */
export function interviewResponsesCollection() {
  return db().collection(COLLECTION_NAMES.INTERVIEW_RESPONSES)
}

/**
 * Gets the interview feedbacks collection.
 * @function interviewFeedbacksCollection
 * @returns {import('mongodb').Collection} Interview feedbacks collection
 */
export function interviewFeedbacksCollection() {
  return db().collection(COLLECTION_NAMES.INTERVIEW_FEEDBACKS)
}

/**
 * Gets the stories collection.
 * @function storiesCollection
 * @returns {import('mongodb').Collection} Stories collection
 */
export function storiesCollection() {
  return db().collection(COLLECTION_NAMES.STORIES)
}

/**
 * Gets the readiness trends collection.
 * @function readinessTrendsCollection
 * @returns {import('mongodb').Collection} Readiness trends collection
 */
export function readinessTrendsCollection() {
  return db().collection(COLLECTION_NAMES.READINESS_TRENDS)
}

/**
 * Gets the type radars collection.
 * @function typeRadarsCollection
 * @returns {import('mongodb').Collection} Type radars collection
 */
export function typeRadarsCollection() {
  return db().collection(COLLECTION_NAMES.TYPE_RADARS)
}
