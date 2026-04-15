import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { asyncHandler, AppError } from '../../middleware/error.js';
import { prisma } from '../../lib/prisma.js';
import { emitSessionKicked } from '../../realtime/socket.js';
import type { Role } from '@dukapos/shared';

export const listStaff = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const staff = await prisma.user.findMany({
    where: { businessId },
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: staff });
});

export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const { name, email, role, pin, password } = req.body as {
    name: string; email: string; role: Role; pin?: string; password: string;
  };

  const requesting = req.user!.role;
  // Managers cannot create Manager or Owner accounts
  if (requesting === 'MANAGER' && (role === 'MANAGER' || role === 'OWNER')) {
    throw new AppError(403, 'Managers cannot create Manager or Owner accounts');
  }

  const exists = await prisma.user.findFirst({ where: { businessId, email } });
  if (exists) throw new AppError(409, 'A staff member with this email already exists');

  const passwordHash = await bcrypt.hash(password, 12);
  const pinHash = pin ? await bcrypt.hash(pin, 10) : null;

  const user = await prisma.user.create({
    data: { businessId, name, email, passwordHash, role, pin: pinHash, emailVerified: true },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  res.status(201).json({ success: true, data: user });
});

export const getStaff = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const user = await prisma.user.findFirst({
    where: { id: req.params['id'], businessId },
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
  });
  if (!user) throw new AppError(404, 'Staff member not found');
  res.json({ success: true, data: user });
});

export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const { name, role, isActive, pin } = req.body as { name?: string; role?: Role; isActive?: boolean; pin?: string };
  const update: Record<string, unknown> = {};
  if (name) update['name'] = name;
  if (role) update['role'] = role;
  if (isActive !== undefined) update['isActive'] = isActive;
  if (pin) update['pin'] = await bcrypt.hash(pin, 10);

  const result = await prisma.user.updateMany({
    where: { id: req.params['id'], businessId },
    data: update,
  });
  if (result.count === 0) throw new AppError(404, 'Staff member not found');
  res.json({ success: true, message: 'Staff member updated' });
});

export const deactivateStaff = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const result = await prisma.user.updateMany({
    where: { id: req.params['id'], businessId },
    data: { isActive: false },
  });
  if (result.count === 0) throw new AppError(404, 'Staff member not found');
  emitSessionKicked(businessId, req.params['id']!);
  res.json({ success: true, message: 'Staff member deactivated and session terminated' });
});

export const kickSession = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  await prisma.refreshToken.updateMany({
    where: { userId: req.params['id'] },
    data: { revokedAt: new Date() },
  });
  emitSessionKicked(businessId, req.params['id']!);
  res.json({ success: true, message: 'Session terminated' });
});
