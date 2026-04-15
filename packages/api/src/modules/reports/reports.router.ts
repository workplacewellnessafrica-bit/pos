import { Router } from 'express';
import { authenticate, requireRole, businessScope } from '../../middleware/auth.js';
import * as ctrl from './reports.controller.js';

export const reportsRouter: Router = Router();
reportsRouter.use(authenticate, businessScope);
reportsRouter.use(requireRole('OWNER', 'MANAGER', 'VIEWER'));

reportsRouter.get('/revenue',  ctrl.revenueReport);
reportsRouter.get('/products', ctrl.productsReport);
reportsRouter.get('/staff',    ctrl.staffReport);
reportsRouter.get('/export',   ctrl.exportXls);
