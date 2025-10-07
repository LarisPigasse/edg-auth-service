// src/modules/auth/models/Session.ts
import { DataTypes, Sequelize } from 'sequelize';

export const createSessionModel = (sequelize: Sequelize) => {
  const Session = sequelize.define(
    'Session',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: 'UUID univoco per la sessione',
      },
      accountId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'accountId',
        references: {
          model: 'accounts',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'Account proprietario della sessione',
      },
      refreshToken: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: 'refreshToken',
        comment: "Token per refresh dell'access token",
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expiresAt',
        comment: 'Scadenza della sessione',
      },
      ipAddress: {
        type: DataTypes.STRING(45), // IPv6 support
        allowNull: true,
        field: 'ipAddress',
        comment: 'Indirizzo IP del client',
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'userAgent',
        comment: 'User Agent del browser/app',
      },
      isRevoked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'isRevoked',
        comment: 'Sessione revocata (logout)',
      },
    },
    {
      tableName: 'sessions',
      timestamps: true,
      updatedAt: false, // Solo createdAt
      indexes: [
        {
          unique: true,
          fields: ['refreshToken'],
          name: 'unique_refresh_token',
        },
        { fields: ['accountId'], name: 'idx_session_account_id' },
        { fields: ['expiresAt'], name: 'idx_session_expires_at' },
        { fields: ['accountId', 'expiresAt'], name: 'idx_session_account_expires' },
        { fields: ['isRevoked'], name: 'idx_session_is_revoked' },
        { fields: ['accountId', 'isRevoked', 'expiresAt'], name: 'idx_session_active' },
        { fields: ['createdAt'], name: 'idx_session_created_at' },
      ],
    }
  );

  return Session;
};
