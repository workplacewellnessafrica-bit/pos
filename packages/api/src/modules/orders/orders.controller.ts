import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../../middleware/error.js';
import { prisma } from '../../lib/prisma.js';
import { createOrderSchema, listOrdersQuerySchema, updateOrderStatusSchema, syncOrdersSchema } from '@dukapos/shared';
import { calculateCartTotals } from '@dukapos/shared';
import { emitSaleNew, emitStockAlert, emitSyncAck } from '../../realtime/socket.js';
import { PaydService } from '../../lib/payd.js';
import { generateReceiptHTML } from '../../modifiers/receipt.js';
import { nanoid } from 'nanoid';

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const query = listOrdersQuerySchema.parse(req.query);

  const where: Parameters<typeof prisma.order.findMany>[0]['where'] = {
    businessId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.cashierId ? { cashierId: query.cashierId } : {}),
    ...(query.paymentMethod ? { paymentMethod: query.paymentMethod } : {}),
    ...(query.dateFrom || query.dateTo ? {
      createdAt: {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
      },
    } : {}),
    // Cashier can only see their own orders
    ...(req.user?.role === 'CASHIER' ? { cashierId: req.user.sub } : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    take: query.limit,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      cashier: { select: { name: true } },
      _count: { select: { lines: true } },
    },
  });

  res.json({
    success: true,
    data: orders,
    meta: {
      cursor: orders[orders.length - 1]?.id,
      hasMore: orders.length === query.limit,
    },
  });
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const cashierId = req.user!.sub;
  const input = createOrderSchema.parse(req.body);

  // Idempotency — check if this order was already processed (offline sync)
  if (input.clientUuid) {
    const existing = await prisma.order.findUnique({ where: { clientUuid: input.clientUuid } });
    if (existing) {
      res.json({ success: true, data: existing, message: 'Order already processed (idempotent)' });
      return;
    }
  }

  // Fetch tax settings
  const settings = await prisma.businessSettings.findUnique({ where: { businessId } });
  const taxRate = Number(settings?.taxRate ?? 16);
  const taxInclusive = settings?.taxInclusive ?? false;

  // Build cart items for total calculation
  const cartItems = input.lines.map(l => ({
    unitPrice: l.unitPriceAtSale,
    quantity: l.quantity,
    discount: l.discount,
  }));
  const { subtotal, discountTotal, taxAmount, total } = calculateCartTotals(cartItems, taxRate, taxInclusive);

  const receiptNo = `RCP-${nanoid(8).toUpperCase()}`;

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        businessId,
        cashierId,
        paymentMethod: input.paymentMethod,
        subtotal,
        discountTotal: discountTotal + (input.discountTotal ?? 0),
        taxAmount,
        total,
        amountTendered: input.amountTendered,
        changeDue: input.amountTendered ? Math.max(0, input.amountTendered - total) : null,
        mpesaRef: input.mpesaRef,
        receiptNo,
        clientUuid: input.clientUuid,
        deviceId: input.deviceId,
        notes: input.notes,
        status: 'COMPLETED',
        lines: {
          create: input.lines.map(l => ({
            productId: l.productId,
            variantId: l.variantId,
            quantity: l.quantity,
            unitPriceAtSale: l.unitPriceAtSale,
            discount: l.discount,
            lineTotal: (l.unitPriceAtSale * l.quantity) - l.discount,
          })),
        },
      },
    });

    // Deduct stock for each variant line
    for (const line of input.lines) {
      if (!line.variantId) continue;
      const updated = await tx.variant.update({
        where: { id: line.variantId },
        data: { stockQuantity: { decrement: line.quantity } },
      });

      // Emit stock alert if below threshold
      if (updated.stockQuantity <= updated.alertThreshold) {
        const product = await tx.product.findFirst({ where: { id: updated.productId }, select: { name: true } });
        setImmediate(() => emitStockAlert(businessId, {
          variantId: updated.id,
          productName: product?.name ?? '',
          variantLabel: '',
          stockQuantity: updated.stockQuantity,
          alertThreshold: updated.alertThreshold,
        }));
      }
    }

    return newOrder;
  });

  // Notify connected clients
  const cashier = await prisma.user.findUnique({ where: { id: cashierId }, select: { name: true } });
  emitSaleNew(businessId, {
    orderId: order.id,
    receiptNo: order.receiptNo,
    total: total.toString(),
    cashierName: cashier?.name ?? '',
    paymentMethod: input.paymentMethod,
  });

  res.status(201).json({ success: true, data: order });
});

