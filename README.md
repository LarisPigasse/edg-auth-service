# EDG Auth Service

Microservizio centralizzato per l'autenticazione e gestione account nell'ecosistema EDG.

## Features

- **Autenticazione JWT** - Access token (15 min) + Refresh token (7 giorni)
- **Multi-Account Type** - Supporto per operatore, partner, cliente, agente
- **Security Built-in** - Helmet, CORS, Rate Limiting, BCrypt
- **Password Reset** - Sistema completo di recupero password con token
- **Session Management** - Gestione sessioni multiple per dispositivo
- **Role-Based Access** - Profile e livelli per controllo accessi granulare
- **Architettura Modulare** - Pronto per espansioni future (2FA, OAuth, Audit)

## Quick Start

```bash
# 1. Setup progetto
npm install

# 2. Configura environment
cp .env.example .env
# Modifica .env con le tue credenziali

# 3. Crea database
CREATE DATABASE edg_auth;

# 4. Sincronizza database (prima volta)
npm run db:sync

# 5. Avvia development server
npm run dev

# 6. Verifica funzionamento
curl http://localhost:3001/health
```

## Database Setup

### MySQL (Default)

```bash
# .env
DB_NAME=edg_auth
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Service Configuration
SERVICE_NAME=EDG Auth Service
PORT=3001
NODE_ENV=development
```

### Variabili Richieste

- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` - Credenziali database
- `JWT_SECRET` - Secret key per firma JWT (cambia in production!)

## Development Commands

```bash
# Development con hot reload
npm run dev

# Sincronizza database (crea/aggiorna tabelle)
npm run db:sync

# Build per production
npm run build
npm start

# Testing e linting
npm test
npm run lint
npm run lint:fix

# Cleanup
npm run clean
```

## API Endpoints

### Public Endpoints

| Endpoint                            | Metodo | Descrizione             |
| ----------------------------------- | ------ | ----------------------- |
| `GET /`                             | GET    | Service info            |
| `GET /health`                       | GET    | Health check            |
| `POST /auth/register`               | POST   | Registra nuovo account  |
| `POST /auth/login`                  | POST   | Login e genera tokens   |
| `POST /auth/refresh`                | POST   | Rinnova access token    |
| `POST /auth/request-reset-password` | POST   | Richiedi reset password |
| `POST /auth/reset-password`         | POST   | Conferma reset password |

### Protected Endpoints (Require Authentication)

| Endpoint                     | Metodo | Descrizione                    |
| ---------------------------- | ------ | ------------------------------ |
| `POST /auth/logout`          | POST   | Logout dalla sessione corrente |
| `POST /auth/logout-all`      | POST   | Logout da tutti i dispositivi  |
| `POST /auth/change-password` | POST   | Cambia password                |
| `GET /auth/me`               | GET    | Recupera dati account corrente |

## Esempi di Utilizzo

### 1. Registrazione

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mario.rossi@example.com",
    "password": "Password123",
    "accountType": "cliente",
    "entityId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mario.rossi@example.com",
    "password": "Password123",
    "accountType": "cliente"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a1b2c3d4e5f6...",
    "account": {
      "id": "uuid",
      "email": "mario.rossi@example.com",
      "accountType": "cliente"
    }
  }
}
```

### 3. Richieste Autenticate

```bash
# Usa l'accessToken ricevuto dal login
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. Refresh Token

```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "a1b2c3d4e5f6..."
  }'
```

### 5. Reset Password

```bash
# Step 1: Richiedi reset
curl -X POST http://localhost:3001/auth/request-reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mario.rossi@example.com",
    "accountType": "cliente"
  }'

# Step 2: Conferma con token (ricevuto via email)
curl -X POST http://localhost:3001/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-from-email",
    "newPassword": "NewPassword123"
  }'
