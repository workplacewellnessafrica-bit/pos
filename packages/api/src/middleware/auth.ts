import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError } from './error.js';
import type { JwtPayload, Role } from '@dukapos/shared';

// Augment Express Request with our auth context
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'Authentication required');
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
}

/** Middleware: require one of the given roles */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'Insufficient permissions for this action');
    }
    next();
  };
}

/** Middleware: ensure all DB queries are scoped to the authenticated business */
export function businessScope(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user?.bid) throw new AppError(401, 'Business context missing');
  next();
}
