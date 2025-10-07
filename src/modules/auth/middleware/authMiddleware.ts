// src/modules/auth/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/TokenService';
import { AccountType, ProfileType } from '../types/auth.types';

const tokenService = new TokenService();

/**
 * Middleware per verificare il token JWT
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

    // Aggiungi dati account alla request
    (req as any).accountId = payload.accountId;
    (req as any).account = payload;

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

/**
 * Middleware per verificare il profilo operatore
 */
export const requireProfile = (...allowedProfiles: ProfileType[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const account = (req as any).account;

    if (!account) {
      res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta',
      });
      return;
    }

    if (!account.profile || !allowedProfiles.includes(account.profile)) {
      res.status(403).json({
        success: false,
        error: 'Accesso non autorizzato per questo profilo',
        required: allowedProfiles,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware per verificare il livello minimo operatore
 */
export const requireMinLevel = (minLevel: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const account = (req as any).account;

    if (!account) {
      res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta',
      });
      return;
    }

    if (!account.level || account.level < minLevel) {
      res.status(403).json({
        success: false,
        error: `Livello minimo richiesto: ${minLevel}`,
        currentLevel: account.level,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware opzionale - non fallisce se token mancante
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
      }
    }

    next();
  } catch (error) {
    // Continua senza autenticazione
    next();
  }
};
