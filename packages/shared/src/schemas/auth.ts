import { z } from 'zod';

// ── Business Registration ─────────────────────────────────────────────────────

export const registerBusinessSchema = z.object({
  businessName: z.string().min(2).max(100),
  ownerName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  country: z.string().length(2).default('KE'),
  category: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
});

export type RegisterBusinessInput = z.infer<typeof registerBusinessSchema>;

// ── Login ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  businessCode: z.string().optional(), // for multi-business
});

export type LoginInput = z.infer<typeof loginSchema>;

export const pinLoginSchema = z.object({
  businessSlug: z.string().min(1),
  pin: z.string().min(4).max(6),
  deviceId: z.string().optional(),
});

export type PinLoginInput = z.infer<typeof pinLoginSchema>;

// ── Refresh ───────────────────────────────────────────────────────────────────

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(), // also accepted from httpOnly cookie
});

// ── Email verification ────────────────────────────────────────────────────────

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

// ── Change password ───────────────────────────────────────────────────────────

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

// ── Update PIN ────────────────────────────────────────────────────────────────

export const updatePinSchema = z.object({
  pin: z.string().min(4).max(6).regex(/^\d+$/, 'PIN must be numeric'),
  currentPassword: z.string().min(1),
});
