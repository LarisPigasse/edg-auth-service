// src/modules/auth/models/RolePermission.ts
import { DataTypes, Sequelize } from 'sequelize';

export const createRolePermissionModel = (sequelize: Sequelize) => {
  const RolePermission = sequelize.define(
    'RolePermission',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'ID interno auto-incrementale',
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'roleId',
        references: {
          model: 'roles',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'Ruolo a cui appartiene il permesso',
      },
      permission: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Permesso assegnato: modulo (es. sales, warehouse) o azione (es. read, create)',
      },
    },
    {
      tableName: 'role_permissions',
      timestamps: true,
      updatedAt: false, // Solo createdAt
      indexes: [
        {
          unique: true,
          fields: ['roleId', 'permission'],
          name: 'unique_role_permission',
        },
        {
          fields: ['roleId'],
          name: 'idx_role_id',
        },
        {
          fields: ['permission'],
          name: 'idx_permission',
        },
      ],
    }
  );

  return RolePermission;
};
