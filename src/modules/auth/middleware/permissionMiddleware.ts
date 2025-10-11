// src/modules/auth/middleware/permissionMiddleware.ts

import { Request, Response, NextFunction } from 'express';

// ============================================================================
// PERMISSION CHECKER - Logica di verifica permessi
// ============================================================================

export class PermissionChecker {
  /**
   * ✅ MODIFICATO: Verifica se l'utente ha il permesso richiesto usando logica "Deny First"
   *
   * Sistema a permessi composti con wildcards e negazioni esplicite:
   * - Permesso specifico: 'spedizioni.read'
   * - Wildcard modulo: 'spedizioni.*' (tutte le azioni su spedizioni)
   * - Wildcard globale: '*' (accesso completo - solo root)
   * - Negazione specifica: '!spedizioni.delete' (nega una specifica azione)
   * - Negazione modulo: '!spedizioni.*' (nega tutte le azioni del modulo)
   *
   * LOGICA "DENY FIRST":
   * 1. Se esiste una regola di negazione che matcha, NEGA sempre (return false)
   * 2. Se non ci sono negazioni, verifica le regole di permesso positivo
   * 3. Se nessuna regola matcha, NEGA di default
   *
   * Nessuna gerarchia implicita: 'create' NON implica 'read'
   */
  static hasPermission(userPermissions: string[], module: string, action: string): boolean {
    const requiredPermission = `${module}.${action}`;
    const wildcardModulePermission = `${module}.*`;

    // ✅ AGGIUNTO: Stringhe per le negazioni esplicite
    const denySpecificPermission = `!${requiredPermission}`; // es. '!spedizioni.delete'
    const denyWildcardModule = `!${wildcardModulePermission}`; // es. '!spedizioni.*'

    // --- FASE 1: VERIFICA NEGAZIONI ESPLICITE (Deny First) ---

    // Se l'utente ha una negazione per l'intero modulo (es. '!spedizioni.*'),
    // nega subito l'accesso, indipendentemente da altri permessi
    if (userPermissions.includes(denyWildcardModule)) {
      return false;
    }

    // Se l'utente ha una negazione specifica per questa azione (es. '!spedizioni.delete'),
    // nega l'accesso anche se ha 'spedizioni.*'
    if (userPermissions.includes(denySpecificPermission)) {
      return false;
    }

    // --- FASE 2: VERIFICA PERMESSI POSITIVI (Allow) ---

    // 1. Root ha tutto (a meno di una negazione esplicita già gestita sopra)
    if (userPermissions.includes('*')) {
      return true;
    }

    // 2. Wildcard modulo (es. 'spedizioni.*' copre tutte le azioni su spedizioni)
    if (userPermissions.includes(wildcardModulePermission)) {
      return true;
    }

    // 3. Permesso specifico (es. 'spedizioni.read')
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // --- FASE 3: NESSUN PERMESSO VALIDO TROVATO ---
    return false;
  }

  /**
   * Verifica se ha TUTTI i permessi richiesti
   * (Nessuna modifica: usa automaticamente la nuova logica di hasPermission)
   */
  static hasAllPermissions(userPermissions: string[], requirements: Array<{ module: string; action: string }>): boolean {
    return requirements.every(req => this.hasPermission(userPermissions, req.module, req.action));
  }

  /**
   * Verifica se ha ALMENO UNO dei permessi richiesti
   * (Nessuna modifica: usa automaticamente la nuova logica di hasPermission)
   */
  static hasAnyPermission(userPermissions: string[], requirements: Array<{ module: string; action: string }>): boolean {
    return requirements.some(req => this.hasPermission(userPermissions, req.module, req.action));
  }

  /**
   * Verifica se ha accesso completo a un modulo
   * (Nessuna modifica necessaria)
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
 * router.get('/spedizioni', authenticate, requirePermission('spedizioni', 'read'), handler)
 * router.post('/spedizioni', authenticate, requirePermission('spedizioni', 'create'), handler)
 * router.delete('/spedizioni/:id', authenticate, requirePermission('spedizioni', 'delete'), handler)
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

    // Verifica permesso con la nuova logica "Deny First"
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
 * requireAllPermissions([
 *   { module: 'spedizioni', action: 'read' },
 *   { module: 'gestione', action: 'update' }
 * ])
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
 * requireAnyPermission([
 *   { module: 'spedizioni', action: 'read' },
 *   { module: 'report', action: 'read' }
 * ])
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
 * requireModuleAccess('gestione') // Richiede 'gestione.*' o '*'
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
 * router.post('/system/backup', authenticate, requireRoot(), handler)
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
 * if (canPerform(user.permissions, 'spedizioni', 'delete')) {
 *   // mostra bottone elimina
 * }
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
