import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../../middleware/error.js';
import { prisma } from '../../lib/prisma.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['MANAGER', 'CASHIER', 'STOCK_CLERK', 'VIEWER']),
});

export const listInvitations = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const invitations = await prisma.invitation.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: invitations });
});

export const createInvitation = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const { email, role } = inviteSchema.parse(req.body);

  // Check if user already exists in this business
  const existingUser = await prisma.user.findFirst({ where: { businessId, email } });
  if (existingUser) throw new AppError(409, 'User is already a member of this business');

  // Check if invitation already exists
  const existingInvite = await prisma.invitation.findUnique({
    where: { businessId_email: { businessId, email } }
  });

  const token = nanoid(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  if (existingInvite) {
    await prisma.invitation.update({
      where: { id: existingInvite.id },
      data: { token, expiresAt, role }
    });
  } else {
    await prisma.invitation.create({
      data: { businessId, email, role, token, expiresAt }
    });
  }

  // TODO: Send email with invite link using Resend
  console.log(`[Invitation] Created for ${email} with token ${token}`);

  res.status(201).json({ success: true, message: `Invitation sent to ${email}` });
});

export const revokeInvitation = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const { id } = req.params;

  const invite = await prisma.invitation.findFirst({ where: { id, businessId } });
  if (!invite) throw new AppError(404, 'Invitation not found');

  await prisma.invitation.delete({ where: { id } });
  res.json({ success: true, message: 'Invitation revoked' });
});
