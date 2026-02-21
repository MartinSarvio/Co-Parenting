import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { childrenRouter } from './routes/children';
import { householdRouter } from './routes/household';
import { eventsRouter } from './routes/events';
import { tasksRouter } from './routes/tasks';
import { messagesRouter } from './routes/messages';
import { expensesRouter } from './routes/expenses';
import { documentsRouter } from './routes/documents';
import { mealPlansRouter } from './routes/mealPlans';
import { decisionsRouter } from './routes/decisions';
import { keyDatesRouter } from './routes/keyDates';
import { diaryRouter } from './routes/diary';
import { milestonesRouter } from './routes/milestones';
import { custodyPlansRouter } from './routes/custodyPlans';
import { adminRouter } from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware — relaxed for cross-origin API usage
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },
  contentSecurityPolicy: false, // API-only server, no HTML to protect
}));

// CORS — allow multiple origins (Railway prod + local dev + Vercel)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://co-parenting-snowy.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'capacitor://localhost',   // iOS Capacitor native app
  'ionic://localhost',       // Alternative Capacitor scheme
  'http://localhost',        // Android Capacitor
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, server-to-server, health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log but don't crash — just reject the request
      console.log(`CORS blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Health check (public)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'co-parenting-backend'
  });
});

// Public routes
app.use('/api/auth', authRouter);

// Protected routes (require authentication)
app.use('/api/users', authenticate, usersRouter);
app.use('/api/children', authenticate, childrenRouter);
app.use('/api/household', authenticate, householdRouter);
app.use('/api/events', authenticate, eventsRouter);
app.use('/api/tasks', authenticate, tasksRouter);
app.use('/api/messages', authenticate, messagesRouter);
app.use('/api/expenses', authenticate, expensesRouter);
app.use('/api/documents', authenticate, documentsRouter);
app.use('/api/meal-plans', authenticate, mealPlansRouter);
app.use('/api/decisions', authenticate, decisionsRouter);
app.use('/api/key-dates', authenticate, keyDatesRouter);
app.use('/api/diary', authenticate, diaryRouter);
app.use('/api/milestones', authenticate, milestonesRouter);
app.use('/api/custody-plans', authenticate, custodyPlansRouter);

// Admin routes (mixed: /promote uses ADMIN_SECRET, others use JWT+isAdmin)
app.use('/api/admin', adminRouter);

// Error handler
app.use(errorHandler);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Co-Parenting API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
