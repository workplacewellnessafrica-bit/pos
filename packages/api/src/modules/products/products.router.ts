import { Router } from 'express';
import { authenticate, requireRole, businessScope } from '../../middleware/auth.js';
import { upload } from '../../lib/upload.js';
import multer from 'multer';
const memUpload = multer({ storage: multer.memoryStorage() });
import { CAN_MANAGE_PRODUCTS } from '@dukapos/shared';
import * as ctrl from './products.controller.js';

export const productsRouter = Router();
productsRouter.use(authenticate, businessScope);

// Products
productsRouter.get('/',           ctrl.listProducts);
productsRouter.post('/',          requireRole('OWNER','MANAGER'), ctrl.createProduct);
productsRouter.get('/:id',        ctrl.getProduct);
productsRouter.post('/import',    requireRole('OWNER','MANAGER'), memUpload.single('file'), ctrl.importCsv);
productsRouter.patch('/:id',      requireRole('OWNER','MANAGER'), ctrl.updateProduct);
productsRouter.delete('/:id',     requireRole('OWNER','MANAGER'), ctrl.deleteProduct);

// Variant groups (upsert replaces all groups in one shot)
productsRouter.put('/:id/variant-groups', requireRole('OWNER','MANAGER'), ctrl.upsertVariantGroups);

// Variants
productsRouter.get('/:id/variants',         ctrl.listVariants);
productsRouter.patch('/variants/:variantId', requireRole('OWNER','MANAGER'), ctrl.updateVariant);
productsRouter.patch('/variants/bulk',       requireRole('OWNER','MANAGER'), ctrl.bulkUpdateVariants);

// Images
productsRouter.post('/:id/images',                  requireRole('OWNER','MANAGER'), upload.array('images', 5), ctrl.uploadProductImages);
productsRouter.post('/variants/:variantId/images',  requireRole('OWNER','MANAGER'), upload.array('images', 5), ctrl.uploadVariantImages);

// Categories
productsRouter.get('/categories',    ctrl.listCategories);
productsRouter.post('/categories',   requireRole('OWNER','MANAGER'), ctrl.createCategory);
