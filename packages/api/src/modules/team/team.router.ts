import { Router } from 'express';
import { authenticate, requireRole, businessScope } from '../../middleware/auth.js';
import * as ctrl from './team.controller.js';
import * as inviteCtrl from './invite.controller.js';

export const teamRouter: Router = Router();
teamRouter.use(authenticate, businessScope);

teamRouter.get('/',           requireRole('OWNER', 'MANAGER'), ctrl.listStaff);
teamRouter.post('/',          requireRole('OWNER'),            ctrl.createStaff);
teamRouter.get('/:id',        requireRole('OWNER', 'MANAGER'), ctrl.getStaff);
teamRouter.patch('/:id',      requireRole('OWNER'),            ctrl.updateStaff);
teamRouter.delete('/:id',     requireRole('OWNER'),            ctrl.deactivateStaff);
teamRouter.post('/:id/kick',  requireRole('OWNER'),            ctrl.kickSession);

// Invitations
teamRouter.get('/invites',          requireRole('OWNER', 'MANAGER'), inviteCtrl.listInvitations);
teamRouter.post('/invites',         requireRole('OWNER', 'MANAGER'), inviteCtrl.createInvitation);
teamRouter.delete('/invites/:id',   requireRole('OWNER', 'MANAGER'), inviteCtrl.revokeInvitation);
