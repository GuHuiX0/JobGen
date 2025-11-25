// Mock required environment variables exist during tests
const defaults = {
  AWS_ACCESS_KEY_ID: 'test-access-key',
  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  S3_BUCKET_NAME: 'test-bucket',
  OPENAI_API_KEY: 'test-openai-key',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/test'
}

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value
  }
}

