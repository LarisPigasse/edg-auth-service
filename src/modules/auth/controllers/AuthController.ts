// src/modules/auth/controllers/AuthController.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  ResetPasswordRequest,
  ConfirmResetPasswordRequest,
} from '../types/auth.types';

export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /auth/register
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const data: RegisterRequest = req.body;

      const account = await this.authService.register(data);

      res.status(201).json({
        success: true,
        data: account,
        message: 'Account creato con successo',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Errore durante registrazione',
      });
    }
  };

  /**
   * POST /auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const data: LoginRequest = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      const result = await this.authService.login(data, ipAddress, userAgent);

      res.json({
        success: true,
        data: result,
        message: 'Login effettuato con successo',
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Errore durante login',
      });
    }
  };

  /**
   * POST /auth/refresh
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken }: RefreshTokenRequest = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token richiesto',
        });
        return;
      }

      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      const result = await this.authService.refreshToken(refreshToken, ipAddress, userAgent);

      res.json({
        success: true,
        data: result,
        message: 'Token aggiornato con successo',
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Errore durante refresh',
      });
    }
  };

  /**
   * POST /auth/logout
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token richiesto',
        });
        return;
      }

      await this.authService.logout(refreshToken);

      res.json({
        success: true,
        message: 'Logout effettuato con successo',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Errore durante logout',
      });
    }
  };

  /**
   * POST /auth/logout-all
   */
  logoutAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = (req as any).accountId;

      if (!accountId) {
        res.status(401).json({
          success: false,
          error: 'Autenticazione richiesta',
        });
        return;
      }

      await this.authService.logoutAll(accountId);

      res.json({
        success: true,
        message: 'Logout da tutti i dispositivi effettuato',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Errore durante logout',
      });
    }
  };

  /**
   * POST /auth/request-reset-password
   */
  requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, accountType }: ResetPasswordRequest = req.body;

      if (!email || !accountType) {
        res.status(400).json({
          success: false,
          error: 'Email e accountType richiesti',
        });
        return;
      }

      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      await this.authService.requestPasswordReset(email, accountType, ipAddress, userAgent);

      res.json({
        success: true,
        message: "Se l'account esiste, riceverai un'email con il link di reset",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Errore durante richiesta reset',
      });
    }
  };

  /**
   * POST /auth/reset-password
   */
  confirmPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword }: ConfirmResetPasswordRequest = req.body;

      if (!token || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Token e nuova password richiesti',
        });
        return;
      }

      await this.authService.confirmPasswordReset(token, newPassword);

      res.json({
        success: true,
        message: 'Password reimpostata con successo',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Errore durante reset password',
      });
    }
  };

  /**
   * POST /auth/change-password
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const accountId = (req as any).accountId;
      const { oldPassword, newPassword } = req.body;

      if (!accountId) {
        res.status(401).json({
          success: false,
          error: 'Autenticazione richiesta',
        });
        return;
      }

      if (!oldPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Password attuale e nuova password richieste',
        });
        return;
      }

      await this.authService.changePassword(accountId, oldPassword, newPassword);

      res.json({
        success: true,
        message: 'Password modificata con successo',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Errore durante cambio password',
      });
    }
  };

  /**
   * GET /auth/me
   */
  getCurrentAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const account = (req as any).account;

      if (!account) {
        res.status(401).json({
          success: false,
          error: 'Autenticazione richiesta',
        });
        return;
      }

      res.json({
        success: true,
        data: account,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Errore durante recupero dati account',
      });
    }
  };
}
