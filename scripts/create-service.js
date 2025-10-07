#!/usr/bin/env node
// scripts/create-service.js - Generatore automatico servizi EDG

const fs = require("fs");
const path = require("path");

// Parsing argomenti
const args = process.argv.slice(2);
const serviceName = args[0];
const dbType = args.find((arg) => arg.startsWith("--db="))?.split("=")[1] || "mysql";

if (!serviceName) {
  console.error("❌ Specifica il nome del servizio");
  console.log("");
  console.log("📋 Uso:");
  console.log("  npm run create-service <nome-servizio> [--db=mysql|postgres]");
  console.log("");
  console.log("📚 Esempi:");
  console.log("  npm run create-service auth-service");
  console.log("  npm run create-service orders-service --db=postgres");
  process.exit(1);
}

// Validazione nome servizio
if (!serviceName.match(/^[a-z][a-z0-9-]*[a-z0-9]$/)) {
  console.error("❌ Nome servizio non valido");
  console.log("💡 Usa solo lettere minuscole, numeri e trattini (es: auth-service)");
  process.exit(1);
}

// Validazione database type
const supportedDbs = ["mysql", "postgres"];
if (!supportedDbs.includes(dbType)) {
  console.error(`❌ Database type non supportato: ${dbType}`);
  console.log(`💡 Supportati: ${supportedDbs.join(", ")}`);
  process.exit(1);
}

// Configurazioni servizio
const getServiceConfig = (name, db) => {
  const portMap = {
    "auth-service": 3001,
    "orders-service": 3002,
    "partners-service": 3003,
    "clients-service": 3004,
    "reports-service": 3005,
  };

  const port = portMap[name] || 3010 + Math.floor(Math.random() * 90);
  const dbName = `edg_${name.replace("-service", "")}`;
  const defaultPort = db === "postgres" ? 5432 : 3306;

  return { port, dbName, defaultPort };
};

const { port, dbName, defaultPort } = getServiceConfig(serviceName, dbType);
const servicePath = path.join(process.cwd(), "..", serviceName);

console.log("🚀 Generazione nuovo servizio EDG...");
console.log(`📦 Servizio: ${serviceName}`);
console.log(`📊 Database: ${dbType} (${dbName})`);
console.log(`🔌 Porta: ${port}`);
console.log(`📁 Path: ${servicePath}`);
console.log("");

// Verifica directory non esistente
if (fs.existsSync(servicePath)) {
  console.error(`❌ Directory ${serviceName} già esistente`);
  process.exit(1);
}

