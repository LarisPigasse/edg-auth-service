// src/modules/auth/types/auth.types.ts

// ============================================================================
// ACCOUNT TYPES
// ============================================================================

export type AccountType = 'operatore' | 'partner' | 'cliente' | 'agente';

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
}

export interface LoginRequest {
  email: string;
  password: string;
  accountType: AccountType;
}

export interface LoginResponseAccount {
  id: number;
  email: string;
  accountType: AccountType;
  roleId: number;
  permissions: string[]; // ✅ AGGIUNTO: Array di permessi dell'utente
  roleName?: string; // ✅ AGGIUNTO: Nome del ruolo per UI/debug
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  account: LoginResponseAccount;
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
