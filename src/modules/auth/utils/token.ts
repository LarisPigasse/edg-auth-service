// src/modules/auth/utils/token.ts
import crypto from 'crypto';

export class TokenUtils {
  /**
   * Genera un token casuale sicuro per reset password
   */
  static generateResetToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Genera un refresh token casuale
   */
  static generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Hash di un token per storage sicuro (opzionale, per extra sicurezza)
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Calcola data di scadenza
   */
  static calculateExpiry(duration: string | number): Date {
    const now = new Date();

    if (typeof duration === 'number') {
      // Millisecondi
      return new Date(now.getTime() + duration);
    }

    // Parse stringa tipo "7d", "1h", "30m"
    const match = duration.match(/^(\d+)([mhd])$/);
    if (!match) {
      throw new Error('Formato durata non valido. Usa: 30m, 1h, 7d');
    }

    const [, amount, unit] = match;
    const value = parseInt(amount);

    switch (unit) {
      case 'm': // minuti
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h': // ore
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd': // giorni
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        throw new Error('Unità tempo non valida');
    }
  }

  /**
   * Verifica se un token è scaduto
   */
  static isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }
}
