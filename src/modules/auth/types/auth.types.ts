// src/modules/auth/types/auth.types.ts

// ============================================================================
// ACCOUNT TYPES
// ============================================================================

export type AccountType = 'operatore' | 'partner' | 'cliente' | 'agente';

// ❌ RIMOSSO: ProfileType (non più usato)
// export type ProfileType = 'root' | 'admin' | 'operatore' | 'guest';

export interface AccountAttributes {
  id: number; // ✅ AGGIORNATO: number invece di string (pattern dual-key)
  uuid: string; // ✅ NUOVO: UUID pubblico
  email: string;
  password?: string;
  accountType: AccountType;
  entityId: string;
  roleId: number; // ✅ NUOVO: FK verso roles
  isActive: boolean;
  isVerified: boolean;
  // ❌ RIMOSSO: profile?: ProfileType;
  // ❌ RIMOSSO: level?: number;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SESSION & RESET TOKEN TYPES
// ============================================================================

export interface SessionAttributes {
  id: number; // ✅ AGGIORNATO: number invece di string
  accountId: number; // ✅ AGGIORNATO: number
  refreshToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isRevoked: boolean;
  createdAt: Date;
}

export interface ResetTokenAttributes {
  id: number; // ✅ AGGIORNATO: number invece di string
  token: string;
  accountId: number; // ✅ AGGIORNATO: number
  expiresAt: Date;
  used: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ============================================================================
// RBAC TYPES (NUOVO)
// ============================================================================

export interface RoleAttributes {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermissionAttributes {
  id: number;
  roleId: number;
  permission: string;
  createdAt: Date;
}

// Moduli disponibili nel sistema
export type Module = 'spedizioni' | 'gestione' | 'report' | 'sistema' | '*'; // wildcard globale

// Azioni disponibili
export type Action = 'read' | 'create' | 'update' | 'delete' | 'approve' | 'export' | '*'; // wildcard azioni

// Un permesso è una stringa nel formato 'modulo.azione' o wildcard
export type Permission = string; // es: 'spedizioni.read', 'gestione.*', '*'

// ============================================================================
// REQUEST/RESPONSE DTOs
// ============================================================================

export interface RegisterRequest {
  email: string;
  password: string;
  accountType: AccountType;
  entityId: string;
  roleId: number; // ✅ NUOVO: ruolo da assegnare
  // ❌ RIMOSSO: profile?: ProfileType;
  // ❌ RIMOSSO: level?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  accountType: AccountType;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  account: {
    id: number; // ✅ AGGIORNATO: number
    email: string;
    accountType: AccountType;
    roleId: number; // ✅ NUOVO
    // ❌ RIMOSSO: profile?: ProfileType;
    // ❌ RIMOSSO: level?: number;
    // Opzionale: includere permissions per debug/UI
    // permissions?: string[];
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ResetPasswordRequest {
  email: string;
  accountType: AccountType;
}

export interface ConfirmResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ============================================================================
// JWT TOKEN PAYLOAD
// ============================================================================

export interface AuthTokenPayload {
  accountId: number; // ✅ AGGIORNATO: number
  email: string;
  accountType: AccountType;
  roleId: number; // ✅ NUOVO
  permissions: string[]; // ✅ NUOVO: array di permessi ['spedizioni.*', 'report.read', ...]
  sessionId?: number; // ✅ AGGIORNATO: number
  // ❌ RIMOSSO: profile?: ProfileType;
  // ❌ RIMOSSO: level?: number;

  // JWT standard fields (aggiunti automaticamente da jsonwebtoken)
  iat?: number; // issued at
  exp?: number; // expiration
  iss?: string; // issuer
}

// ============================================================================
// EXTENDED REQUEST TYPE
// ============================================================================

export interface RequestWithAccount extends Request {
  account?: AccountAttributes;
  accountId?: number; // ✅ AGGIORNATO: number
}
