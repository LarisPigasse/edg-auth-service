// src/modules/auth/models/Account.ts
import { DataTypes, Sequelize } from 'sequelize';

export const createAccountModel = (sequelize: Sequelize) => {
  const Account = sequelize.define(
    'Account',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: "UUID univoco per l'account",
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          isEmail: true,
        },
        comment: "Email dell'utente (username)",
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Hash BCrypt della password',
      },
      accountType: {
        type: DataTypes.ENUM('operatore', 'partner', 'cliente', 'agente'),
        allowNull: false,
        field: 'accountType',
        comment: "Tipo di account nell'ecosistema EDG",
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'entityId',
        comment: "UUID dell'entità specifica (operatore_id, partner_id, etc.)",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'isActive',
        comment: 'Account attivo nel sistema',
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'isVerified',
        comment: 'Email verificata',
      },
      profile: {
        type: DataTypes.ENUM('root', 'admin', 'operatore', 'guest'),
        allowNull: true,
        comment: 'Profilo operatore (solo per account tipo operatore)',
      },
      level: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 10,
        },
        comment: 'Livello operatore 1-10 (solo per account tipo operatore)',
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'lastLogin',
        comment: 'Timestamp ultimo login',
      },
    },
    {
      tableName: 'accounts',
      indexes: [
        {
          unique: true,
          fields: ['email', 'accountType'],
          name: 'unique_email_account_type',
        },
        { fields: ['accountType'], name: 'idx_account_type' },
        { fields: ['entityId'], name: 'idx_entity_id' },
        { fields: ['accountType', 'entityId'], name: 'idx_account_type_entity' },
        { fields: ['isActive'], name: 'idx_is_active' },
        { fields: ['email'], name: 'idx_email' },
        { fields: ['isActive', 'accountType'], name: 'idx_active_type' },
        { fields: ['lastLogin'], name: 'idx_last_login' },
      ],
    }
  );

  return Account;
};
