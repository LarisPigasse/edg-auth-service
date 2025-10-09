// src/modules/auth/utils/validation.ts

// ============================================================================
// COSTANTI RBAC
// ============================================================================

/**
 * Moduli validi del sistema
 */
const VALID_MODULES = ['spedizioni', 'gestione', 'report', 'sistema', '*'] as const;

/**
 * Azioni valide del sistema
 */
const VALID_ACTIONS = ['read', 'create', 'update', 'delete', 'approve', 'export', '*'] as const;

/**
 * Account types validi
 */
const VALID_ACCOUNT_TYPES = ['operatore', 'partner', 'cliente', 'agente'] as const;

// ============================================================================
// VALIDATION UTILS
// ============================================================================

export class ValidationUtils {
  // ==========================================================================
  // VALIDAZIONI BASE
  // ==========================================================================

  /**
   * Valida formato email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida UUID v4
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Sanitize input (rimuove caratteri pericolosi)
   */
  static sanitize(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Valida account type
   */
  static isValidAccountType(type: string): boolean {
    return VALID_ACCOUNT_TYPES.includes(type as any);
  }

  // ==========================================================================
  // VALIDAZIONI RBAC (NUOVO)
  // ==========================================================================

  /**
   * Valida modulo RBAC
   *
   * Moduli validi: 'spedizioni', 'gestione', 'report', 'sistema', '*'
   *
   * @example
   * isValidModule('spedizioni') → true
   * isValidModule('*') → true
   * isValidModule('invalid') → false
   */
  static isValidModule(module: string): boolean {
    return VALID_MODULES.includes(module as any);
  }

  /**
   * Valida azione RBAC
   *
   * Azioni valide: 'read', 'create', 'update', 'delete', 'approve', 'export', '*'
   *
   * @example
   * isValidAction('read') → true
   * isValidAction('*') → true
   * isValidAction('invalid') → false
   */
  static isValidAction(action: string): boolean {
    return VALID_ACTIONS.includes(action as any);
  }

  /**
   * Valida formato permesso RBAC
   *
   * Formati validi:
   * - '*' (wildcard globale - solo root)
   * - 'modulo.*' (wildcard modulo - tutte le azioni su quel modulo)
   * - 'modulo.azione' (permesso specifico)
   *
   * @example
   * isValidPermission('*') → true
   * isValidPermission('spedizioni.*') → true
   * isValidPermission('spedizioni.read') → true
   * isValidPermission('invalid') → false
   * isValidPermission('spedizioni') → false (manca l'azione)
   */
  static isValidPermission(permission: string): boolean {
    // 1. Wildcard globale
    if (permission === '*') {
      return true;
    }

    // 2. Deve contenere un punto
    if (!permission.includes('.')) {
      return false;
    }

    // 3. Formato: modulo.azione
    const [module, action] = permission.split('.');

    // 4. Verifica modulo e azione validi
    if (!this.isValidModule(module)) {
      return false;
    }

    if (!this.isValidAction(action)) {
      return false;
    }

    return true;
  }

  /**
   * Valida array di permessi
   *
   * Verifica che tutti i permessi nell'array siano validi
   *
   * @example
   * isValidPermissions(['spedizioni.*', 'report.read']) → true
   * isValidPermissions(['invalid.permission']) → false
   */
  static isValidPermissions(permissions: string[]): boolean {
    if (!Array.isArray(permissions)) {
      return false;
    }

    if (permissions.length === 0) {
      return false;
    }

    return permissions.every(p => this.isValidPermission(p));
  }

  /**
   * Valida roleId
   *
   * Deve essere un numero intero positivo
   *
   * @example
   * isValidRoleId(1) → true
   * isValidRoleId(0) → false (deve essere > 0)
   * isValidRoleId(-1) → false
   * isValidRoleId(1.5) → false (deve essere intero)
   * isValidRoleId('1') → false (deve essere number)
   */
  static isValidRoleId(roleId: any): boolean {
    // Deve essere un numero
    if (typeof roleId !== 'number') {
      return false;
    }

    // Deve essere un intero
    if (!Number.isInteger(roleId)) {
      return false;
    }

    // Deve essere positivo
    if (roleId <= 0) {
      return false;
    }

    return true;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Ottieni lista moduli validi
   */
  static getValidModules(): readonly string[] {
    return VALID_MODULES;
  }

  /**
   * Ottieni lista azioni valide
   */
  static getValidActions(): readonly string[] {
    return VALID_ACTIONS;
  }

  /**
   * Ottieni lista account types validi
   */
  static getValidAccountTypes(): readonly string[] {
    return VALID_ACCOUNT_TYPES;
  }

  /**
   * Estrae modulo e azione da un permesso
   *
   * @example
   * parsePermission('spedizioni.read') → { module: 'spedizioni', action: 'read' }
   * parsePermission('*') → { module: '*', action: '*' }
   * parsePermission('invalid') → null
   */
  static parsePermission(permission: string): { module: string; action: string } | null {
    if (permission === '*') {
      return { module: '*', action: '*' };
    }

    if (!permission.includes('.')) {
      return null;
    }

    const [module, action] = permission.split('.');

    if (!this.isValidModule(module) || !this.isValidAction(action)) {
      return null;
    }

    return { module, action };
  }

  /**
   * Formatta un permesso da modulo e azione
   *
   * @example
   * formatPermission('spedizioni', 'read') → 'spedizioni.read'
   * formatPermission('gestione', '*') → 'gestione.*'
   */
  static formatPermission(module: string, action: string): string {
    return `${module}.${action}`;
  }
}
