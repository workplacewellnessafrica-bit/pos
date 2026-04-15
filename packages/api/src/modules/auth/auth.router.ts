import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';
import * as authController from './auth.controller.js';

export const authRouter: Router = Router();

authRouter.post('/register', authRateLimiter, authController.register);
authRouter.post('/login',    authRateLimiter, authController.login);
authRouter.post('/refresh',  authRateLimiter, authController.refresh);
authRouter.post('/logout',   authenticate,    authController.logout);
authRouter.get('/me',        authenticate,    authController.me);
