// src/modules/auth/utils/validation.ts

export class ValidationUtils {
  /**
   * Valida formato email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida UUID
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
    return ['operatore', 'partner', 'cliente', 'agente'].includes(type);
  }

  /**
   * Valida profile type
   */
  static isValidProfile(profile: string): boolean {
    return ['root', 'admin', 'operatore', 'guest'].includes(profile);
  }

  /**
   * Valida level (1-10)
   */
  static isValidLevel(level: number): boolean {
    return Number.isInteger(level) && level >= 1 && level <= 10;
  }
}
