// src/modules/auth/services/AuthService.ts
import { Op } from 'sequelize';
import {
  AccountAttributes,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  AccountType,
  AuthTokenPayload,
} from '../types/auth.types';
import { PasswordUtils, ValidationUtils, TokenUtils } from '../utils';
import { TokenService } from './TokenService';

export class AuthService {
  private tokenService: TokenService;

  constructor(private accountModel: any, private sessionModel: any, private resetTokenModel: any) {
    this.tokenService = new TokenService();
  }

  /**
   * Registrazione nuovo account
   */
  async register(data: RegisterRequest): Promise<AccountAttributes> {
    // Validazioni
    if (!ValidationUtils.isValidEmail(data.email)) {
      throw new Error('Email non valida');
    }

    if (!ValidationUtils.isValidAccountType(data.accountType)) {
      throw new Error('Tipo account non valido');
    }

    if (!ValidationUtils.isValidUUID(data.entityId)) {
      throw new Error('EntityId non valido');
    }

    const passwordValidation = PasswordUtils.validate(data.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    if (data.profile && !ValidationUtils.isValidProfile(data.profile)) {
      throw new Error('Profile non valido');
    }

    if (data.level && !ValidationUtils.isValidLevel(data.level)) {
      throw new Error('Level deve essere tra 1 e 10');
    }

    // Verifica email univoca per accountType
    const existing = await this.accountModel.findOne({
      where: {
        email: data.email,
        accountType: data.accountType,
      },
    });

    if (existing) {
      throw new Error('Account già esistente con questa email e tipo');
    }

    // Hash password
    const passwordHash = await PasswordUtils.hash(data.password);

    // Crea account
    const account = await this.accountModel.create({
      email: data.email,
      password: passwordHash,
      accountType: data.accountType,
      entityId: data.entityId,
      profile: data.profile,
      level: data.level,
      isActive: true,
      isVerified: false,
    });

    // Rimuovi password dall'output
    const accountData = account.toJSON();
    delete accountData.password;

    return accountData;
  }

  /**
   * Login account
   */
  async login(data: LoginRequest, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    // Trova account
    const account = await this.accountModel.findOne({
      where: {
        email: data.email,
        accountType: data.accountType,
      },
    });

    if (!account) {
      throw new Error('Credenziali non valide');
    }

    // Verifica stato account
    if (!account.isActive) {
      throw new Error('Account disattivato');
    }

    // Verifica password
    const isPasswordValid = await PasswordUtils.verify(data.password, account.password);

    if (!isPasswordValid) {
      throw new Error('Credenziali non valide');
    }

    // Genera tokens
    const accessToken = this.tokenService.generateAccessToken({
      accountId: account.id,
      email: account.email,
      accountType: account.accountType,
      profile: account.profile,
      level: account.level,
    });

    const refreshToken = this.tokenService.generateRefreshToken();

    // Crea sessione
    const session = await this.sessionModel.create({
      accountId: account.id,
      refreshToken,
      expiresAt: this.tokenService.getRefreshTokenExpiry(),
      ipAddress,
      userAgent,
      isRevoked: false,
    });

    // Aggiorna ultimo login
    await account.update({ lastLogin: new Date() });

    return {
      accessToken,
      refreshToken,
      account: {
        id: account.id,
        email: account.email,
        accountType: account.accountType,
        profile: account.profile,
        level: account.level,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    // Trova sessione
    const session = await this.sessionModel.findOne({
      where: { refreshToken },
      include: ['account'],
    });

    if (!session) {
      throw new Error('Refresh token non valido');
    }

    // Verifica sessione
    if (session.isRevoked) {
      throw new Error('Sessione revocata');
    }

    if (TokenUtils.isExpired(session.expiresAt)) {
      throw new Error('Sessione scaduta');
    }

    const account = session.account;

    if (!account.isActive) {
      throw new Error('Account disattivato');
    }

    // Genera nuovo access token
    const accessToken = this.tokenService.generateAccessToken({
      accountId: account.id,
      email: account.email,
      accountType: account.accountType,
      profile: account.profile,
      level: account.level,
      sessionId: session.id,
    });

    // Aggiorna ultima attività sessione
    await session.update({
      ipAddress: ipAddress || session.ipAddress,
      userAgent: userAgent || session.userAgent,
    });

    return {
      accessToken,
      refreshToken: session.refreshToken,
      account: {
        id: account.id,
        email: account.email,
        accountType: account.accountType,
        profile: account.profile,
        level: account.level,
      },
    };
  }

  /**
   * Logout (revoca sessione)
   */
  async logout(refreshToken: string): Promise<void> {
    const session = await this.sessionModel.findOne({
      where: { refreshToken },
    });

    if (session) {
      await session.update({ isRevoked: true });
    }
  }

  /**
   * Logout da tutti i dispositivi
   */
  async logoutAll(accountId: string): Promise<void> {
    await this.sessionModel.update({ isRevoked: true }, { where: { accountId, isRevoked: false } });
  }

  /**
   * Richiesta reset password
   */
  async requestPasswordReset(email: string, accountType: AccountType, ipAddress?: string, userAgent?: string): Promise<string> {
    const account = await this.accountModel.findOne({
      where: { email, accountType },
    });

    if (!account) {
      // Non rivelare se l'account esiste (sicurezza)
      // Ma genera comunque un token fake per timing attack prevention
      TokenUtils.generateResetToken();
      return "Se l'account esiste, riceverai un'email con il link di reset";
    }

    // Genera token
    const token = TokenUtils.generateResetToken();
    const expiresAt = TokenUtils.calculateExpiry('1h'); // 1 ora

    // Salva token
    await this.resetTokenModel.create({
      token,
      accountId: account.id,
      expiresAt,
      used: false,
      ipAddress,
      userAgent,
    });

    // TODO: Invia email con token
    // EmailService.sendResetPassword(account.email, token);

    return token; // In production, non restituire il token direttamente
  }

  /**
   * Conferma reset password
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    // Trova token
    const resetToken = await this.resetTokenModel.findOne({
      where: { token, used: false },
      include: ['account'],
    });

    if (!resetToken) {
      throw new Error('Token non valido o già utilizzato');
    }

    if (TokenUtils.isExpired(resetToken.expiresAt)) {
      throw new Error('Token scaduto');
    }

    // Valida nuova password
    const passwordValidation = PasswordUtils.validate(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Hash nuova password
    const passwordHash = await PasswordUtils.hash(newPassword);

    // Aggiorna password
    await resetToken.account.update({ password: passwordHash });

    // Marca token come usato
    await resetToken.update({ used: true });

    // Revoca tutte le sessioni attive (per sicurezza)
    await this.logoutAll(resetToken.accountId);
  }

  /**
   * Verifica account (email verification)
   */
  async verifyAccount(accountId: string): Promise<void> {
    await this.accountModel.update({ isVerified: true }, { where: { id: accountId } });
  }

  /**
   * Cambia password (utente autenticato)
   */
  async changePassword(accountId: string, oldPassword: string, newPassword: string): Promise<void> {
    const account = await this.accountModel.findByPk(accountId);

    if (!account) {
      throw new Error('Account non trovato');
    }

    // Verifica password attuale
    const isValid = await PasswordUtils.verify(oldPassword, account.password);
    if (!isValid) {
      throw new Error('Password attuale non corretta');
    }

    // Valida nuova password
    const validation = PasswordUtils.validate(newPassword);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Hash e aggiorna
    const passwordHash = await PasswordUtils.hash(newPassword);
    await account.update({ password: passwordHash });

    // Revoca tutte le sessioni (opzionale)
    await this.logoutAll(accountId);
  }

  /**
   * Cleanup sessioni e token scaduti
   */
  async cleanupExpired(): Promise<void> {
    const now = new Date();

    // Elimina sessioni scadute
    await this.sessionModel.destroy({
      where: {
        expiresAt: { [Op.lt]: now },
      },
    });

    // Elimina reset token scaduti
    await this.resetTokenModel.destroy({
      where: {
        expiresAt: { [Op.lt]: now },
      },
    });
  }
}
