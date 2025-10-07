// src/modules/auth/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/authMiddleware';

export const createAuthRouter = (authController: AuthController): Router => {
  const router = Router();

  // Pubbliche
  router.post('/register', authController.register);
  router.post('/login', authController.login);
  router.post('/refresh', authController.refreshToken);
  router.post('/request-reset-password', authController.requestPasswordReset);
  router.post('/reset-password', authController.confirmPasswordReset);

  // Protette (richiedono autenticazione)
  router.post('/logout', authController.logout);
  router.post('/logout-all', authenticate, authController.logoutAll);
  router.post('/change-password', authenticate, authController.changePassword);
  router.get('/me', authenticate, authController.getCurrentAccount);

  return router;
};
