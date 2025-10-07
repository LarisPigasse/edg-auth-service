// src/modules/auth/services/TokenService.ts
import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '../types/auth.types';
import { TokenUtils } from '../utils';

export class TokenService {
  private jwtSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || '';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET non configurato in .env');
    }
  }

  /**
   * Genera access token JWT
   */
  generateAccessToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'edg-auth-service',
    } as any);
  }

  /**
   * Genera refresh token casuale (non JWT)
   */
  generateRefreshToken(): string {
    return TokenUtils.generateRefreshToken();
  }

  /**
   * Verifica e decodifica access token JWT
   */
  verifyAccessToken(token: string): AuthTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded as AuthTokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Decodifica token senza verifica (per debug)
   */
  decodeToken(token: string): AuthTokenPayload | null {
    try {
      const decoded = jwt.decode(token);
      return decoded as AuthTokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Calcola scadenza refresh token
   */
  getRefreshTokenExpiry(): Date {
    return TokenUtils.calculateExpiry(this.refreshTokenExpiry);
  }

  /**
   * Estrae token dal header Authorization
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}
