// src/modules/auth/models/Role.ts
import { DataTypes, Sequelize } from 'sequelize';

export const createRoleModel = (sequelize: Sequelize) => {
  const Role = sequelize.define(
    'Role',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'ID interno auto-incrementale',
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
        comment: 'UUID pubblico per identificazione esterna',
      },
      name: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        comment: 'Nome univoco del ruolo (es. admin, operatore_vendite_full)',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Descrizione del ruolo e delle sue funzioni',
      },
      isSystem: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'isSystem',
        comment: 'Ruolo di sistema (root, admin, guest - non modificabile/eliminabile)',
      },
    },
    {
      tableName: 'roles',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['uuid'],
          name: 'unique_role_uuid',
        },
        {
          unique: true,
          fields: ['name'],
          name: 'unique_role_name',
        },
        {
          fields: ['isSystem'],
          name: 'idx_is_system',
        },
        {
          fields: ['name', 'isSystem'],
          name: 'idx_name_system',
        },
      ],
    }
  );

  return Role;
};
