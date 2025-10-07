// src/app.ts - EDG Auth Service (RISTRUTTURATO PER GESTIRE L'ORDINE DI INIZIALIZZAZIONE)
import { createServiceConfig } from './core/config/environment';
import { createServer, ServerModule } from './core/server';
import { DatabaseManager } from './core/config/database'; // Import necessario per il tipaggio

// Import modelli e associazioni
import { createAccountModel, createSessionModel, createResetTokenModel, setupAuthAssociations } from './modules/auth/models';

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
// REGISTRAZIONE DEL MODULO INIZIALE (solo modelli e associazioni)
// ============================================================================

// Definiamo un Router fittizio (placeholder) perché il costruttore del server
// richiede un Router, ma quello reale verrà creato dopo la sync DB.
const placeholderRouter = Router();

// Modulo contenente solo la configurazione (modelli e associazioni)
const AuthModuleConfig: ServerModule = {
  name: 'auth',
  path: '/auth',
  router: placeholderRouter, // Placeholder
  models: [createAccountModel, createSessionModel, createResetTokenModel],
  associations: setupAuthAssociations,
};

// ============================================================================
// AVVIO SERVER
// ============================================================================

const server = createServer({
  config,
  modules: [AuthModuleConfig], // Registra subito i modelli e le associazioni
});

// Funzione che gestisce l'inizializzazione dei service e l'avvio finale
const startServer = async () => {
  try {
    console.log(`Avvio ${config.serviceName}...`);

    // 1. INIZIALIZZA DATABASE
    // Questo ora registra e sincronizza i modelli passati in `modules`.
    const dbReady = await server.initializeDatabase();
    if (!dbReady) {
      console.error('Impossibile avviare il servizio senza database');
      process.exit(1);
    }

    // 2. RECUPERA i modelli Sequelize inizializzati dal DatabaseManager
    const databaseManager: DatabaseManager = server.getDatabase();
    const models = databaseManager.getModels();

    // Siccome sappiamo che la sincronizzazione ha avuto successo, i modelli esistono.
    const Account = models.find((m: any) => m.name === 'Account');
    const Session = models.find((m: any) => m.name === 'Session');
    const ResetToken = models.find((m: any) => m.name === 'ResetToken');

    if (!Account || !Session || !ResetToken) {
      // Errore critico se, dopo la sync, i modelli non sono trovati (non dovrebbe accadere)
      throw new Error('Errore interno: modelli Sequelize richiesti non trovati dopo inizializzazione.');
    }

    // 3. INIZIALIZZA la logica di business (Service e Controller) con i modelli reali
    const authService = new AuthService(Account, Session, ResetToken);
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
      console.log(`🏁 Pronto per ricevere richieste!\n`);
      // Aggiungi qui l'elenco degli endpoint se vuoi, come prima
    });

    // Graceful shutdown handlers (rimane come prima)
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