export const syncOfflineOrders = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const { orders } = syncOrdersSchema.parse(req.body);
  const processedIds: string[] = [];
  const failedIds: Array<{ clientUuid: string; error: string }> = [];

  for (const order of orders) {
    try {
      // Reuse createOrder logic with clientUuid idempotency
      req.body = order;
      // Quick inline create — uses same idempotency logic
      const existing = await prisma.order.findUnique({ where: { clientUuid: order.clientUuid } });
      if (existing) { processedIds.push(order.clientUuid); continue; }

      const settings = await prisma.businessSettings.findUnique({ where: { businessId } });
      const taxRate = Number(settings?.taxRate ?? 16);
      const taxInclusive = settings?.taxInclusive ?? false;
      const cartItems = order.lines.map(l => ({ unitPrice: l.unitPriceAtSale, quantity: l.quantity, discount: l.discount }));
      const { subtotal, discountTotal, taxAmount, total } = calculateCartTotals(cartItems, taxRate, taxInclusive);

      await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            businessId, cashierId: req.user!.sub,
            paymentMethod: order.paymentMethod,
            subtotal, discountTotal, taxAmount, total,
            amountTendered: order.amountTendered,
            mpesaRef: order.mpesaRef,
            receiptNo: `RCP-${nanoid(8).toUpperCase()}`,
            clientUuid: order.clientUuid,
            deviceId: order.deviceId,
            status: 'COMPLETED',
            lines: { create: order.lines.map(l => ({
              productId: l.productId, variantId: l.variantId,
              quantity: l.quantity, unitPriceAtSale: l.unitPriceAtSale,
              discount: l.discount, lineTotal: (l.unitPriceAtSale * l.quantity) - l.discount,
            })) },
          },
        });
        for (const line of order.lines) {
          if (line.variantId) {
            await tx.variant.update({ where: { id: line.variantId }, data: { stockQuantity: { decrement: line.quantity } } });
          }
        }
        return newOrder;
      });
      processedIds.push(order.clientUuid);
    } catch (e) {
      failedIds.push({ clientUuid: order.clientUuid, error: (e as Error).message });
    }
  }

  emitSyncAck(businessId, { processedIds, failedIds });
  res.json({ success: true, data: { processedIds, failedIds } });
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const order = await prisma.order.findFirst({
    where: { id: req.params['id'], businessId },
    include: {
      lines: { include: { variant: { include: { variantOptions: { include: { optionValue: { include: { variantGroup: true } } } } } }, product: { select: { name: true, images: true } } } },
      cashier: { select: { name: true, email: true } },
      refunds: true,
    },
  });
  if (!order) throw new AppError(404, 'Order not found');
  res.json({ success: true, data: order });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const { status, refundAmount } = updateOrderStatusSchema.parse(req.body);

  const order = await prisma.order.findFirst({ where: { id: req.params['id'], businessId } });
  if (!order) throw new AppError(404, 'Order not found');

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status } });
    if (status === 'REFUNDED') {
      await tx.refund.create({ data: { orderId: order.id, amount: refundAmount ?? order.total } });
      // Restore stock
      const lines = await tx.orderLine.findMany({ where: { orderId: order.id } });
      for (const line of lines) {
        if (line.variantId) {
          await tx.variant.update({ where: { id: line.variantId }, data: { stockQuantity: { increment: line.quantity } } });
        }
      }
    }
  });

  res.json({ success: true, message: `Order ${status.toLowerCase()}` });
});

export const checkoutPayd = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const cashierId = req.user!.sub;
  const { phoneNumber, orderData } = req.body; // orderData = createOrderSchema payload
  
  if (!phoneNumber) throw new AppError(400, 'Phone number required for Payd STK Push');
  const input = createOrderSchema.parse(orderData);

  // 1. Create order as PENDING
  const settings = await prisma.businessSettings.findUnique({ where: { businessId } });
  const taxRate = Number(settings?.taxRate ?? 16);
  const cartItems = input.lines.map(l => ({ unitPrice: l.unitPriceAtSale, quantity: l.quantity, discount: l.discount }));
  const { subtotal, discountTotal, taxAmount, total } = calculateCartTotals(cartItems, taxRate, settings?.taxInclusive ?? false);

  const receiptNo = `RCP-${nanoid(8).toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      businessId, cashierId,
      paymentMethod: 'MPESA',
      subtotal, discountTotal: discountTotal + (input.discountTotal ?? 0),
      taxAmount, total,
      receiptNo,
      status: 'PENDING',
      lines: {
        create: input.lines.map(l => ({
          productId: l.productId, variantId: l.variantId,
          quantity: l.quantity, unitPriceAtSale: l.unitPriceAtSale,
          discount: l.discount, lineTotal: (l.unitPriceAtSale * l.quantity) - l.discount,
        })),
      },
    },
  });

  // 2. Initiate STK Push via Payd Kenya
  const paydRes = await PaydService.requestSTKPush(phoneNumber, total, receiptNo, `Payment for Order ${receiptNo}`);

  // We could save paydRes.transactionId to the order here if we tracked it
  
  res.status(200).json({ success: true, data: { orderId: order.id, status: paydRes.status, transactionId: paydRes.transactionId } });
});

export const downloadReceipt = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  
  const order = await prisma.order.findFirst({
    where: { id: req.params['id'], businessId },
    include: {
      lines: { include: { variant: { include: { variantOptions: { include: { optionValue: true } } } }, product: true } },
      cashier: true,
      business: true,
    },
  });

  if (!order) throw new AppError(404, 'Order not found');

  const html = generateReceiptHTML(order, order.business);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});
