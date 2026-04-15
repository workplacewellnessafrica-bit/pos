import { z } from 'zod';

// ── Create Order (from POS) ───────────────────────────────────────────────────

export const orderLineSchema = z.object({
  productId: z.string().cuid().optional(),
  variantId: z.string().cuid().optional(),
  quantity: z.number().int().min(1),
  unitPriceAtSale: z.number().min(0),
  discount: z.number().min(0).default(0),
}).refine(d => d.productId || d.variantId, {
  message: 'Each order line must reference either a product or variant',
});

export const createOrderSchema = z.object({
  paymentMethod: z.enum(['CASH', 'MPESA', 'CARD', 'OTHER']),
  lines: z.array(orderLineSchema).min(1),
  discountTotal: z.number().min(0).default(0),
  amountTendered: z.number().min(0).optional(),
  mpesaRef: z.string().max(50).optional(),
  clientUuid: z.string().uuid().optional(), // for idempotency from offline queue
  deviceId: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ── Offline sync batch ────────────────────────────────────────────────────────

export const syncOrdersSchema = z.object({
  orders: z.array(createOrderSchema.extend({
    clientUuid: z.string().uuid(), // required for sync
    createdAt: z.string().datetime(), // device timestamp
  })).min(1).max(200),
});

export type SyncOrdersInput = z.infer<typeof syncOrdersSchema>;

// ── Update order status ───────────────────────────────────────────────────────

export const updateOrderStatusSchema = z.object({
  status: z.enum(['VOIDED', 'REFUNDED']),
  reason: z.string().max(500).optional(),
  refundAmount: z.number().min(0).optional(), // partial refund
});

// ── Order filters ─────────────────────────────────────────────────────────────

export const listOrdersQuerySchema = z.object({
  status: z.enum(['OPEN', 'COMPLETED', 'VOIDED', 'REFUNDED']).optional(),
  cashierId: z.string().cuid().optional(),
  paymentMethod: z.enum(['CASH', 'MPESA', 'CARD', 'OTHER']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