try {
  // Crea directory principale
  fs.mkdirSync(servicePath, { recursive: true });

  // Struttura directory
  const dirs = [
    "src/core/config",
    "src/controllers",
    "src/middleware",
    "src/models",
    "src/routes",
    "src/services",
    "src/types",
    "src/utils",
    "scripts",
    "tests",
  ];

  dirs.forEach((dir) => {
    fs.mkdirSync(path.join(servicePath, dir), { recursive: true });
  });

  // Copia file core dal template
  const coreFiles = ["src/core/config/environment.ts", "src/core/config/database.ts", "src/core/server.ts"];

  coreFiles.forEach((file) => {
    const sourcePath = path.join(__dirname, "..", file);
    const destPath = path.join(servicePath, file);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`📄 ✅ ${file}`);
    } else {
      console.warn(`⚠️  File non trovato: ${file}`);
    }
  });

  // Genera app.ts specifico per il servizio
  const appTemplate = `// src/app.ts - ${serviceName}
import { createServiceConfig } from './core/config/environment';
import { createServer } from './core/server';
import type { ServerModule } from './core/server';
import { Request, Response, Router } from 'express';

// ============================================================================
// CONFIGURAZIONE SERVIZIO
// ============================================================================

const config = createServiceConfig({
  serviceName: '${serviceName}',
  port: ${port},
});

// ============================================================================
// MODELLI (DA IMPLEMENTARE in src/models/)
// ============================================================================

const createMainModel = (sequelize: any) => {
  const { DataTypes } = require('sequelize');
  
  const MainModel = sequelize.define('MainModel', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending'),
      defaultValue: 'pending',
    },
  }, {
    tableName: 'main_models',
    indexes: [
      { fields: ['name'] },
      { fields: ['status'] },
    ],
  });

  return MainModel;
};

// ============================================================================
// ROUTE BASE (DA SPOSTARE in src/routes/)
// ============================================================================

const mainRouter = Router();

mainRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: '${serviceName} è operativo',
      timestamp: new Date().toISOString(),
    },
  });
});

mainRouter.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      service: '${serviceName}',
      message: 'Servizio pronto per l\\'implementazione',
      database: '${dbType}',
      port: ${port},
      structure: {
        controllers: 'src/controllers/ - Controller per le route',
        middleware: 'src/middleware/ - Middleware Express custom',
        models: 'src/models/ - Modelli database',
        routes: 'src/routes/ - Definizioni route',
        services: 'src/services/ - Business logic e servizi',
        types: 'src/types/ - Interfacce TypeScript',
        utils: 'src/utils/ - Funzioni utility'
      },
      todo: [
        'Implementa modelli in src/models/',
        'Crea controller in src/controllers/',
        'Definisci route in src/routes/',
        'Aggiungi business logic in src/services/',
        'Configura middleware in src/middleware/'
      ],
      timestamp: new Date().toISOString(),
    },
  });
});

// ============================================================================
// MODULO PRINCIPALE
// ============================================================================

const mainModule: ServerModule = {
  name: 'main',
  path: '/api',
  router: mainRouter,
  models: [createMainModel],
};

// ============================================================================
// AVVIO SERVER
// ============================================================================

console.log('🚀 Avvio ${serviceName}...');
console.log('📁 Struttura progetto:');
console.log('   src/controllers/ - Controller per le route');
console.log('   src/middleware/  - Middleware Express custom');
console.log('   src/models/      - Modelli database');  
console.log('   src/routes/      - Definizioni route');
console.log('   src/services/    - Business logic e servizi');
console.log('   src/types/       - Interfacce TypeScript');
console.log('   src/utils/       - Funzioni utility');
console.log('');

const server = createServer({
  config,
  modules: [mainModule],
});

server.start();

export default server;
`;

  fs.writeFileSync(path.join(servicePath, "src/app.ts"), appTemplate);

  // Package.json
  const packageJson = {
    name: `@edg/${serviceName}`,
    version: "1.0.0",
    description: `EDG ${serviceName}`,
    main: "dist/app.js",
    scripts: {
      dev: "nodemon --exec ts-node src/app.ts",
      build: "tsc",
      start: "node dist/app.js",
      "db:sync": "DB_SYNC=true npm run dev",
    },
    dependencies: {
      express: "^5.1.0",
      cors: "^2.8.5",
      helmet: "^8.1.0",
      "express-rate-limit": "^7.4.1",
      dotenv: "^16.4.7",
      sequelize: "^6.37.7",
      uuid: "^10.0.0",
      mysql2: "^3.14.0",
    },
    devDependencies: {
      "@types/express": "^5.0.1",
      "@types/cors": "^2.8.17",
      "@types/node": "^22.14.0",
      "@types/uuid": "^10.0.0",
      nodemon: "^3.1.9",
      "ts-node": "^10.9.2",
      "tsconfig-paths": "^4.2.0",
      typescript: "^5.8.3",
    },
  };

  fs.writeFileSync(path.join(servicePath, "package.json"), JSON.stringify(packageJson, null, 2));

  // .env.example
  const envExample = `# ${serviceName} Environment Variables
SERVICE_NAME=${serviceName}
PORT=${port}
NODE_ENV=development

DB_TYPE=${dbType}
DB_NAME=${dbName}
DB_USER=${dbType === "postgres" ? "postgres" : "root"}
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=${defaultPort}

DB_SYNC=true
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_ATTEMPTS=100
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
`;

  fs.writeFileSync(path.join(servicePath, ".env.example"), envExample);

  // Copia altri file
  const filesToCopy = ["tsconfig.json", ".gitignore"];
  filesToCopy.forEach((file) => {
    const sourcePath = path.join(__dirname, "..", file);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, path.join(servicePath, file));
    }
  });

  // README
  const readme = `# ${serviceName}

Servizio EDG generato dal template con struttura professionale.

## 🚀 Quick Start

\`\`\`bash
npm install
cp .env.example .env
# Configura database in .env
npm run dev
\`\`\`

Servizio disponibile su: http://localhost:${port}
Database: ${dbType} (${dbName})

## 📁 Struttura Progetto

\`\`\`
${serviceName}/
├── src/
│   ├── core/              # Framework template (non modificare)
│   ├── controllers/       # Controller per le route
│   ├── middleware/        # Middleware Express custom
│   ├── models/           # Modelli database
│   ├── routes/           # Definizioni route
│   ├── services/         # Business logic e servizi
│   ├── types/            # Interfacce TypeScript
│   ├── utils/            # Funzioni utility
│   └── app.ts            # Entry point
└── package.json
\`\`\`

## 🛠️ Sviluppo

### Workflow Consigliato
1. **Modelli**: Definisci entità in \`src/models/\`
2. **Tipi**: Crea interfacce in \`src/types/\` 
3. **Servizi**: Business logic in \`src/services/\`
4. **Controller**: Gestione HTTP in \`src/controllers/\`
5. **Route**: Binding in \`src/routes/\`
6. **Middleware**: Logic custom in \`src/middleware/\`

### Esempi Struttura

\`\`\`typescript
// src/models/Order.ts
export const createOrderModel = (sequelize) => { ... }

// src/types/Order.ts  
export interface Order { id: string; ... }

// src/services/OrderService.ts
export class OrderService { ... }

// src/controllers/OrderController.ts
export class OrderController { ... }

// src/routes/orders.ts
export const ordersRouter = Router();

// src/middleware/validateOrder.ts
export const validateOrder = (req, res, next) => { ... }
\`\`\`

## 📝 TODO

- [ ] Implementare modelli in \`src/models/\`
- [ ] Creare controller in \`src/controllers/\`
- [ ] Definire route in \`src/routes/\`
- [ ] Aggiungere business logic in \`src/services/\`
- [ ] Configurare middleware in \`src/middleware/\`
- [ ] Definire tipi in \`src/types/\`
- [ ] Aggiungere utility in \`src/utils/\`

## 🔧 Comandi

\`\`\`bash
npm run dev        # Development con hot reload
npm run build      # Build per production  
npm run start      # Avvia production
npm run db:sync    # Sync database (dev only)
\`\`\`

Generato il ${new Date().toLocaleDateString("it-IT")} dal Template EDG v1.0.0
`;

  fs.writeFileSync(path.join(servicePath, "README.md"), readme);

  console.log("✅ Servizio creato con successo!");
  console.log("");
  console.log("📋 Prossimi passi:");
  console.log(`1. cd ../${serviceName}`);
  console.log("2. npm install");
  console.log("3. cp .env.example .env");
  console.log("4. npm run dev");
  console.log("");
  console.log(`🎯 Servizio: http://localhost:${port}`);
} catch (error) {
  console.error("❌ Errore:", error.message);
  if (fs.existsSync(servicePath)) {
    fs.rmSync(servicePath, { recursive: true, force: true });
  }
  process.exit(1);
}
