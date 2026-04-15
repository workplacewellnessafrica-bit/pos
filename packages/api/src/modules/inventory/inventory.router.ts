import { Router } from 'express';
import { authenticate, requireRole, businessScope } from '../../middleware/auth.js';
import * as ctrl from './inventory.controller.js';

export const inventoryRouter = Router();
inventoryRouter.use(authenticate, businessScope);

inventoryRouter.get('/stock',          requireRole('OWNER','MANAGER','STOCK_CLERK','VIEWER'), ctrl.getStockLevels);
inventoryRouter.post('/adjustments',   requireRole('OWNER','MANAGER','STOCK_CLERK'), ctrl.createAdjustment);
inventoryRouter.get('/adjustments',    requireRole('OWNER','MANAGER','STOCK_CLERK'), ctrl.listAdjustments);
inventoryRouter.post('/receive',       requireRole('OWNER','MANAGER','STOCK_CLERK'), ctrl.receiveStock);
inventoryRouter.get('/alerts',         requireRole('OWNER','MANAGER','STOCK_CLERK'), ctrl.getLowStockAlerts);
inventoryRouter.get('/suppliers',      requireRole('OWNER','MANAGER','STOCK_CLERK'), ctrl.listSuppliers);
inventoryRouter.post('/suppliers',     requireRole('OWNER','MANAGER'), ctrl.createSupplier);
