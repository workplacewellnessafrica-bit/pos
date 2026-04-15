import { Router } from 'express';
import { authenticate, requireRole, businessScope } from '../../middleware/auth.js';
import * as ctrl from './orders.controller.js';

export const ordersRouter = Router();
ordersRouter.use(authenticate, businessScope);

ordersRouter.get('/',         requireRole('OWNER', 'MANAGER', 'CASHIER'), ctrl.listOrders);
ordersRouter.post('/',        requireRole('OWNER', 'MANAGER', 'CASHIER'), ctrl.createOrder);
ordersRouter.post('/sync',    requireRole('OWNER', 'MANAGER', 'CASHIER'), ctrl.syncOfflineOrders);
ordersRouter.get('/:id',      requireRole('OWNER', 'MANAGER', 'CASHIER'), ctrl.getOrder);
ordersRouter.patch('/:id/status', requireRole('OWNER', 'MANAGER'),       ctrl.updateOrderStatus);
