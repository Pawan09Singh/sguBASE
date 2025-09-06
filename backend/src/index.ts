import express, { Application } from 'express';
import { ApolloServer } from 'apollo-server-express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import path from 'path';

// Import local modules
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import courseRoutes from './routes/courses';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/admin-working';
import deanRoutes from './routes/dean';
import teacherRoutes from './routes/teacher';
import studentRoutes from './routes/student';
import testRoutes from './routes/test';
import testApiRoutes from './routes/test-api';
import { authMiddleware } from './middlewares/auth';
import { loggerMiddleware } from './middlewares/logger';
import { errorHandler } from './middlewares/errorHandler';
import { prisma } from './utils/prisma';
import { logger } from './utils/logger';

dotenv.config();

async function startServer() {
  const app: Application = express();
  
  // Test database connection
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully'); // Connected
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    logger.info('💡 Please ensure PostgreSQL is running and DATABASE_URL is correct');
    logger.info('📋 Current DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'));
  }
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use(limiter);

  // Basic middleware
  app.use(compression());
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Logging middleware
  app.use(loggerMiddleware);

  // Serve static files (uploads)
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // REST API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', authMiddleware, userRoutes);
  app.use('/api/courses', authMiddleware, courseRoutes);
  app.use('/api/upload', authMiddleware, uploadRoutes);
  app.use('/api/admin', authMiddleware, adminRoutes); // Re-enabled with working admin routes
  app.use('/api/dean', authMiddleware, deanRoutes); // Dean/Admin specific routes
  app.use('/api/teacher', authMiddleware, teacherRoutes); // Teacher specific routes
  app.use('/api/student', authMiddleware, studentRoutes); // Student specific routes
  app.use('/api/test', testRoutes);
  app.use('/api/test-protected', authMiddleware, testRoutes);
  app.use('/api/test-api', testApiRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV 
    });
  });

  // Root endpoint with API information
  app.get('/', (req, res) => {
    res.json({
      message: '🎓 University LMS API Server',
      version: '1.0.0',
      status: 'Running',
      endpoints: {
        health: '/health',
        graphql: '/graphql',
        auth: '/api/auth/*',
        users: '/api/users/*',
        courses: '/api/courses/*',
        uploads: '/api/upload/*',
        admin: '/api/admin/*',
        dean: '/api/dean/*',
        teacher: '/api/teacher/*'
      },
      timestamp: new Date().toISOString()
    });
  });

  // GraphQL Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      return {
        req,
        prisma,
        user: req.user || null,
      };
    },
    introspection: process.env.NODE_ENV !== 'production',
  });

  await server.start();
  server.applyMiddleware({ app: app as any, path: '/graphql' });

  // Error handling middleware (should be last)
  app.use(errorHandler);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  const PORT = process.env.PORT || 4004; // Port 4004 with working admin routes
  const httpServer = createServer(app);

  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server ready at http://localhost:${PORT}`);
    logger.info(`🚀 GraphQL endpoint ready at http://localhost:${PORT}${server.graphqlPath}`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await prisma.$disconnect();
    httpServer.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await prisma.$disconnect();
    httpServer.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer().catch((error) => {
  logger.error('Error starting server:', error);
  process.exit(1);
});
