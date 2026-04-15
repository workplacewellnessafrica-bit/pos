import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../../middleware/error.js';
import { prisma } from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';
import {
  createProductSchema, updateProductSchema,
  upsertVariantGroupsSchema, updateVariantSchema, bulkUpdateVariantsSchema,
  createCategorySchema
} from '@dukapos/shared';
import { generateVariantCombinations } from '@dukapos/shared';
import { parse } from 'csv-parse/sync';

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const { categoryId, isActive, search, cursor, limit = '20' } = req.query as Record<string, string>;

  const products = await prisma.product.findMany({
    where: {
      businessId,
      ...(categoryId ? { categoryId } : {}),
      ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(cursor ? { id: { gt: cursor } } : {}),
    },
    take: Math.min(parseInt(limit), 100),
    orderBy: { name: 'asc' },
    include: {
      category: { select: { id: true, name: true } },
      _count: { select: { variants: true } },
    },
  });

  res.json({ success: true, data: products });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const input = createProductSchema.parse(req.body);

  const product = await prisma.product.create({
    data: { 
      ...input, 
      businessId, 
      basePrice: input.basePrice,
      description: input.description ?? null,
      categoryId: input.categoryId ?? null,
      barcode: input.barcode ?? null,
    },
  });

  res.status(201).json({ success: true, data: product });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const product = await prisma.product.findFirst({
    where: { id: req.params['id'] as string, businessId },
    include: {
      variantGroups: { include: { optionValues: { orderBy: { displayOrder: 'asc' } } }, orderBy: { displayOrder: 'asc' } },
      variants: { include: { variantOptions: { include: { optionValue: { include: { variantGroup: true } } } } } },
      category: true,
    },
  });
  if (!product) throw new AppError(404, 'Product not found');
  res.json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const input = updateProductSchema.parse(req.body);
  const product = await prisma.product.updateMany({
    where: { id: req.params['id'] as string, businessId },
    data: {
      ...input,
      description: input.description ?? undefined,
      categoryId: input.categoryId ?? undefined,
      barcode: input.barcode ?? undefined,
    } as any,
  });
  if (product.count === 0) throw new AppError(404, 'Product not found');
  res.json({ success: true, message: 'Product updated' });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  await prisma.product.updateMany({
    where: { id: req.params['id'] as string, businessId },
    data: { isActive: false },
  });
  res.json({ success: true, message: 'Product deactivated' });
});

export const upsertVariantGroups = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const productId = req.params['id']!;
  const { groups } = upsertVariantGroupsSchema.parse(req.body);

  const product = await prisma.product.findFirst({ where: { id: productId, businessId } });
  if (!product) throw new AppError(404, 'Product not found');
  if (groups.length > 3) throw new AppError(400, 'Maximum 3 variant groups per product');

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Delete existing groups and cascade
    await tx.variantGroup.deleteMany({ where: { productId } });

    // Recreate groups and option values
    for (const group of groups) {
      await tx.variantGroup.create({
        data: {
          productId,
          name: group.name,
          displayOrder: group.displayOrder,
          optionValues: { create: group.optionValues.map(ov => ({ value: ov.value, displayOrder: ov.displayOrder })) },
        },
      });
    }

    // Fetch created groups with option values
    const createdGroups = await tx.variantGroup.findMany({
      where: { productId },
      include: { optionValues: true },
    });

    // Generate and create all variant combinations
    const combinations = generateVariantCombinations(
      createdGroups.map((g: any) => ({ id: g.id, name: g.name, optionValues: g.optionValues }))
    );

    // Delete existing variants and recreate
    await tx.variant.deleteMany({ where: { productId } });

    for (const combo of combinations) {
      const variant = await tx.variant.create({
        data: { productId, price: product.basePrice, stockQuantity: 0 },
      });
      await tx.variantOption.createMany({
        data: combo.map(o => ({ variantId: variant.id, optionValueId: o.valueId })),
      });
    }

    await tx.product.update({ where: { id: productId }, data: { hasVariants: true } });
  });

  res.json({ success: true, message: 'Variant groups saved and combinations generated' });
});

export const listVariants = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const variants = await prisma.variant.findMany({
    where: { product: { id: req.params['id'], businessId } },
    include: { variantOptions: { include: { optionValue: { include: { variantGroup: true } } } } },
  });
  res.json({ success: true, data: variants });
});

export const updateVariant = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const input = updateVariantSchema.parse(req.body);
  const updated = await prisma.variant.updateMany({
    where: { id: req.params['variantId'] as string, product: { businessId } },
    data: {
      ...input,
      sku: input.sku ?? undefined,
      barcode: input.barcode ?? undefined,
    } as any,
  });
  if (updated.count === 0) throw new AppError(404, 'Variant not found');
  res.json({ success: true, message: 'Variant updated' });
});

export const bulkUpdateVariants = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const { variants } = bulkUpdateVariantsSchema.parse(req.body);

  await prisma.$transaction(
    variants.map(v =>
      prisma.variant.updateMany({
        where: { id: v.id as string, product: { businessId } },
        data: { 
          sku: v.sku ?? null, 
          price: v.price, 
          stockQuantity: v.stockQuantity, 
          alertThreshold: v.alertThreshold ?? 5, 
          barcode: v.barcode ?? null, 
          isActive: v.isActive 
        },
      })
    )
  );

  res.json({ success: true, message: `${variants.length} variants updated` });
});

export const uploadProductImages = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) throw new AppError(400, 'No images uploaded');
  
  const urls = files.map(f => f.path);
  const businessId = req.user!.bid;
  const productId = req.params['id']!;

  // Append to existing images
  const product = await prisma.product.findFirst({ where: { id: productId, businessId } });
  if (!product) throw new AppError(404, 'Product not found');

  const updatedImages = [...product.images, ...urls];
  await prisma.product.update({
    where: { id: productId },
    data: { images: updatedImages },
  });

  res.json({ success: true, data: { urls: updatedImages } });
});

export const uploadVariantImages = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: { urls: [] } });
});

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const categories = await prisma.category.findMany({
    where: { businessId },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: categories });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  const { name } = createCategorySchema.parse(req.body);
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cat = await prisma.category.create({ data: { businessId, name, slug } });
  res.status(201).json({ success: true, data: cat });
});

export const importCsv = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user!.bid;
  if (!req.file) throw new AppError(400, 'No CSV file uploaded');

  const fileContent = req.file.buffer.toString('utf-8');
  const records = parse(fileContent, { columns: true, skip_empty_lines: true });
  if (!records.length) throw new AppError(400, 'CSV is empty');

  // Basic flat product import for v1. Variants map to simple products or can be grouped by Name.
  // We'll create simple products for now as a baseline capability.
  let added = 0;
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const row of records) {
      if (!row.Name || !row.BasePrice) continue;
      
      const product = await tx.product.create({
        data: {
          businessId,
          name: row.Name,
          basePrice: row.BasePrice,
          barcode: row.Barcode || null,
          hasVariants: false,
          description: row.Description || null,
        }
      });
      
      await tx.variant.create({
        data: {
          productId: product.id,
          sku: row.SKU || null,
          price: row.BasePrice,
          stockQuantity: Number(row.StockQuantity) || 0,
          alertThreshold: Number(row.AlertThreshold) || 5,
          barcode: row.Barcode || null,
        }
      });
      added++;
    }
  });

  res.json({ success: true, message: `Imported ${added} products` });
});
