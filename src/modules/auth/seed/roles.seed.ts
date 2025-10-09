// src/modules/auth/seed/roles.seed.ts
import { v4 as uuidv4 } from 'uuid';
import { createServiceConfig } from '../../../core/config/environment';
import { DatabaseManager } from '../../../core/config/database';
import { createRoleModel, createRolePermissionModel } from '../models';

// ============================================================================
// DEFINIZIONE RUOLI BASE
// ============================================================================

interface RoleDefinition {
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
}

const DEFAULT_ROLES: RoleDefinition[] = [
  {
    name: 'root',
    description: 'Accesso completo al sistema - super amministratore',
    isSystem: true,
    permissions: ['*'], // Wildcard globale
  },
  {
    name: 'admin',
    description: 'Amministratore sistema - gestione completa tranne configurazioni critiche',
    isSystem: true,
    permissions: [
      'spedizioni.*',
      'gestione.*',
      'report.*',
      // NO 'sistema.*' - solo root può accedere
    ],
  },
  {
    name: 'operatore',
    description: 'Operatore standard - gestione operativa senza amministrazione',
    isSystem: true,
    permissions: [
      'spedizioni.*', // Tutte le azioni sulle spedizioni
      'report.read',
      'report.create',
      'report.export',
      // NO 'gestione.*' - non può gestire utenti/ruoli
    ],
  },
  {
    name: 'guest',
    description: 'Ospite - accesso in sola lettura',
    isSystem: true,
    permissions: [
      'spedizioni.read',
      'report.read',
      // Solo visualizzazione, nessuna modifica
    ],
  },
];

// ============================================================================
// FUNZIONI DI SEED
// ============================================================================

/**
 * Seed di un singolo ruolo con i suoi permessi
 */
async function seedRole(roleModel: any, rolePermissionModel: any, roleDef: RoleDefinition): Promise<void> {
  console.log(`\n📝 Processando ruolo: ${roleDef.name}`);

  // 1. Verifica se il ruolo esiste già
  const existing = await roleModel.findOne({
    where: { name: roleDef.name },
  });

  let role;

  if (existing) {
    console.log(`   ⚠️  Ruolo "${roleDef.name}" già esistente - aggiornamento...`);

    // Aggiorna descrizione se cambiata
    await existing.update({
      description: roleDef.description,
      isSystem: roleDef.isSystem,
    });

    role = existing;
  } else {
    console.log(`   ✅ Creazione ruolo "${roleDef.name}"...`);

    // Crea nuovo ruolo
    role = await roleModel.create({
      uuid: uuidv4(),
      name: roleDef.name,
      description: roleDef.description,
      isSystem: roleDef.isSystem,
    });
  }

  // 2. Gestione permessi
  console.log(`   🔑 Configurazione permessi per "${roleDef.name}"...`);

  // Elimina permessi esistenti (per evitare duplicati)
  await rolePermissionModel.destroy({
    where: { roleId: role.id },
  });

  // Crea nuovi permessi
  for (const permission of roleDef.permissions) {
    await rolePermissionModel.create({
      roleId: role.id,
      permission,
    });
    console.log(`      → ${permission}`);
  }

  console.log(`   ✅ Ruolo "${roleDef.name}" configurato con ${roleDef.permissions.length} permessi`);
}

/**
 * Seed di tutti i ruoli predefiniti
 */
async function seedAllRoles(roleModel: any, rolePermissionModel: any): Promise<void> {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║         SEED RUOLI BASE - EDG Auth Service                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  for (const roleDef of DEFAULT_ROLES) {
    try {
      await seedRole(roleModel, rolePermissionModel, roleDef);
    } catch (error) {
      console.error(`   ❌ Errore durante seed di "${roleDef.name}":`, error);
      throw error;
    }
  }

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║              SEED COMPLETATO CON SUCCESSO                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
}

/**
 * Verifica e mostra ruoli esistenti
 */
async function verifyRoles(roleModel: any, rolePermissionModel: any): Promise<void> {
  console.log('\n📊 Verifica ruoli nel database:\n');

  const roles = await roleModel.findAll({
    include: [
      {
        model: rolePermissionModel,
        as: 'permissions',
      },
    ],
    order: [['name', 'ASC']],
  });

  if (roles.length === 0) {
    console.log('⚠️  Nessun ruolo trovato nel database\n');
    return;
  }

  console.log('┌─────────────┬──────────────────────────────────────────┬────────────┐');
  console.log('│ Ruolo       │ Descrizione                              │ Permessi   │');
  console.log('├─────────────┼──────────────────────────────────────────┼────────────┤');

  for (const role of roles) {
    const permissions = role.permissions || [];
    const permCount = permissions.length;
    const desc = role.description || '';
    const truncDesc = desc.length > 40 ? desc.substring(0, 37) + '...' : desc.padEnd(40);

    console.log(`│ ${role.name.padEnd(11)} │ ${truncDesc} │ ${String(permCount).padStart(10)} │`);

    // Mostra i permessi
    if (permissions.length > 0) {
      permissions.forEach((p: any, index: number) => {
        const isLast = index === permissions.length - 1;
        const prefix = isLast ? '    └─' : '    ├─';
        console.log(`│             │ ${prefix} ${p.permission.padEnd(33)} │            │`);
      });
    }

    if (role !== roles[roles.length - 1]) {
      console.log('├─────────────┼──────────────────────────────────────────┼────────────┤');
    }
  }

  console.log('└─────────────┴──────────────────────────────────────────┴────────────┘\n');
  console.log(`✅ Totale ruoli: ${roles.length}\n`);
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function main() {
  let dbManager: DatabaseManager | null = null;

  try {
    console.log('🚀 Avvio script seed ruoli...\n');

    // 1. Carica configurazione
    const config = createServiceConfig({
      serviceName: 'EDG Auth Seed',
      port: 3001,
    });

    // 2. Inizializza database
    console.log('📊 Connessione al database...');
    dbManager = new DatabaseManager(config);

    // Registra modelli
    const Role = createRoleModel(dbManager.getSequelize());
    const RolePermission = createRolePermissionModel(dbManager.getSequelize());

    // Setup associazioni
    Role.hasMany(RolePermission, { foreignKey: 'roleId', as: 'permissions' });
    RolePermission.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

    // Sync database (senza force - mantiene dati esistenti)
    console.log('🔄 Sincronizzazione database...');
    await dbManager.getSequelize().sync();
    console.log('✅ Database sincronizzato\n');

    // 3. Esegui seed
    await seedAllRoles(Role, RolePermission);

    // 4. Verifica risultato
    await verifyRoles(Role, RolePermission);

    // 5. Chiudi connessione
    await dbManager.close();
    console.log('✅ Connessione database chiusa\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRORE durante seed:');
    console.error(error);

    if (dbManager) {
      await dbManager.close();
    }

    process.exit(1);
  }
}

// Esegui script se chiamato direttamente
if (require.main === module) {
  main();
}

export { seedAllRoles, seedRole, verifyRoles };
