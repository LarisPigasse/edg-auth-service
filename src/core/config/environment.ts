// src/core/config/environment.ts
import dotenv from 'dotenv';

dotenv.config();

export interface ServiceConfig {
  serviceName: string;
  port: number;
  nodeEnv: string;
  database: {
    name: string;
    user: string;
    password: string;
    host: string;
    port: number;
    dialect: 'mysql';
  };
  security: {
    rateLimitWindow: number; // minuti
    rateLimitMaxAttempts: number;
  };
  cors: {
    origins: string[];
  };
  logger?: {
    apiUrl: string;
    apiKey: string;
  };
}

// Factory per creare configurazione servizio
export const createServiceConfig = (overrides: Partial<ServiceConfig> = {}): ServiceConfig => {
  // Variabili base richieste
  const requiredVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error("Variabili d'ambiente mancanti:", missingVars.join(', '));
    console.error('Crea un file .env con le variabili richieste');
    process.exit(1);
  }

  const baseConfig: ServiceConfig = {
    serviceName: process.env.SERVICE_NAME || 'edg-template',
    port: parseInt(process.env.PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development',

    database: {
      name: process.env.DB_NAME!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      dialect: 'mysql',
    },

    security: {
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '15'),
      rateLimitMaxAttempts: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '100'),
    },

    cors: {
      origins: [
        // Development defaults
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://localhost:8080',
        // Production from env
        ...(process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || []),
      ],
    },

    // EdgLogger opzionale
    logger: process.env.LOGGER_API_URL
      ? {
          apiUrl: process.env.LOGGER_API_URL,
          apiKey: process.env.LOGGER_API_KEY || '',
        }
      : undefined,
  };

  // Merge con override
  const config = { ...baseConfig, ...overrides };

  // Log config in development (senza dati sensibili)
  if (config.nodeEnv === 'development') {
    console.log(` ${config.serviceName} Configuration:`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Database: ${config.database.name}@${config.database.host}:${config.database.port}`);
    if (config.logger) {
      console.log(`   Logger: ${config.logger.apiUrl}`);
    }
  }

  return config;
};

// Helper functions
export const isDevelopment = (config: ServiceConfig) => config.nodeEnv === 'development';
export const isProduction = (config: ServiceConfig) => config.nodeEnv === 'production';
export const isTest = (config: ServiceConfig) => config.nodeEnv === 'test';
