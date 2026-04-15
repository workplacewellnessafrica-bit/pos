import { Router } from 'express';
import { authenticate, requireRole, businessScope } from '../../middleware/auth.js';
import * as ctrl from './settings.controller.js';

export const settingsRouter: Router = Router();
settingsRouter.use(authenticate, businessScope);

settingsRouter.get('/',         requireRole('OWNER'), ctrl.getSettings);
settingsRouter.patch('/',       requireRole('OWNER'), ctrl.updateSettings);
settingsRouter.patch('/business', requireRole('OWNER'), ctrl.updateBusinessProfile);
