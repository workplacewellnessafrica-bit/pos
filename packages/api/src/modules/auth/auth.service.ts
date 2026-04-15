import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { prisma } from '../../lib/prisma.js';
import { redis, redisKeys } from '../../lib/redis.js';
import { config } from '../../config.js';
import { AppError } from '../../middleware/error.js';
import type { RegisterBusinessInput, LoginInput, JwtPayload } from '@dukapos/shared';

const BCRYPT_ROUNDS = 12;

// ── Token helpers ─────────────────────────────────────────────────────────────

function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function generateRefreshToken(): string {
  return nanoid(64);
}

async function storeRefreshToken(userId: string, token: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await prisma.refreshToken.create({
    data: { userId, token, expiresAt },
  });
}

// ── Register ──────────────────────────────────────────────────────────────────

export async function registerBusiness(input: RegisterBusinessInput) {
  const { businessName, ownerName, email, phone, country, category, password } = input;

  // Check email uniqueness
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) throw new AppError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Generate slug from business name
  const baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 50);
  const slug = `${baseSlug}-${nanoid(6)}`;

  const business = await prisma.$transaction(async (tx) => {
    const biz = await tx.business.create({
      data: {
        name: businessName,
        slug,
        email,
        phone,
        country,
        category,
        settings: { create: {} }, // default settings
      },
    });

    await tx.user.create({
      data: {
        businessId: biz.id,
        email,
        passwordHash,
        name: ownerName,
        phone,
        role: 'OWNER',
        emailVerified: false,
      },
    });

    return biz;
  });

  // TODO: send verification email via Resend
  return { businessId: business.id, slug: business.slug };
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { businessId_email: { businessId: await resolveBusinessId(input), email: input.email } },
    include: { business: { select: { id: true, name: true, isActive: true } } },
  });

  if (!user) throw new AppError(401, 'Invalid email or password');
  if (!user.isActive) throw new AppError(403, 'Your account has been suspended');
  if (!user.business.isActive) throw new AppError(403, 'This business account is inactive');

  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatch) throw new AppError(401, 'Invalid email or password');

  const accessToken = generateAccessToken({
    sub: user.id,
    bid: user.businessId,
    role: user.role,
  });
  const refreshToken = generateRefreshToken();
  await storeRefreshToken(user.id, refreshToken);

  // Update last login
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  // Cache user session in Redis
  await redis.setex(
    redisKeys.session(user.id),
    900, // 15 minutes — matches access token TTL
    JSON.stringify({ id: user.id, bid: user.businessId, role: user.role }),
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 900,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.businessId,
      businessName: user.business.name,
    },
  };
}

async function resolveBusinessId(input: LoginInput): Promise<string> {
  // If businessCode provided, scope login to that business
  if (input.businessCode) {
    const biz = await prisma.business.findUnique({ where: { slug: input.businessCode } });
    if (!biz) throw new AppError(404, 'Business not found');
    return biz.id;
  }
  // Otherwise find by email across all businesses (returns first match)
  const user = await prisma.user.findFirst({ where: { email: input.email }, select: { businessId: true } });
  if (!user) throw new AppError(401, 'Invalid email or password');
  return user.businessId;
}

// ── Refresh ───────────────────────────────────────────────────────────────────

export async function refreshAccessToken(token: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: { include: { business: { select: { isActive: true } } } } },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Refresh token is invalid or expired');
  }
  if (!stored.user.isActive || !stored.user.business.isActive) {
    throw new AppError(403, 'Account is inactive');
  }

  const accessToken = generateAccessToken({
    sub: stored.userId,
    bid: stored.user.businessId,
    role: stored.user.role,
  });

  return { accessToken, expiresIn: 900 };
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logout(userId: string, refreshToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, token: refreshToken },
    data: { revokedAt: new Date() },
  });
  await redis.del(redisKeys.session(userId));
}
