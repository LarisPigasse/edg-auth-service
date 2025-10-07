// src/core/config/database.ts
import { Sequelize } from "sequelize";
import { ServiceConfig, isDevelopment } from "./environment";

export class DatabaseManager {
  private sequelize: Sequelize;
  private config: ServiceConfig;
  private models: any[] = [];

  constructor(config: ServiceConfig) {
    this.config = config;
    this.sequelize = new Sequelize(config.database.name, config.database.user, config.database.password, {
      host: config.database.host,
      port: config.database.port,
      dialect: config.database.dialect,

      // Logging intelligente
      logging: isDevelopment(config) ? console.log : false,

      // Pool ottimizzato per microservizi
      pool: {
        max: 10, // Massimo connessioni
        min: 2, // Minimo connessioni sempre attive
        acquire: 30000, // 30s timeout per acquisire connessione
        idle: 10000, // 10s prima di rilasciare connessione inattiva
      },

      // MySQL settings
      dialectOptions: {
        charset: "utf8mb4",
      },

      // Timezone UTC per consistenza
      timezone: "+00:00",

      // Retry automatico
      retry: {
        max: 3,
      },

      // Configurazioni globali modelli
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true,
      },
    });
  }

  // Test connessione
  async testConnection(): Promise<boolean> {
    try {
      console.log("🔍 Test connessione database...");
      await this.sequelize.authenticate();
      console.log(`✅ Connessione database ${this.config.database.name} stabilita`);
      console.log(`📊 Host: ${this.config.database.host}:${this.config.database.port}`);
      console.log(`👤 User: ${this.config.database.user}`);
      return true;
    } catch (error) {
      console.error("❌ Impossibile connettersi al database:", error);
      return false;
    }
  }

  // Registra un modello
  registerModel(modelInitFn: (sequelize: Sequelize) => any): any {
    const model = modelInitFn(this.sequelize);
    this.models.push(model);
    console.log(`📄 Modello registrato: ${model.name}`);
    return model;
  }

  // Registra associazioni tra modelli
  registerAssociations(associationFn: (models: any[]) => void): void {
    associationFn(this.models);
    console.log("🔗 Associazioni database configurate");
  }

  // Sync database con strategie intelligenti
  async syncDatabase(options: { force?: boolean; alter?: boolean } = {}): Promise<boolean> {
    try {
      const { force = false, alter = isDevelopment(this.config) } = options;

      // Protezione production
      if (this.config.nodeEnv === "production" && force) {
        console.warn("⚠️  ATTENZIONE: Sync con force=true bloccato in production");
        return false;
      }

      console.log("🔄 Sincronizzazione database...");

      // Modalità sync intelligente
      await this.sequelize.sync({ force, alter });

      console.log("✅ Database sincronizzato:");
      console.log("   - Tabelle mancanti: create");
      if (alter && isDevelopment(this.config)) {
        console.log("   - Colonne mancanti: aggiunte (solo development)");
      }
      console.log("   - Dati esistenti: preservati");

      return true;
    } catch (error) {
      console.error("❌ Errore durante la sincronizzazione:", error);
      return false;
    }
  }

  // Health check con statistiche
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // Test connessione
      await this.sequelize.authenticate();

      // Statistiche base
      const stats = {
        connection: "OK",
        database: this.config.database.name,
        host: this.config.database.host,
        modelsRegistered: this.models.length,
        modelNames: this.models.map((m) => m.name),
        timestamp: new Date().toISOString(),
      };

      return {
        status: "healthy",
        details: stats,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          database: this.config.database.name,
          host: this.config.database.host,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  // Getter per sequelize instance (per casi avanzati)
  getSequelize(): Sequelize {
    return this.sequelize;
  }

  // Getter per lista modelli
  getModels(): any[] {
    return this.models;
  }

  // Cleanup per shutdown graceful
  async close(): Promise<void> {
    try {
      await this.sequelize.close();
      console.log("🔌 Connessione database chiusa correttamente");
    } catch (error) {
      console.error("❌ Errore durante chiusura database:", error);
    }
  }
}
