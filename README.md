# 🚀 EDG Backend Template

Template base riutilizzabile per microservizi backend EDG con Express.js, TypeScript e database configurabile.

## ✨ Features

- **⚡ Setup Istantaneo** - Server funzionante in 5 minuti
- **🔒 Security Built-in** - Helmet, CORS, Rate Limiting
- **📊 Database Flessibile** - MySQL, PostgreSQL supportati
- **📦 Struttura Modulare** - Facilmente estendibile
- **🧪 Development Ready** - Hot reload, error handling, logging
- **🛠️ TypeScript** - Type safety completa

## 🚀 Quick Start

```bash
# 1. Setup progetto
npm install

# 2. Configura environment
cp .env.example .env
# Modifica .env con le tue credenziali database

# 3. Avvia development server
npm run dev

# 4. Verifica funzionamento
curl http://localhost:3001
```

## 📊 Database Setup

### MySQL (Default)

```bash
# .env
DB_TYPE=mysql
DB_NAME=edg_template_test
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
```

### PostgreSQL

```bash
# .env
DB_TYPE=postgres
DB_NAME=edg_template_test
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

### Connection String (Alternative)

```bash
# .env
DATABASE_URL=mysql://user:pass@localhost:3306/database
DATABASE_URL=postgres://user:pass@localhost:5432/database
```

## 🛠️ Development Commands

```bash
# Development con hot reload
npm run dev

# Sincronizza database (prima volta)
npm run db:sync
# Oppure: DB_SYNC=true npm run dev

# Build per production
npm run build
npm start

# Testing e linting
npm run test
npm run lint
npm run lint:fix

# Cleanup
npm run clean
```

## 🌐 Endpoints Disponibili

| Endpoint             | Metodo | Descrizione                     |
| -------------------- | ------ | ------------------------------- |
| `/`                  | GET    | Service info e moduli attivi    |
| `/health`            | GET    | Health check con stato database |
| `/template/health`   | GET    | Template module health          |
| `/template/info`     | GET    | Informazioni template           |
| `/template/examples` | GET    | Lista esempi                    |
| `/template/examples` | POST   | Crea nuovo esempio              |

## 📁 Struttura Progetto

```
edg-backend-template/
├── src/
│   ├── core/                    # Framework riutilizzabile
│   │   ├── config/
│   │   │   ├── environment.ts   # Gestione configurazioni
│   │   │   └── database.ts      # Setup database
│   │   └── server.ts            # Server Express modulare
│   │
│   ├── modules/                 # Moduli business logic
│   │   └── (aggiungi qui i tuoi moduli)
│   │
│   └── app.ts                   # Entry point
│
├── scripts/                     # Utility scripts
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔧 Creazione Nuovi Servizi

Una volta che il template funziona, puoi usarlo per creare nuovi servizi:

```bash
# Genera nuovo servizio (TODO: implementare script)
npm run create-service orders-service

# Questo creerà:
# ../orders-service/ con la stessa struttura
```

## 🧪 Testing

```bash
# Test del template
curl http://localhost:3001
curl http://localhost:3001/health
curl http://localhost:3001/template/info

# Test creazione esempio
curl -X POST http://localhost:3001/template/examples \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Example","description":"Primo test"}'
```

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-Origin Resource Sharing configurabile
- **Rate Limiting** - Protezione contro spam/DoS
- **Input Validation** - Validazione automatica
- **Error Handling** - Gestione errori sicura

## 🎯 Database Support

| Database   | Status   | Dipendenze    |
| ---------- | -------- | ------------- |
| MySQL      | ✅ Ready | mysql2        |
| PostgreSQL | ✅ Ready | pg, pg-hstore |
| MongoDB    | 🚧 TODO  | mongoose      |
| Redis      | 🚧 TODO  | redis         |

## 📝 Environment Variables

Vedi `.env.example` per la lista completa delle variabili disponibili.

Variabili **richieste**:

- `DB_NAME` - Nome database
- `DB_USER` - Username database
- `DB_PASSWORD` - Password database

Variabili **opzionali**:

- `DB_TYPE` - Tipo database (default: mysql)
- `PORT` - Porta server (default: 3001)
- `DB_SYNC` - Sync tabelle al startup (default: false)

## 🚀 Production Deployment

```bash
# Build
npm run build

# Environment production
NODE_ENV=production
DB_SYNC=false  # IMPORTANTE!

# Start
npm start
```

## 📞 Support

Per domande o problemi:

1. Verifica la configurazione in `.env`
2. Controlla i log del server
3. Testa la connessione database
4. Consulta la documentazione EDG

---

**🎉 Template pronto! Sviluppa il tuo microservizio aggiungendo moduli in `src/modules/`**
