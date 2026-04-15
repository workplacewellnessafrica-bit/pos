import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.js';
import { prisma } from '../../lib/prisma.js';

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const [business, settings] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, slug: true, email: true, phone: true, address: true, logoUrl: true, taxNumber: true, currency: true, locale: true, country: true, category: true, planTier: true },
    }),
    prisma.businessSettings.findUnique({ where: { businessId } }),
  ]);
  res.json({ success: true, data: { business, settings } });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const { taxRate, taxInclusive, receiptFooter, receiptPhone, enableCash, enableMpesa, enableCard, enableOther, lowStockEmailAlert, lowStockSmsAlert, autoPrintReceipt } = req.body as Record<string, unknown>;

  await prisma.businessSettings.upsert({
    where: { businessId },
    create: { businessId, ...(req.body as object) },
    update: { taxRate: taxRate as number, taxInclusive: taxInclusive as boolean, receiptFooter: receiptFooter as string, receiptPhone: receiptPhone as string, enableCash: enableCash as boolean, enableMpesa: enableMpesa as boolean, enableCard: enableCard as boolean, enableOther: enableOther as boolean, lowStockEmailAlert: lowStockEmailAlert as boolean, lowStockSmsAlert: lowStockSmsAlert as boolean, autoPrintReceipt: autoPrintReceipt as boolean },
  });

  res.json({ success: true, message: 'Settings updated' });
});

export const updateBusinessProfile = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const { name, phone, address, taxNumber, currency, locale } = req.body as Record<string, string>;
  await prisma.business.update({
    where: { id: businessId },
    data: { 
      name, 
      phone: phone ?? null, 
      address: address ?? null, 
      taxNumber: taxNumber ?? null, 
      currency, 
      locale 
    },
  });
  res.json({ success: true, message: 'Business profile updated' });
});
