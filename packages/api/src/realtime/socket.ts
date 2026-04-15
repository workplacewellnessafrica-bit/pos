import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';
import type { JwtPayload, StockAlertEvent, SaleNewEvent, SyncAckEvent } from '@dukapos/shared';

let io: Server;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.FRONTEND_URL,
      credentials: true,
    },
    path: '/ws',
  });

  // Auth middleware — validate JWT on connection
  io.use((socket, next) => {
    const token = socket.handshake.auth['token'] as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
      socket.data['user'] = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data['user'] as JwtPayload;
    // Join a room scoped to the business — all events are per-business
    void socket.join(`biz:${user.bid}`);
    logger.debug(`Socket connected: user=${user.sub} business=${user.bid}`);

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: user=${user.sub}`);
    });
  });

  logger.info('✅ Socket.io initialised');
  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialised');
  return io;
}

// ── Event emitters ────────────────────────────────────────────────────────────

export function emitStockAlert(businessId: string, payload: StockAlertEvent): void {
  getIO().to(`biz:${businessId}`).emit('stock:alert', payload);
}

export function emitSaleNew(businessId: string, payload: SaleNewEvent): void {
  getIO().to(`biz:${businessId}`).emit('sale:new', payload);
}

export function emitInventoryUpdated(businessId: string, variantId: string): void {
  getIO().to(`biz:${businessId}`).emit('inventory:updated', { variantId });
}

export function emitSyncAck(businessId: string, payload: SyncAckEvent): void {
  getIO().to(`biz:${businessId}`).emit('sync:ack', payload);
}

export function emitSessionKicked(businessId: string, userId: string): void {
  getIO().to(`biz:${businessId}`).emit('session:kicked', { userId });
}
