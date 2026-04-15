// src/index.ts — Express application entry point
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { createServer } from 'http';

import { config } from './config.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/error.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { initSocket } from './realtime/socket.js';

// Route modules
import { authRouter } from './modules/auth/auth.router.js';
import { productsRouter } from './modules/products/products.router.js';
import { inventoryRouter } from './modules/inventory/inventory.router.js';
import { ordersRouter } from './modules/orders/orders.router.js';
import { reportsRouter } from './modules/reports/reports.router.js';
import { teamRouter } from './modules/team/team.router.js';
import { settingsRouter } from './modules/settings/settings.router.js';

const app: express.Application = express();
const httpServer = createServer(app);

// ── Socket.io ────────────────────────────────────────────────────────────────
initSocket(httpServer);

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(globalRateLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── API routes ────────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRouter);
app.use(`${API}/products`, productsRouter);
app.use(`${API}/inventory`, inventoryRouter);
app.use(`${API}/orders`, ordersRouter);
app.use(`${API}/reports`, reportsRouter);
app.use(`${API}/team`, teamRouter);
app.use(`${API}/settings`, settingsRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
httpServer.listen(config.PORT, () => {
  logger.info(`🚀 DukaPOS API running on port ${config.PORT} [${config.NODE_ENV}]`);
});

export { app, httpServer };
