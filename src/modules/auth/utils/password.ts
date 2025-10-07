// src/modules/auth/utils/password.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Più alto = più sicuro ma più lento

export class PasswordUtils {
  /**
   * Hash di una password in chiaro
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verifica se una password corrisponde all'hash
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Valida requisiti password (minimo 8 caratteri, almeno 1 numero, 1 maiuscola, 1 minuscola)
   */
  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('La password deve contenere almeno 8 caratteri');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('La password deve contenere almeno una lettera maiuscola');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('La password deve contenere almeno una lettera minuscola');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('La password deve contenere almeno un numero');
    }

    // Opzionale: caratteri speciali
    // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    //   errors.push('La password deve contenere almeno un carattere speciale');
    // }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Genera una password casuale sicura
   */
  static generate(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = uppercase + lowercase + numbers + special;

    let password = '';

    // Garantisci almeno un carattere di ogni tipo
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Riempi il resto
    for (let i = password.length; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // Mescola i caratteri
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
