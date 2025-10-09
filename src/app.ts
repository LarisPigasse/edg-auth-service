// src/app.ts - EDG Auth Service
import { createServiceConfig } from './core/config/environment';
import { createServer, ServerModule } from './core/server';
import { DatabaseManager } from './core/config/database';

// Import modelli e associazioni
import {
  createAccountModel,
  createSessionModel,
  createResetTokenModel,
  createRoleModel,
  createRolePermissionModel,
  setupAuthAssociations,
} from './modules/auth/models';

// Import services e routes
import { AuthService } from './modules/auth/services';
import { AuthController } from './modules/auth/controllers/AuthController';
import { createAuthRouter } from './modules/auth/routes/auth.routes';
import { Router } from 'express';

// ============================================================================
// CONFIGURAZIONE AUTH SERVICE
// ============================================================================

const config = createServiceConfig({
  serviceName: 'EDG Auth Service',
  port: 3001,
});

// ============================================================================
// REGISTRAZIONE DEL MODULO INIZIALE (modelli e associazioni)
// ============================================================================

// Router placeholder (il vero router verrà creato dopo la sync DB)
const placeholderRouter = Router();

// Modulo contenente configurazione modelli e associazioni
const AuthModuleConfig: ServerModule = {
  name: 'auth',
  path: '/auth',
  router: placeholderRouter,
  // ⚠️ ORDINE CRITICO: rispetta le dipendenze foreign key!
  models: [
    createRoleModel, // 1️⃣ roles (nessuna FK)
    createRolePermissionModel, // 2️⃣ role_permissions (FK → roles)
    createAccountModel, // 3️⃣ accounts (FK → roles)
    createSessionModel, // 4️⃣ sessions (FK → accounts)
    createResetTokenModel, // 5️⃣ reset_tokens (FK → accounts)
  ],
  associations: setupAuthAssociations,
};

// ============================================================================
// AVVIO SERVER
// ============================================================================

const server = createServer({
  config,
  modules: [AuthModuleConfig],
});

// Funzione che gestisce l'inizializzazione dei service e l'avvio finale
const startServer = async () => {
  try {
    console.log(`Avvio ${config.serviceName}...`);

    // 1. INIZIALIZZA DATABASE
    const dbReady = await server.initializeDatabase();
    if (!dbReady) {
      console.error('Impossibile avviare il servizio senza database');
      process.exit(1);
    }

    // 2. RECUPERA i modelli Sequelize inizializzati
    const databaseManager: DatabaseManager = server.getDatabase();
    const models = databaseManager.getModels();

    // Trova i modelli necessari
    const Account = models.find((m: any) => m.name === 'Account');
    const Session = models.find((m: any) => m.name === 'Session');
    const ResetToken = models.find((m: any) => m.name === 'ResetToken');
    const Role = models.find((m: any) => m.name === 'Role');
    const RolePermission = models.find((m: any) => m.name === 'RolePermission'); // ✅ AGGIUNTO

    // ✅ FIXED: Verifica che tutti i modelli siano stati trovati
    if (!Account || !Session || !ResetToken || !Role || !RolePermission) {
      throw new Error('Errore: modelli richiesti non trovati dopo inizializzazione');
    }

    // 3. INIZIALIZZA la logica di business (Service e Controller)
    // ✅ FIXED: Aggiunto RolePermission come quinto parametro
    const authService = new AuthService(Account, Session, ResetToken, Role, RolePermission);
    const authController = new AuthController(authService);
    const authRouter = createAuthRouter(authController);

    // 4. REGISTRA IL ROUTER REALE nell'applicazione Express
    const app = server.getApp();
    app.use(AuthModuleConfig.path, authRouter);
    console.log(`✅ Modulo auth registrato → ${AuthModuleConfig.path}`);

    // 5. Avvia server HTTP
    app.listen(config.port, () => {
      console.log(`\n✅ ${config.serviceName} avviato con successo!`);
      console.log(`🌐 Server: http://localhost:${config.port}`);
      console.log(`📊 Database: ${config.database.name}@${config.database.host}`);
      console.log(`📦 Moduli: auth`);
      console.log(`🚀 Pronto per ricevere richieste!\n`);
    });

    // Graceful shutdown handlers
    const handleShutdown = async (signal: string) => {
      console.log(`\n🔄 Shutdown graceful in corso (${signal})...`);
      try {
        await databaseManager.close();
        console.log('✅ Servizio terminato correttamente');
        process.exit(0);
      } catch (error) {
        console.error('❌ Errore durante shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error("❌ Errore durante l'avvio:", error);
    process.exit(1);
  }
};

// Avvia il server
startServer();

export default server;
