import { z } from 'zod';

// ── Category ──────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().cuid().optional(),
});

// ── Product ───────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  categoryId: z.string().cuid().optional(),
  basePrice: z.number().min(0),
  barcode: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ── Variant Group ─────────────────────────────────────────────────────────────

export const optionValueSchema = z.object({
  id: z.string().cuid().optional(), // provided when updating
  value: z.string().min(1).max(100),
  displayOrder: z.number().int().min(0).default(0),
});

export const createVariantGroupSchema = z.object({
  name: z.string().min(1).max(100),
  displayOrder: z.number().int().min(0).default(0),
  optionValues: z.array(optionValueSchema).min(1).max(50),
});

export const upsertVariantGroupsSchema = z.object({
  groups: z.array(
    z.object({
      id: z.string().cuid().optional(),
      name: z.string().min(1).max(100),
      displayOrder: z.number().int().min(0).default(0),
      optionValues: z.array(optionValueSchema).min(1).max(50),
    })
  ).min(1).max(3),
});

export type UpsertVariantGroupsInput = z.infer<typeof upsertVariantGroupsSchema>;

// ── Variant ───────────────────────────────────────────────────────────────────

export const updateVariantSchema = z.object({
  sku: z.string().max(100).optional(),
  price: z.number().min(0).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  alertThreshold: z.number().int().min(0).optional(),
  barcode: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

export const bulkUpdateVariantsSchema = z.object({
  variants: z.array(
    z.object({
      id: z.string().cuid(),
      sku: z.string().max(100).optional(),
      price: z.number().min(0).optional(),
      stockQuantity: z.number().int().min(0).optional(),
      alertThreshold: z.number().int().min(0).optional(),
      barcode: z.string().max(100).optional(),
      isActive: z.boolean().optional(),
    })
  ).min(1),
});

// ── Inventory adjustment ──────────────────────────────────────────────────────

export const inventoryAdjustmentSchema = z.object({
  variantId: z.string().cuid(),
  delta: z.number().int().refine(d => d !== 0, { message: 'Delta cannot be zero' }),
  reason: z.enum(['DAMAGE', 'RECOUNT', 'THEFT', 'OPENING_BALANCE', 'OTHER']),
  notes: z.string().max(500).optional(),
});

export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;

export const receiveStockSchema = z.object({
  supplierId: z.string().cuid().optional(),
  referenceNo: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  items: z.array(z.object({
    variantId: z.string().cuid(),
    quantity: z.number().int().min(1),
    purchasePrice: z.number().min(0),
  })).min(1),
});

export type ReceiveStockInput = z.infer<typeof receiveStockSchema>;
