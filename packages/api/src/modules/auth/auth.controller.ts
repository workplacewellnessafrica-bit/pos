import type { Request, Response } from 'express';
import { registerBusinessSchema, loginSchema } from '@dukapos/shared';
import { asyncHandler } from '../../middleware/error.js';
import * as authService from './auth.service.js';

const REFRESH_COOKIE = 'duka_refresh';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerBusinessSchema.parse(req.body);
  const result = await authService.registerBusiness(input);
  res.status(201).json({
    success: true,
    message: 'Business registered. Check your email to verify your account.',
    data: result,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const { refreshToken, ...rest } = await authService.login(input);
  res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
  res.json({ success: true, data: rest });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token: string =
    (req.cookies as Record<string, string>)[REFRESH_COOKIE] ??
    (req.body as { refreshToken?: string }).refreshToken ?? '';

  if (!token) {
    res.status(401).json({ success: false, message: 'No refresh token provided' });
    return;
  }

  const result = await authService.refreshAccessToken(token);
  res.json({ success: true, data: result });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const token: string =
    (req.cookies as Record<string, string>)[REFRESH_COOKIE] ?? '';

  await authService.logout(userId, token);
  res.clearCookie(REFRESH_COOKIE);
  res.json({ success: true, message: 'Logged out successfully' });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: req.user });
});
