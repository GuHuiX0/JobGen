/**
 * @fileoverview Application configuration module.
 * Loads and validates environment variables, provides centralized configuration object.
 * @module config
 */

import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

/**
 * Default configuration values used when environment variables are not set.
 * @constant {Object}
 * @readonly
 */
const DEFAULT_CONFIG = {
  SERVER_PORT: 3001,
  NODE_ENV: 'development',
  CORS_ORIGIN: 'http://localhost:3000',
  AWS_REGION: 'us-east-1',
  JOBGEN_API_BASE_URL: 'https://api.jobgen.ai'
}

/**
 * Centralized application configuration object.
 * Contains all configuration values loaded from environment variables.
 * @constant {Object}
 * @readonly
 * @property {Object} server - Server configuration
 * @property {number} server.port - Server port number
 * @property {string} server.nodeEnv - Node environment (development/production)
 * @property {string} server.corsOrigin - CORS allowed origin
 * @property {Object} aws - AWS configuration
 * @property {string} aws.accessKeyId - AWS access key ID
 * @property {string} aws.secretAccessKey - AWS secret access key
 * @property {string} aws.region - AWS region
 * @property {string} aws.s3Bucket - S3 bucket name
 * @property {Object} openai - OpenAI configuration
 * @property {string} openai.apiKey - OpenAI API key
 * @property {Object} jobgen - JobGen API configuration
 * @property {string} jobgen.apiBaseUrl - JobGen API base URL
 * @property {Object} mongodb - MongoDB configuration
 * @property {string} mongodb.uri - MongoDB connection URI
 */
export const config = {
  server: {
    port: parseInt(process.env.PORT || String(DEFAULT_CONFIG.SERVER_PORT), 10),
    nodeEnv: process.env.NODE_ENV || DEFAULT_CONFIG.NODE_ENV,
    corsOrigin: process.env.CORS_ORIGIN || DEFAULT_CONFIG.CORS_ORIGIN
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || DEFAULT_CONFIG.AWS_REGION,
    s3Bucket: process.env.S3_BUCKET_NAME
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  jobgen: {
    apiBaseUrl: process.env.JOBGEN_API_BASE_URL || DEFAULT_CONFIG.JOBGEN_API_BASE_URL
  },
  mongodb: {
    uri: process.env.MONGODB_URI
  }
}

/**
 * Required environment variables that must be set for the application to run.
 * @constant {string[]}
 * @readonly
 */
const REQUIRED_ENV_VARS = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'OPENAI_API_KEY',
  'MONGODB_URI'
]

/**
 * Validates that all required environment variables are set.
 * Throws an error if any required variables are missing.
 * @throws {Error} If any required environment variables are missing
 */
function validateEnvironmentVariables() {
  const missingEnvVars = REQUIRED_ENV_VARS.filter(
    (varName) => !process.env[varName] || process.env[varName].trim() === ''
  )

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}\n` +
      'Please ensure all required environment variables are set in your .env file or environment.'
    )
  }
}

// Validate environment variables on module load
validateEnvironmentVariables()
