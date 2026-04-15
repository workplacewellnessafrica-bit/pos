import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../../middleware/error.js';
import { prisma } from '../../lib/prisma.js';
import { inventoryAdjustmentSchema, receiveStockSchema } from '@dukapos/shared';
import { emitStockAlert, emitInventoryUpdated } from '../../realtime/socket.js';

export const getStockLevels = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const variants = await prisma.variant.findMany({
    where: { product: { businessId }, isActive: true },
    include: {
      product: { select: { name: true } },
      variantOptions: { include: { optionValue: { include: { variantGroup: { select: { name: true } } } } } },
    },
    orderBy: { stockQuantity: 'asc' },
  });
  res.json({ success: true, data: variants });
});

export const createAdjustment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const businessId = req.user!.bid;
  const input = inventoryAdjustmentSchema.parse(req.body);

  const variant = await prisma.variant.findFirst({
    where: { id: input.variantId, product: { businessId } },
    include: { product: { select: { name: true } } },
  });
  if (!variant) throw new AppError(404, 'Variant not found');

  const [adjustment, updated] = await prisma.$transaction([
    prisma.inventoryAdjustment.create({
      data: { variantId: input.variantId, userId, delta: input.delta, reason: input.reason, notes: input.notes },
    }),
    prisma.variant.update({
      where: { id: input.variantId },
      data: { stockQuantity: { increment: input.delta } },
    }),
  ]);

  emitInventoryUpdated(businessId, input.variantId);

  if (updated.stockQuantity <= updated.alertThreshold) {
    emitStockAlert(businessId, {
      variantId: updated.id,
      productName: variant.product.name,
      variantLabel: '',
      stockQuantity: updated.stockQuantity,
      alertThreshold: updated.alertThreshold,
    });
  }

  res.status(201).json({ success: true, data: { adjustment, newStock: updated.stockQuantity } });
});

export const listAdjustments = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const adjustments = await prisma.inventoryAdjustment.findMany({
    where: { variant: { product: { businessId } } },
    include: {
      variant: { include: { product: { select: { name: true } } } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ success: true, data: adjustments });
});

export const receiveStock = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const businessId = req.user!.bid;
  const input = receiveStockSchema.parse(req.body);

  const receipt = await prisma.$transaction(async (tx) => {
    const r = await tx.stockReceipt.create({
      data: {
        businessId,
        supplierId: input.supplierId,
        referenceNo: input.referenceNo,
        notes: input.notes,
        receivedById: userId,
        items: { create: input.items.map(i => ({ variantId: i.variantId, quantity: i.quantity, purchasePrice: i.purchasePrice })) },
      },
    });

    for (const item of input.items) {
      const updated = await tx.variant.update({
        where: { id: item.variantId },
        data: { stockQuantity: { increment: item.quantity } },
      });
      emitInventoryUpdated(businessId, item.variantId);
      await tx.inventoryAdjustment.create({
        data: { variantId: item.variantId, userId, delta: item.quantity, reason: 'RECEIVE_STOCK', notes: `Stock receipt ${r.id}` },
      });
      // Clear any low-stock alert if now above threshold
      if (updated.stockQuantity > updated.alertThreshold) {
        // notify that alert is cleared
        emitInventoryUpdated(businessId, item.variantId);
      }
    }
    return r;
  });

  res.status(201).json({ success: true, data: receipt });
});

export const getLowStockAlerts = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const alerts = await prisma.variant.findMany({
    where: {
      product: { businessId, isActive: true },
      isActive: true,
      stockQuantity: { lte: prisma.variant.fields.alertThreshold },
    },
    include: {
      product: { select: { name: true } },
      variantOptions: { include: { optionValue: true } },
    },
    orderBy: { stockQuantity: 'asc' },
  });
  res.json({ success: true, data: alerts });
});

export const listSuppliers = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const suppliers = await prisma.supplier.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: suppliers });
});

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const { name, email, phone, address } = req.body as { name: string; email?: string; phone?: string; address?: string };
  if (!name) throw new AppError(400, 'Supplier name is required');
  const supplier = await prisma.supplier.create({ data: { businessId, name, email, phone, address } });
  res.status(201).json({ success: true, data: supplier });
});
