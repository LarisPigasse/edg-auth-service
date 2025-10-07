// src/modules/auth/types/auth.types.ts

export type AccountType = 'operatore' | 'partner' | 'cliente' | 'agente';
export type ProfileType = 'root' | 'admin' | 'operatore' | 'guest';

export interface AccountAttributes {
  id: string;
  email: string;
  password?: string;
  accountType: AccountType;
  entityId: string;
  isActive: boolean;
  isVerified: boolean;
  profile?: ProfileType;
  level?: number;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionAttributes {
  id: string;
  accountId: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isRevoked: boolean;
  createdAt: Date;
}

export interface ResetTokenAttributes {
  id: string;
  token: string;
  accountId: string;
  expiresAt: Date;
  used: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// DTOs per le richieste
export interface RegisterRequest {
  email: string;
  password: string;
  accountType: AccountType;
  entityId: string;
  profile?: ProfileType;
  level?: number;
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
    id: string;
    email: string;
    accountType: AccountType;
    profile?: ProfileType;
    level?: number;
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

export interface AuthTokenPayload {
  accountId: string;
  email: string;
  accountType: AccountType;
  profile?: ProfileType;
  level?: number;
  sessionId?: string;
}

export interface RequestWithAccount extends Request {
  account?: AccountAttributes;
  accountId?: string;
}