```

## Struttura Progetto

```
auth-service/
├── src/
│   ├── core/                       # Framework riutilizzabile
│   │   ├── config/
│   │   │   ├── environment.ts      # Configurazione servizio
│   │   │   └── database.ts         # Database manager
│   │   └── server.ts               # Server Express modulare
│   │
│   ├── modules/
│   │   └── auth/                   # Modulo autenticazione
│   │       ├── models/             # Modelli Sequelize
│   │       │   ├── Account.ts
│   │       │   ├── Session.ts
│   │       │   ├── ResetToken.ts
│   │       │   └── associations.ts
│   │       ├── services/           # Business logic
│   │       │   ├── AuthService.ts
│   │       │   └── TokenService.ts
│   │       ├── controllers/        # HTTP Controllers
│   │       │   └── AuthController.ts
│   │       ├── middleware/         # Middleware autenticazione
│   │       │   └── authMiddleware.ts
│   │       ├── routes/             # Route definitions
│   │       │   └── auth.routes.ts
│   │       ├── types/              # TypeScript types
│   │       │   └── auth.types.ts
│   │       └── utils/              # Utility functions
│   │           ├── password.ts
│   │           ├── token.ts
│   │           └── validation.ts
│   │
│   └── app.ts                      # Entry point
│
├── package.json
├── tsconfig.json
└── .env
```

## Account Types

Il sistema supporta quattro tipi di account:

| Account Type | Descrizione           | Profile Available             |
| ------------ | --------------------- | ----------------------------- |
| `operatore`  | Operatori interni EDG | root, admin, operatore, guest |
| `partner`    | Partner commerciali   | No                            |
| `cliente`    | Clienti finali        | No                            |
| `agente`     | Agenti esterni        | No                            |

### Profile Operatore

Solo per account tipo `operatore`:

- **root** - Accesso completo (livello 10)
- **admin** - Amministratore (livello 8-9)
- **operatore** - Operatore standard (livello 5-7)
- **guest** - Accesso limitato (livello 1-4)

### Livelli Operatore

Livello numerico da 1 a 10 per controllo accessi granulare.

## Security Features

- **Helmet.js** - HTTP security headers
- **CORS** - Cross-Origin configurabile
- **Rate Limiting** - 100 richieste/15 minuti per IP
- **BCrypt** - Password hashing (12 rounds)
- **JWT** - Token firmati con HS256
- **Input Validation** - Validazione automatica input
- **Session Revocation** - Revoca sessioni su logout
- **Password Policy** - Minimo 8 caratteri, maiuscole, minuscole, numeri

## Middleware di Autenticazione

```typescript
import { authenticate, requireAccountType, requireProfile, requireMinLevel } from './middleware/authMiddleware';

// Richiede solo autenticazione
router.get('/protected', authenticate, handler);

// Richiede tipo account specifico
router.get('/operators-only', authenticate, requireAccountType('operatore'), handler);

// Richiede profile specifico
router.get('/admin-only', authenticate, requireProfile('admin', 'root'), handler);

// Richiede livello minimo
router.get('/level-5-up', authenticate, requireMinLevel(5), handler);
```

## Database Schema

### Tabella `accounts`

- `id` (UUID) - Primary key
- `email` (VARCHAR) - Email univoca per accountType
- `password` (VARCHAR) - Hash BCrypt
- `accountType` (ENUM) - operatore | partner | cliente | agente
- `entityId` (UUID) - ID entità specifica (operatore_id, partner_id, etc.)
- `isActive` (BOOLEAN) - Account attivo
- `isVerified` (BOOLEAN) - Email verificata
- `profile` (ENUM) - root | admin | operatore | guest (solo operatori)
- `level` (INTEGER) - 1-10 (solo operatori)
- `lastLogin` (DATETIME) - Ultimo login
- Timestamps: `createdAt`, `updatedAt`

### Tabella `sessions`

- `id` (UUID) - Primary key
- `accountId` (UUID) - Foreign key → accounts
- `refreshToken` (VARCHAR) - Token univoco
- `expiresAt` (DATETIME) - Scadenza sessione
- `ipAddress` (VARCHAR) - IP client
- `userAgent` (TEXT) - User agent
- `isRevoked` (BOOLEAN) - Sessione revocata
- Timestamp: `createdAt`

### Tabella `reset_tokens`

- `id` (UUID) - Primary key
- `accountId` (UUID) - Foreign key → accounts
- `token` (VARCHAR) - Token univoco
- `expiresAt` (DATETIME) - Scadenza (1 ora)
- `used` (BOOLEAN) - Token utilizzato
- `ipAddress` (VARCHAR) - IP richiedente
- `userAgent` (TEXT) - User agent
- Timestamp: `createdAt`

## Production Deployment

```bash
# Build
npm run build

# Environment production
NODE_ENV=production
DB_SYNC=false  # IMPORTANTE: mai true in production!
JWT_SECRET=change-this-in-production-with-strong-secret

# Start
npm start
```

### Raccomandazioni Production

1. **JWT_SECRET** - Usa secret forte e unico (min 32 caratteri random)
2. **DB_SYNC** - Sempre `false`, gestisci migrazioni manualmente
3. **HTTPS** - Usa sempre HTTPS in production
4. **Rate Limiting** - Configura limiti appropriati per il tuo traffico
5. **Monitoring** - Implementa logging e monitoring (es. EdgLogger)
6. **Backup** - Backup automatici database regolari

## Espansioni Future

Il servizio è progettato per supportare facilmente:

- **2FA Module** - Two-Factor Authentication (TOTP, SMS)
- **OAuth Module** - Social login (Google, Microsoft, GitHub)
- **Audit Module** - Security logging e analytics
- **Admin Module** - Gestione utenti e sessioni da UI
- **Notifications Module** - Alert sicurezza via email/SMS

## Support

Per domande o problemi:

1. Verifica configurazione `.env`
2. Controlla log del server
3. Testa connessione database: `npm run db:sync`
4. Verifica health check: `curl http://localhost:3001/health`

---

**EDG Auth Service - Autenticazione sicura e scalabile per l'ecosistema EDG**
