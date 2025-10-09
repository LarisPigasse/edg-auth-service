// src/modules/auth/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/TokenService';
import { AccountType } from '../types/auth.types';
// ❌ RIMOSSO: ProfileType (non esiste più)

const tokenService = new TokenService();

/**
 * Middleware per verificare il token JWT
 * Carica automaticamente permissions dal JWT payload
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = tokenService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token di autenticazione mancante',
      });
      return;
    }

    const payload = tokenService.verifyAccessToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Token non valido o scaduto',
      });
      return;
    }

    // ✅ Aggiungi dati account alla request
    // Il payload contiene già: accountId, email, accountType, roleId, permissions[]
    (req as any).accountId = payload.accountId;
    (req as any).account = payload;
    // Nota: payload.permissions è automaticamente disponibile in req.account.permissions

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Errore durante autenticazione',
    });
  }
};

/**
 * Middleware per verificare il tipo di account
 * Uso: requireAccountType('operatore', 'admin')
 */
export const requireAccountType = (...allowedTypes: AccountType[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const account = (req as any).account;

    if (!account) {
      res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta',
      });
      return;
    }

    if (!allowedTypes.includes(account.accountType)) {
      res.status(403).json({
        success: false,
        error: 'Accesso non autorizzato per questo tipo di account',
        required: allowedTypes,
      });
      return;
    }

    next();
  };
};

// ❌ RIMOSSO: requireProfile (usa ProfileType che non esiste più)
// Usa invece requirePermission da permissionMiddleware.ts

// ❌ RIMOSSO: requireMinLevel (usa level che non esiste più)
// Usa invece requirePermission da permissionMiddleware.ts

/**
 * Middleware opzionale - non fallisce se token mancante
 * Utile per endpoint pubblici che possono beneficiare di autenticazione
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = tokenService.extractTokenFromHeader(authHeader);

    if (token) {
      const payload = tokenService.verifyAccessToken(token);
      if (payload) {
        (req as any).accountId = payload.accountId;
        (req as any).account = payload;
        // payload.permissions automaticamente disponibile
      }
    }

    next();
  } catch (error) {
    // Continua senza autenticazione
    next();
  }
};
