// src/modules/auth/middleware/permissionMiddleware.ts
import { Request, Response, NextFunction } from 'express';

// ============================================================================
// PERMISSION CHECKER - Logica di verifica permessi
// ============================================================================

export class PermissionChecker {
  /**
   * Verifica se l'utente ha il permesso richiesto
   *
   * Sistema a permessi composti con wildcards:
   * - Permesso specifico: 'spedizioni.read'
   * - Wildcard modulo: 'spedizioni.*' (tutte le azioni su spedizioni)
   * - Wildcard globale: '*' (accesso completo - solo root)
   *
   * Nessuna gerarchia implicita: 'create' NON implica 'read'
   */
  static hasPermission(userPermissions: string[], module: string, action: string): boolean {
    // 1. Root ha tutto
    if (userPermissions.includes('*')) {
      return true;
    }

    // 2. Wildcard modulo (es. 'spedizioni.*' copre tutte le azioni su spedizioni)
    if (userPermissions.includes(`${module}.*`)) {
      return true;
    }

    // 3. Permesso specifico (es. 'spedizioni.read')
    if (userPermissions.includes(`${module}.${action}`)) {
      return true;
    }

    // 4. Nessun permesso trovato
    return false;
  }

  /**
   * Verifica se ha TUTTI i permessi richiesti
   */
  static hasAllPermissions(userPermissions: string[], requirements: Array<{ module: string; action: string }>): boolean {
    return requirements.every(req => this.hasPermission(userPermissions, req.module, req.action));
  }

  /**
   * Verifica se ha ALMENO UNO dei permessi richiesti
   */
  static hasAnyPermission(userPermissions: string[], requirements: Array<{ module: string; action: string }>): boolean {
    return requirements.some(req => this.hasPermission(userPermissions, req.module, req.action));
  }

  /**
   * Verifica se ha accesso completo a un modulo
   */
  static hasModuleAccess(userPermissions: string[], module: string): boolean {
    return userPermissions.includes('*') || userPermissions.includes(`${module}.*`);
  }
}

// ============================================================================
// MIDDLEWARE EXPRESS
// ============================================================================

/**
 * Middleware principale: richiede permesso specifico
 *
 * Uso:
 *   router.get('/spedizioni', authenticate, requirePermission('spedizioni', 'read'), handler)
 *   router.post('/spedizioni', authenticate, requirePermission('spedizioni', 'create'), handler)
 *   router.delete('/spedizioni/:id', authenticate, requirePermission('spedizioni', 'delete'), handler)
 *
 * @param module - Nome del modulo (es. 'spedizioni', 'gestione', 'report')
 * @param action - Azione richiesta (es. 'read', 'create', 'update', 'delete')
 */
export const requirePermission = (module: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const account = (req as any).account;

    // Verifica autenticazione
    if (!account) {
      res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta',
      });
      return;
    }

    // Verifica presenza permissions
    if (!account.permissions || !Array.isArray(account.permissions)) {
      res.status(403).json({
        success: false,
        error: 'Permessi non configurati per questo account',
      });
      return;
    }

    // Verifica permesso
    const hasAccess = PermissionChecker.hasPermission(account.permissions, module, action);

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Permessi insufficienti',
        required: {
          module,
          action,
          permission: `${module}.${action}`,
        },
        message: `Questo endpoint richiede il permesso: ${module}.${action}`,
      });
      return;
    }

    // Accesso consentito
    next();
  };
};

/**
 * Middleware: richiede TUTTI i permessi specificati
 *
 * Uso:
 *   requireAllPermissions([
 *     { module: 'spedizioni', action: 'read' },
 *     { module: 'gestione', action: 'update' }
 *   ])
 */
export const requireAllPermissions = (requirements: Array<{ module: string; action: string }>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const account = (req as any).account;

    if (!account) {
      res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta',
      });
      return;
    }

    if (!account.permissions || !Array.isArray(account.permissions)) {
      res.status(403).json({
        success: false,
        error: 'Permessi non configurati',
      });
      return;
    }

    const hasAccess = PermissionChecker.hasAllPermissions(account.permissions, requirements);

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Permessi insufficienti',
        required: requirements,
        message: 'Questo endpoint richiede tutti i permessi specificati',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware: richiede ALMENO UNO dei permessi specificati
 *
 * Uso:
 *   requireAnyPermission([
 *     { module: 'spedizioni', action: 'read' },
 *     { module: 'report', action: 'read' }
 *   ])
 */
export const requireAnyPermission = (requirements: Array<{ module: string; action: string }>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const account = (req as any).account;

    if (!account) {
      res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta',
      });
      return;
    }

    if (!account.permissions || !Array.isArray(account.permissions)) {
      res.status(403).json({
        success: false,
        error: 'Permessi non configurati',
      });
      return;
    }

    const hasAccess = PermissionChecker.hasAnyPermission(account.permissions, requirements);

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Permessi insufficienti',
        required: requirements,
        message: 'Questo endpoint richiede almeno uno dei permessi specificati',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware: richiede accesso completo a un modulo (wildcard)
 *
 * Uso:
 *   requireModuleAccess('gestione')  // Richiede 'gestione.*' o '*'
 */
export const requireModuleAccess = (module: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const account = (req as any).account;

    if (!account) {
      res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta',
      });
      return;
    }

    if (!account.permissions || !Array.isArray(account.permissions)) {
      res.status(403).json({
        success: false,
        error: 'Permessi non configurati',
      });
      return;
    }

    const hasAccess = PermissionChecker.hasModuleAccess(account.permissions, module);

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Accesso al modulo negato',
        required: {
          module,
          permission: `${module}.*`,
        },
        message: `Questo endpoint richiede accesso completo al modulo: ${module}`,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware: solo root
 *
 * Uso:
 *   router.post('/system/backup', authenticate, requireRoot(), handler)
 */
export const requireRoot = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const account = (req as any).account;

    if (!account) {
      res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta',
      });
      return;
    }

    if (!account.permissions || !Array.isArray(account.permissions)) {
      res.status(403).json({
        success: false,
        error: 'Permessi non configurati',
      });
      return;
    }

    const isRoot = account.permissions.includes('*');

    if (!isRoot) {
      res.status(403).json({
        success: false,
        error: 'Accesso riservato solo a root',
        message: "Questo endpoint è accessibile solo all'amministratore di sistema",
      });
      return;
    }

    next();
  };
};

// ============================================================================
// UTILITY FUNCTIONS (per uso nel codice, non middleware)
// ============================================================================

/**
 * Verifica permesso in modo programmatico (non middleware)
 *
 * Uso nel codice:
 *   if (canPerform(user.permissions, 'spedizioni', 'delete')) {
 *     // mostra bottone elimina
 *   }
 */
export function canPerform(permissions: string[], module: string, action: string): boolean {
  return PermissionChecker.hasPermission(permissions, module, action);
}

/**
 * Ottieni lista permessi mancanti
 */
export function getMissingPermissions(
  userPermissions: string[],
  requiredPermissions: Array<{ module: string; action: string }>
): Array<{ module: string; action: string }> {
  return requiredPermissions.filter(req => !PermissionChecker.hasPermission(userPermissions, req.module, req.action));
}
