// src/modules/auth/models/index.ts

// Modelli esistenti (aggiornati con id INTEGER)
export { createAccountModel } from './Account';
export { createSessionModel } from './Session';
export { createResetTokenModel } from './ResetToken';

// Nuovi modelli RBAC
export { createRoleModel } from './Role';
export { createRolePermissionModel } from './RolePermission';

// Associazioni
export { setupAuthAssociations } from './associations';
