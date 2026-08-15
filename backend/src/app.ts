import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { errorMiddleware } from './middleware/error.middleware';
import authRouter from './modules/auth/auth.router';
import studentsRouter from './modules/students/students.router';
import jobsRouter from './modules/jobs/jobs.router';
import resumesRouter from './modules/resumes/resumes.router';
import evaluationsRouter from './modules/evaluations/evaluations.router';
import applicationsRouter from './modules/applications/applications.router';
import overridesRouter from './modules/overrides/overrides.router';
import analyticsRouter from './modules/analytics/analytics.router';

const app = express();

// ─── Security & Compression ───────────────────────────────────────
app.use(helmet());
app.use(compression());

// ─── CORS ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Idempotency-Key'],
  credentials: true,
}));

// ─── Rate Limiting ────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX ?? '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
}));

// ─── Parsing ──────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ─────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Health check ────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────────────
const api = '/api/v1';

app.use(`${api}/auth`, authRouter);
app.use(`${api}/students`, studentsRouter);
app.use(`${api}/jobs`, jobsRouter);
app.use(api, resumesRouter);          // mounts /api/v1/students/me/resumes
app.use(api, evaluationsRouter);      // mounts /api/v1/jobs/:id/evaluations etc.
app.use(api, applicationsRouter);     // mounts /api/v1/jobs/:id/apply etc.
app.use(api, overridesRouter);        // mounts /api/v1/evaluations/:id/override etc.
app.use(api, analyticsRouter);        // mounts /api/v1/analytics/* and /api/v1/reports

// ─── 404 fallthrough ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// ─── Global Error Handler ────────────────────────────────────────
app.use(errorMiddleware);

export default app;
