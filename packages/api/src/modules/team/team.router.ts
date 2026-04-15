import { Router } from 'express';
import { authenticate, requireRole, businessScope } from '../../middleware/auth.js';
import * as ctrl from './team.controller.js';

export const teamRouter = Router();
teamRouter.use(authenticate, businessScope);

teamRouter.get('/',           requireRole('OWNER', 'MANAGER'), ctrl.listStaff);
teamRouter.post('/',          requireRole('OWNER'),            ctrl.createStaff);
teamRouter.get('/:id',        requireRole('OWNER', 'MANAGER'), ctrl.getStaff);
teamRouter.patch('/:id',      requireRole('OWNER'),            ctrl.updateStaff);
teamRouter.delete('/:id',     requireRole('OWNER'),            ctrl.deactivateStaff);
teamRouter.post('/:id/kick',  requireRole('OWNER'),            ctrl.kickSession);
