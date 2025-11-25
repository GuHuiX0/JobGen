/**
 * @fileoverview Main application entry point for AI Interview Coach backend.
 * Configures Express server, middleware, routes, and handles graceful shutdown.
 * @module app
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import { join } from 'path'
import { config } from './config/index.js'
import { connectMongo, disconnectMongo } from './mongodb.client.js'

// Import routes
import interviewRoutes from './routes/interview.routes.js'
import signedUrlRoutes from './routes/signed-url.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import storyBankRoutes from './routes/story-bank.routes.js'
import questionRoutes from './routes/question.routes.js'

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'

/**
 * Graceful shutdown timeout in milliseconds.
 * @constant {number}
 * @readonly
 */
const GRACEFUL_SHUTDOWN_TIMEOUT = 10000

/**
 * Creates and configures Express application with all middleware and routes.
 * @returns {express.Application} Configured Express application
 */
export const createApp = () => {
  const app = express()

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:']
        }
      },
      crossOriginEmbedderPolicy: false
    })
  )

  // CORS configuration
  app.use(
    cors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
    })
  )

  // Logging middleware - use combined format for all environments
  app.use(morgan('combined'))

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // Swagger API documentation
  try {
    const swaggerPath = join(process.cwd(), 'swagger.yaml')
    const swaggerDocument = YAML.load(swaggerPath)
    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'JobGen Interview Coach API',
        customfavIcon: '/favicon.ico'
      })
    )
    console.log('✅ Swagger documentation available at /api-docs')
  } catch (error) {
    console.warn('⚠️ Swagger documentation not available:', error.message)
  }

  /**
   * Health check endpoint for monitoring and load balancers.
   * Returns server status and basic information.
   */
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.server.nodeEnv,
      uptime: process.uptime()
    })
  })

  // API routes
  /**
   * Get available interview types.
   */
  app.get('/interview/types', (req, res) => {
    res.json({ types: ['behavioral', 'technical', 'psychometric'] })
  })

  // Mount route handlers
  app.use('/interviews', interviewRoutes)
  app.use('/interviews', questionRoutes)
  app.use('/signed-url', signedUrlRoutes)
  app.use('/dashboard', dashboardRoutes)
  app.use('/story-bank', storyBankRoutes)

  // Error handling middleware (must be last)
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

/**
 * Starts the Express server and establishes database connections.
 * Handles graceful shutdown on termination signals.
 * @async
 * @function startServer
 * @returns {Promise<void>}
 */
const startServer = async () => {
  try {
    // Connect to MongoDB (native driver)
    await connectMongo()

    // Create Express application
    const app = createApp()

    // Start server with port conflict handling
    const server = app.listen(config.server.port, () => {
      console.log(`
🚀 JobGen Interview Coach Backend Server Started!

📊 Server Info:
   • Port: ${config.server.port}
   • Environment: ${config.server.nodeEnv}
   • CORS Origin: ${config.server.corsOrigin}

🔗 API Endpoints:
   • Health Check: http://localhost:${config.server.port}/health
   • API Documentation: http://localhost:${config.server.port}/api-docs
   • Create Interview: http://localhost:${config.server.port}/interviews
   • Signed URLs: http://localhost:${config.server.port}/signed-url
   • Dashboard: http://localhost:${config.server.port}/dashboard
   • Story Bank: http://localhost:${config.server.port}/story-bank
   • Question Generation: http://localhost:${config.server.port}/interviews/:id/questions

📝 Usage:
   • Add 'x-user-id' header to requests for user context
   • Data is stored in MongoDB Atlas (audio files in AWS S3)
   • OpenAI Whisper for speech-to-text
   • OpenAI GPT for feedback generation

✅ Server is ready to accept requests!
      `)
    })

    // Handle port conflicts
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${config.server.port} is already in use. Please try a different port.`)
        console.log('💡 You can set a different port using: PORT=3002 npm start')
        process.exit(1)
      } else {
        console.error('❌ Server error:', error)
        process.exit(1)
      }
    })

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`)

      server.close(async () => {
        console.log('✅ Server closed successfully')
        await disconnectMongo()
        process.exit(0)
      })

      // Force close after timeout
      setTimeout(() => {
        console.error('❌ Force closing server after timeout')
        process.exit(1)
      }, GRACEFUL_SHUTDOWN_TIMEOUT)
    }

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error)
      gracefulShutdown('uncaughtException')
    })

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
      gracefulShutdown('unhandledRejection')
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()
