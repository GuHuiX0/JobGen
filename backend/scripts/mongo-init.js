// Mongo initialization script executed by the official Mongo image.
// Ensures the main database and commonly used collections exist with helpful indexes.
const databaseName = 'ai-coach'
const database = db.getSiblingDB(databaseName)

const collections = [
  'users',
  'interview_sessions',
  'interview_questions',
  'interview_responses',
  'interview_feedbacks',
  'stories',
  'readiness_trends',
  'type_radars'
]

collections.forEach((collectionName) => {
  const exists = database.getCollectionNames().includes(collectionName)
  if (!exists) {
    database.createCollection(collectionName)
  }
})

// Basic indexes that keep lookups performant; extend as data model evolves.
database.users.createIndex({ email: 1 }, { unique: true, sparse: true })
database.interview_sessions.createIndex({ userId: 1, createdAt: -1 })
database.interview_questions.createIndex({ tags: 1 })

print(`Mongo init script executed for database: ${databaseName}`)
