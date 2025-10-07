// src/modules/auth/models/ResetToken.ts
import { DataTypes, Sequelize } from 'sequelize';

export const createResetTokenModel = (sequelize: Sequelize) => {
  const ResetToken = sequelize.define(
    'ResetToken',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: 'UUID univoco per il reset token',
      },
      token: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Token per il reset della password',
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
        comment: 'Account per cui è stato generato il token',
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expiresAt',
        comment: 'Scadenza del token (default 1 ora)',
      },
      used: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Token già utilizzato',
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ipAddress',
        comment: 'IP address del client che ha richiesto il reset',
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'userAgent',
        comment: 'User Agent del client',
      },
    },
    {
      tableName: 'reset_tokens',
      timestamps: true,
      updatedAt: false, // Solo createdAt
      indexes: [
        {
          unique: true,
          fields: ['token'],
          name: 'unique_reset_token',
        },
        { fields: ['accountId'], name: 'idx_reset_account_id' },
        { fields: ['expiresAt'], name: 'idx_reset_expires_at' },
        { fields: ['used'], name: 'idx_reset_used' },
        { fields: ['accountId', 'used', 'expiresAt'], name: 'idx_reset_active' },
        { fields: ['ipAddress', 'createdAt'], name: 'idx_reset_ip_created' },
        { fields: ['createdAt'], name: 'idx_reset_created_at' },
      ],
    }
  );

  return ResetToken;
};
