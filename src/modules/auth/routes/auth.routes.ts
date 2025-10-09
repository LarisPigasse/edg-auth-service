// src/modules/auth/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/authMiddleware';
// Import disponibili per RBAC (usare quando necessario):
// import { requirePermission, requireRoot, requireModuleAccess } from '../middleware/permissionMiddleware';

/**
 * Crea router per modulo Auth
 *
 * NOTA RBAC:
 * Le route attuali sono tutte SELF-SERVICE (l'utente opera sul proprio account),
 * quindi non richiedono permessi RBAC - solo autenticazione.
 *
 * Quando aggiungere requirePermission:
 * - Operazioni su account di altri utenti (admin che gestisce utenti)
 * - Operazioni su risorse condivise (es. configurazioni globali)
 * - Endpoint che richiedono ruoli specifici
 *
 * Esempio futuro:
 *   router.delete('/accounts/:id',
 *     authenticate,
 *     requirePermission('gestione', 'delete'),
 *     adminController.deleteAccount
 *   );
 */
export const createAuthRouter = (authController: AuthController): Router => {
  const router = Router();

  // ============================================================================
  // ENDPOINT PUBBLICI (nessuna autenticazione richiesta)
  // ============================================================================

  /**
   * POST /auth/register
   * Registrazione nuovo account
   *
   * Body: { email, password, accountType, entityId, roleId }
   */
  router.post('/register', authController.register);

  /**
   * POST /auth/login
   * Login account
   *
   * Body: { email, password, accountType }
   * Response: { accessToken, refreshToken, account }
   */
  router.post('/login', authController.login);

  /**
   * POST /auth/refresh
   * Refresh access token
   *
   * Body: { refreshToken }
   * Response: { accessToken, refreshToken, account }
   */
  router.post('/refresh', authController.refreshToken);

  /**
   * POST /auth/request-reset-password
   * Richiesta reset password
   *
   * Body: { email, accountType }
   */
  router.post('/request-reset-password', authController.requestPasswordReset);

  /**
   * POST /auth/reset-password
   * Conferma reset password con token
   *
   * Body: { token, newPassword }
   */
  router.post('/reset-password', authController.confirmPasswordReset);

  // ============================================================================
  // ENDPOINT PROTETTI - SELF-SERVICE (solo authenticate)
  // ============================================================================

  /**
   * POST /auth/logout
   * Logout dalla sessione corrente
   *
   * Body: { refreshToken }
   * Richiede: Autenticazione
   *
   * NOTA: Non serve RBAC perché l'utente opera sulla propria sessione
   */
  router.post('/logout', authController.logout);

  /**
   * POST /auth/logout-all
   * Logout da TUTTE le sessioni dell'utente corrente
   *
   * Headers: Authorization Bearer token
   * Richiede: Autenticazione
   *
   * NOTA: Opera su tutte le sessioni dell'utente loggato (self-service).
   * Non serve RBAC perché ogni utente può revocare le proprie sessioni.
   *
   * Se in futuro servisse un endpoint admin per forzare logout di altri utenti:
   *   POST /admin/accounts/:accountId/logout-all
   *     authenticate + requirePermission('gestione', 'update')
   */
  router.post('/logout-all', authenticate, authController.logoutAll);

  /**
   * POST /auth/change-password
   * Cambio password (utente autenticato)
   *
   * Body: { oldPassword, newPassword }
   * Headers: Authorization Bearer token
   * Richiede: Autenticazione
   *
   * NOTA: L'utente cambia la propria password - non serve RBAC
   */
  router.post('/change-password', authenticate, authController.changePassword);

  /**
   * GET /auth/me
   * Info account corrente
   *
   * Headers: Authorization Bearer token
   * Richiede: Autenticazione
   * Response: { account, permissions }
   *
   * NOTA: Legge i propri dati - non serve RBAC
   */
  router.get('/me', authenticate, authController.getCurrentAccount);

  // ============================================================================
  // ENDPOINT AMMINISTRATIVI (futuro)
  // ============================================================================

  /*
   * Quando aggiungerai endpoint per admin che gestiscono altri account,
   * usare i middleware RBAC:
   * 
   * // Lista tutti gli account (solo admin)
   router.get('/accounts',
     authenticate,
     requirePermission('gestione', 'read'),
     adminController.listAccounts
   );
   * 
   * // Crea account per altri (solo admin)
   * router.post('/accounts',
   *   authenticate,
   *   requirePermission('gestione', 'create'),
   *   adminController.createAccount
   * );
   * 
   * // Disattiva account (solo admin)
   * router.put('/accounts/:id/deactivate',
   *   authenticate,
   *   requirePermission('gestione', 'update'),
   *   adminController.deactivateAccount
   * );
   * 
   * // Elimina account (solo admin)
   * router.delete('/accounts/:id',
   *   authenticate,
   *   requirePermission('gestione', 'delete'),
   *   adminController.deleteAccount
   * );
   * 
   * // Backup sistema (solo root)
   * router.post('/system/backup',
   *   authenticate,
   *   requireRoot(),
   *   systemController.backup
   * );
   */

  return router;
};
