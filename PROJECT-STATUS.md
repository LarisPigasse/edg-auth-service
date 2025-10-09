# EDG Auth Service - Stato Sviluppo

**Data ultimo aggiornamento:** Ottobre 2025  
**Versione:** 1.0 - In sviluppo  
**Fase:** Implementazione Sistema RBAC  
**Ultimo checkpoint:** Database sincronizzato, modelli registrati, servizio funzionante

---

## Indice

1. [Panoramica Progetto](#panoramica-progetto)
2. [Architettura Sistema](#architettura-sistema)
3. [Sistema di Autorizzazione RBAC](#sistema-di-autorizzazione-rbac)
4. [Struttura Database](#struttura-database)
5. [Stato Implementazione](#stato-implementazione)
6. [File Modificati/Creati](#file-modificaticreati)
7. [Prossimi Passi](#prossimi-passi)
8. [Note Importanti](#note-importanti)

---

## Panoramica Progetto

### Obiettivo

Creare un microservizio di autenticazione centralizzato per l'ecosistema EDG che gestisca:

- Autenticazione utenti con JWT (Access Token + Refresh Token)
- Autorizzazione basata su ruoli e permessi granulari (RBAC bidimensionale)
- Gestione sessioni multiple per dispositivo
- Reset password con token
- Multi-account type (operatore, partner, cliente, agente)

### Stack Tecnologico

- **Runtime:** Node.js 18+
- **Linguaggio:** TypeScript
- **Framework:** Express.js 5.x
- **Database:** MySQL (Sequelize ORM)
- **Autenticazione:** JWT (jsonwebtoken)
- **Password Hashing:** BCrypt (12 rounds)
- **Security:** Helmet, CORS, Rate Limiting

### Porte e Configurazione

- **Porta:** 3001 (configurabile via ENV)
- **Database:** MySQL 8.x
- **Ambiente:** Development (NODE_ENV=development)

---

## Architettura Sistema

### Struttura Progetto

```
auth-service/
├── src/
│   ├── core/                         # Framework riutilizzabile
│   │   ├── config/
│   │   │   ├── environment.ts        # Gestione configurazioni
│   │   │   └── database.ts           # DatabaseManager (Sequelize)
│   │   └── server.ts                 # EDGServer (Express modulare)
│   │
│   ├── modules/
│   │   └── auth/                     # Modulo autenticazione
│   │       ├── models/               # Modelli Sequelize
│   │       │   ├── Account.ts        # ✅ AGGIORNATO con roleId
│   │       │   ├── Session.ts        # ✅ AGGIORNATO con id INT
│   │       │   ├── ResetToken.ts     # ✅ AGGIORNATO con id INT
│   │       │   ├── Role.ts           # ✅ NUOVO (id + uuid)
│   │       │   ├── RolePermission.ts # ✅ NUOVO (solo id)
│   │       │   ├── associations.ts   # ✅ AGGIORNATO con RBAC
│   │       │   └── index.ts          # ✅ NUOVO (export centralized)
│   │       │
│   │       ├── services/             # Business logic
│   │       │   ├── AuthService.ts    # ⚠️ DA AGGIORNARE
│   │       │   └── TokenService.ts
│   │       │
│   │       ├── controllers/
│   │       │   └── AuthController.ts # ⚠️ DA AGGIORNARE
│   │       │
│   │       ├── middleware/
│   │       │   └── authMiddleware.ts # ⚠️ DA AGGIORNARE
│   │       │
│   │       ├── routes/
│   │       │   └── auth.routes.ts
│   │       │
│   │       ├── types/
│   │       │   └── auth.types.ts     # ⚠️ DA AGGIORNARE
│   │       │
│   │       └── utils/
│   │           ├── password.ts
│   │           ├── token.ts
│   │           └── validation.ts     # ⚠️ DA AGGIORNARE
│   │
│   └── app.ts                        # ✅ AGGIORNATO (registrazione modelli)
│
├── package.json
├── tsconfig.json
├── .env.example
└── README.md                         # ✅ AGGIORNATO
```

### Pattern Architetturali

1. **Server Modulare (EDGServer)**

   - Core riutilizzabile per tutti i microservizi EDG
   - Registrazione dinamica moduli
   - Gestione database centralizzata
   - Middleware security pre-configurati

2. **Inizializzazione Database**

   - Ordine controllato: Modelli → Sync → Service → Routes
   - Previene problemi di dipendenze circolari

3. **ID Strategy (Dual Key Pattern)**
   - `id` INTEGER AUTO_INCREMENT: chiave primaria interna (performance)
   - `uuid` UUID: identificatore pubblico per API esterne (sicurezza)
   - Foreign keys usano sempre INTEGER per performance

---

## Sistema di Autorizzazione RBAC

### Concetto: Sistema Bidimensionale

Il sistema usa **due dimensioni ortogonali** di permessi:

**MODULI** (dimensione "cosa")

- Aree funzionali: `sales`, `warehouse`, `accounting`, `reports`, `admin`, ecc.

**AZIONI** (dimensione "come")

- Operazioni: `read`, `create`, `update`, `delete`, `approve`, `export`

**Regola di accesso:** Un utente può accedere a una risorsa **SOLO SE possiede ENTRAMBI i permessi** (modulo AND azione).

### Esempio Pratico

```typescript
// Utente ha questi permessi
permissions: ['sales', 'warehouse', 'read', 'create', 'update']

// Per modificare un cliente serve: 'sales' AND 'update'
✅ L'utente ha entrambi → ACCESSO CONSENTITO

// Per eliminare un cliente serve: 'sales' AND 'delete'
❌ L'utente ha 'sales' ma NON ha 'delete' → ACCESSO NEGATO

// Per vedere prodotti serve: 'warehouse' AND 'read'
✅ L'utente ha entrambi → ACCESSO CONSENTITO
```

### Permessi Disponibili

**MODULI (9 permessi)**

- `*` - Accesso completo (solo root)
- `sales` - Clienti, ordini, preventivi
- `warehouse` - Prodotti, giacenze
- `accounting` - Fatture, pagamenti
- `reports` - Report, statistiche
- `admin` - Utenti, ruoli, configurazioni
- `partners` - Gestione partner
- `agents` - Gestione agenti
- `system` - Configurazioni sistema (solo root)

**AZIONI (7 permessi)**

- `*` - Tutte le azioni (solo root)
- `read` - Visualizzare
- `create` - Creare
- `update` - Modificare
- `delete` - Eliminare
- `approve` - Approvare (azione speciale)
- `export` - Esportare (azione speciale)

**Totale:** 16 permessi base invece di 50+ nel sistema tradizionale!

### Vantaggi

✅ Numero ridotto di permessi (16 vs 50+)  
✅ Combinazioni potenti (9 × 7 = 63 possibili)  
✅ Facile da capire e manutenere  
✅ Granularità perfetta  
✅ Database leggero

### Documento Completo

Per dettagli completi sul sistema RBAC, fare riferimento a **RBAC-SYSTEM.md** che contiene:

- Logica completa di autorizzazione
- Algoritmi di verifica permessi
- 9 ruoli predefiniti dettagliati
- Esempi pratici con matrici permessi
- Implementazione middleware
- Casi d'uso
- Schema database completo

---

## Struttura Database

### Schema Completo

```sql
-- ============================================================================
-- TABELLA: roles
-- ============================================================================
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  isSystem BOOLEAN NOT NULL DEFAULT false,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,

  INDEX idx_is_system (isSystem),
  INDEX idx_name_system (name, isSystem),
  UNIQUE INDEX unique_role_uuid (uuid),
  UNIQUE INDEX unique_role_name (name)
);

-- ============================================================================
-- TABELLA: role_permissions
-- ============================================================================
CREATE TABLE role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  roleId INT NOT NULL,
  permission VARCHAR(50) NOT NULL,
  createdAt DATETIME NOT NULL,

  FOREIGN KEY (roleId) REFERENCES roles(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  UNIQUE INDEX unique_role_permission (roleId, permission),
  INDEX idx_role_id (roleId),
  INDEX idx_permission (permission)
);

-- ============================================================================
-- TABELLA: accounts
-- ============================================================================
CREATE TABLE accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255),
  accountType ENUM('operatore', 'partner', 'cliente', 'agente') NOT NULL,
  entityId CHAR(36) NOT NULL,
  roleId INT NOT NULL,
  isActive BOOLEAN NOT NULL DEFAULT true,
  isVerified BOOLEAN NOT NULL DEFAULT false,
  lastLogin DATETIME,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,

  FOREIGN KEY (roleId) REFERENCES roles(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  UNIQUE INDEX unique_account_uuid (uuid),
  UNIQUE INDEX unique_email_account_type (email, accountType),
  INDEX idx_account_type (accountType),
  INDEX idx_entity_id (entityId),
  INDEX idx_account_type_entity (accountType, entityId),
  INDEX idx_role_id (roleId),
  INDEX idx_is_active (isActive),
  INDEX idx_email (email),
  INDEX idx_active_type (isActive, accountType),
  INDEX idx_last_login (lastLogin)
);

-- ============================================================================
-- TABELLA: sessions
-- ============================================================================
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  accountId INT NOT NULL,
  refreshToken VARCHAR(255) NOT NULL UNIQUE,
  expiresAt DATETIME NOT NULL,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  isRevoked BOOLEAN NOT NULL DEFAULT false,
  createdAt DATETIME NOT NULL,

  FOREIGN KEY (accountId) REFERENCES accounts(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  UNIQUE INDEX unique_refresh_token (refreshToken),
  INDEX idx_session_account_id (accountId),
  INDEX idx_session_expires_at (expiresAt),
  INDEX idx_session_account_expires (accountId, expiresAt),
  INDEX idx_session_is_revoked (isRevoked),
  INDEX idx_session_active (accountId, isRevoked, expiresAt),
  INDEX idx_session_created_at (createdAt)
);

-- ============================================================================
-- TABELLA: reset_tokens
-- ============================================================================
CREATE TABLE reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  accountId INT NOT NULL,
  token VARCHAR(100) NOT NULL UNIQUE,
  expiresAt DATETIME NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  createdAt DATETIME NOT NULL,

  FOREIGN KEY (accountId) REFERENCES accounts(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  UNIQUE INDEX unique_reset_token (token),
  INDEX idx_reset_account_id (accountId),
  INDEX idx_reset_expires_at (expiresAt),
  INDEX idx_reset_used (used),
  INDEX idx_reset_active (accountId, used, expiresAt),
  INDEX idx_reset_ip_created (ipAddress, createdAt),
  INDEX idx_reset_created_at (createdAt)
);
```

### Relazioni

```
roles (1) ──────< (N) role_permissions
  │
  │
  └──< (N) accounts (1) ──────< (N) sessions
                      │
                      └──────< (N) reset_tokens
```

### Pattern ID Applicato

| Tabella            | PK Interna | UUID Pubblico | Identificatore Esterno |
| ------------------ | ---------- | ------------- | ---------------------- |
| `roles`            | `id` INT   | ✅ `uuid`     | -                      |
| `role_permissions` | `id` INT   | ❌            | -                      |
| `accounts`         | `id` INT   | ✅ `uuid`     | -                      |
| `sessions`         | `id` INT   | ❌            | `refreshToken`         |
| `reset_tokens`     | `id` INT   | ❌            | `token`                |

**Rationale:**

- **id INT**: Performance (JOIN, indici), spazio (4 bytes), semplicità debug
- **uuid**: Sicurezza (non enumerabile), portabilità, uso in API pubbliche
- **Foreign Keys**: Sempre INT per massima performance

---

## Stato Implementazione

### ✅ COMPLETATO

#### 1. Modelli Database (100%)

- [x] `Account.ts` - Aggiornato con `roleId` (FK), rimossi `profile` e `level`
- [x] `Role.ts` - Creato (id + uuid)
- [x] `RolePermission.ts` - Creato (solo id)
- [x] `Session.ts` - Aggiornato con `id` INT, FK su `accountId`
- [x] `ResetToken.ts` - Aggiornato con `id` INT, FK su `accountId`
- [x] `associations.ts` - Aggiornato con relazioni RBAC
- [x] `index.ts` - Creato per export centralizzato

#### 2. Documentazione (100%)

- [x] `README.md` - Aggiornato per auth-service
- [x] `RBAC-SYSTEM.md` - Documento completo sistema RBAC
- [x] `PROJECT-STATUS.md` - Questo documento
- [x] Rimosso `QUICK-START.md` (non necessario)

#### 3. Core Framework (100%)

- [x] `server.ts` - EDGServer modulare
- [x] `database.ts` - DatabaseManager con Sequelize
- [x] `environment.ts` - Gestione configurazioni

#### 4. Utilities (100%)

- [x] `password.ts` - Hashing BCrypt, validazione policy
- [x] `token.ts` - Generazione token casuali, calcolo scadenze

#### 5. Registrazione Modelli e Database (100%) ✅ NUOVO!

- [x] `app.ts` - Aggiornato con registrazione Role e RolePermission
- [x] Ordine modelli corretto (rispetta dipendenze FK)
- [x] Database sincronizzato con successo
- [x] Health check testato e funzionante
- [x] 5 tabelle create: roles, role_permissions, accounts, sessions, reset_tokens

### ⚠️ DA COMPLETARE

#### 1. Types TypeScript (PRIORITÀ ALTA)

**File:** `src/modules/auth/types/auth.types.ts`

**Modifiche necessarie:**

- [ ] Rimuovere `ProfileType` type
- [ ] Rimuovere `level` da `AccountAttributes`
- [ ] Rimuovere `profile` da `AccountAttributes`
- [ ] Aggiungere `roleId: number` in `AccountAttributes`
- [ ] Rimuovere `profile` e `level` da `RegisterRequest`
- [ ] Aggiungere `roleId: number` in `RegisterRequest`
- [ ] Rimuovere `profile` e `level` da `AuthTokenPayload`
- [ ] Aggiungere `roleId?: number` in `AuthTokenPayload`
- [ ] Aggiungere nuovi types:

  ```typescript
  export interface RoleAttributes {
    id: number;
    uuid: string;
    name: string;
    description?: string;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface RolePermissionAttributes {
    id: number;
    roleId: number;
    permission: string;
    createdAt: Date;
  }

  export type Module = 'sales' | 'warehouse' | 'accounting' | 'reports' | 'admin' | 'partners' | 'agents' | 'system' | '*';
  export type Action = 'read' | 'create' | 'update' | 'delete' | 'approve' | 'export' | '*';
  export type Permission = Module | Action;
  ```

#### 2. Script Seed Ruoli (PRIORITÀ ALTA)

**Nuovo file:** `src/modules/auth/seed/roles.seed.ts`

**Contenuto:**

- [ ] Funzione per creare ruoli predefiniti:
  - root
  - admin
  - operatore_vendite_full
  - operatore_vendite_standard
  - operatore_vendite_junior
  - operatore_magazzino
  - contabile
  - operatore_readonly
  - guest
- [ ] Funzione per assegnare permessi ai ruoli
- [ ] Script eseguibile: `npm run seed:roles`

#### 3. Validation Utils (PRIORITÀ MEDIA)

**File:** `src/modules/auth/utils/validation.ts`

**Modifiche necessarie:**

- [ ] Rimuovere `isValidProfile()` function
- [ ] Rimuovere `isValidLevel()` function
- [ ] Aggiungere funzioni validazione permessi:
  ```typescript
  static isValidModule(module: string): boolean
  static isValidAction(action: string): boolean
  static isValidPermission(permission: string): boolean
  ```

#### 4. AuthService (PRIORITÀ ALTA)

**File:** `src/modules/auth/services/AuthService.ts`

**Modifiche necessarie:**

- [ ] Aggiungere `roleModel` nel constructor
- [ ] Aggiornare metodo `register()`:
  - Rimuovere validazione `profile` e `level`
  - Aggiungere validazione `roleId`
  - Salvare `roleId` invece di `profile`/`level`
- [ ] Aggiornare metodo `login()`:
  - Caricare `role` con `include`
  - Caricare `permissions` del ruolo
  - Includere permissions nell'access token payload
- [ ] Aggiornare metodo `refreshToken()`:
  - Caricare `role` e `permissions`
- [ ] Aggiungere metodo helper:
  ```typescript
  private async loadAccountPermissions(accountId: number): Promise<string[]>
  ```

#### 5. TokenService (PRIORITÀ MEDIA)

**File:** `src/modules/auth/services/TokenService.ts`

**Modifiche necessarie:**

- [ ] Aggiornare payload JWT per includere `permissions` array invece di `profile`/`level`
- [ ] Rimuovere `profile` e `level` da `AuthTokenPayload`

#### 6. AuthController (PRIORITÀ ALTA)

**File:** `src/modules/auth/controllers/AuthController.ts`

**Modifiche necessarie:**

- [ ] Aggiornare tutti i metodi per usare `roleId` invece di `profile`/`level`
- [ ] Rimuovere riferimenti a `profile` e `level` nelle response

#### 7. Auth Middleware (PRIORITÀ ALTA)

**File:** `src/modules/auth/middleware/authMiddleware.ts`

**Modifiche necessarie:**

- [ ] Rimuovere middleware `requireAccountType` (deprecato)
- [ ] Rimuovere middleware `requireProfile` (deprecato)
- [ ] Rimuovere middleware `requireMinLevel` (deprecato)
- [ ] Creare nuovo file `permissionMiddleware.ts` con:
  ```typescript
  export const requirePermission = (module: string, action: string) => {...}
  export const requireResource = (resource: string) => {...}
  export const requireModule = (module: string) => {...}
  export const requireAction = (action: string) => {...}
  ```
- [ ] Creare `PermissionChecker` class per logica verifica permessi

#### 8. Routes (PRIORITÀ MEDIA)

**File:** `src/modules/auth/routes/auth.routes.ts`

**Modifiche necessarie:**

- [ ] Aggiornare route protette con nuovi middleware
- [ ] Esempio:
  ```typescript
  router.post(
    '/logout-all',
    authenticate,
    requirePermission('admin', 'delete'), // Nuovo!
    authController.logoutAll
  );
  ```

#### 9. Service per Gestione Ruoli (PRIORITÀ MEDIA)

**Nuovo file:** `src/modules/auth/services/RoleService.ts`

**Metodi necessari:**

```typescript
class RoleService {
  async createRole(name, description, permissions): Promise<Role>;
  async getRoleById(id): Promise<Role>;
  async getRoleByName(name): Promise<Role>;
  async getAllRoles(): Promise<Role[]>;
  async updateRole(id, data): Promise<Role>;
  async deleteRole(id): Promise<void>;
  async addPermissionToRole(roleId, permission): Promise<void>;
  async removePermissionFromRole(roleId, permission): Promise<void>;
  async getRolePermissions(roleId): Promise<string[]>;
}
```

#### 10. PermissionService (PRIORITÀ ALTA)

**Nuovo file:** `src/modules/auth/services/PermissionService.ts`

**Metodi necessari:**

```typescript
class PermissionService {
  async hasPermission(accountId, module, action): Promise<boolean>;
  async hasAllPermissions(accountId, permissions): Promise<boolean>;
  async hasAnyPermission(accountId, permissions): Promise<boolean>;
  async getAccountPermissions(accountId): Promise<string[]>;
}
```

#### 11. Controller Gestione Ruoli (PRIORITÀ BASSA)

**Nuovo file:** `src/modules/auth/controllers/RoleController.ts`

**Endpoints:**

- `GET /roles` - Lista ruoli
- `POST /roles` - Crea ruolo
- `GET /roles/:id` - Dettaglio ruolo
- `PUT /roles/:id` - Aggiorna ruolo
- `DELETE /roles/:id` - Elimina ruolo
- `POST /roles/:id/permissions` - Aggiungi permesso
- `DELETE /roles/:id/permissions/:permission` - Rimuovi permesso

#### 12. Routes Gestione Ruoli (PRIORITÀ BASSA)

**Nuovo file:** `src/modules/auth/routes/role.routes.ts`

Configurazione route per RoleController

#### 13. Testing (PRIORITÀ MEDIA)

- [ ] Test modelli (creazione, associazioni)
- [ ] Test AuthService con RBAC
- [ ] Test PermissionChecker
- [ ] Test middleware permessi
- [ ] Test endpoints con vari ruoli

---

## File Modificati/Creati

### ✅ File Completati

```
✅ src/modules/auth/models/Account.ts        (AGGIORNATO - roleId)
✅ src/modules/auth/models/Role.ts           (NUOVO - id + uuid)
✅ src/modules/auth/models/RolePermission.ts (NUOVO - solo id)
✅ src/modules/auth/models/Session.ts        (AGGIORNATO - id INT)
✅ src/modules/auth/models/ResetToken.ts     (AGGIORNATO - id INT)
✅ src/modules/auth/models/associations.ts   (AGGIORNATO - RBAC)
✅ src/modules/auth/models/index.ts          (NUOVO - exports)
✅ src/app.ts                                (AGGIORNATO - registrazione modelli)
✅ README.md                                 (AGGIORNATO)
✅ RBAC-SYSTEM.md                            (NUOVO)
✅ PROJECT-STATUS.md                         (NUOVO - questo file)
```

### ⚠️ File da Modificare

```
⚠️ src/modules/auth/types/auth.types.ts         (rimuovi profile/level)
⚠️ src/modules/auth/utils/validation.ts         (rimuovi validazioni vecchie)
⚠️ src/modules/auth/services/AuthService.ts     (usa roleId, carica permissions)
⚠️ src/modules/auth/services/TokenService.ts    (aggiorna payload JWT)
⚠️ src/modules/auth/controllers/AuthController.ts (usa roleId)
⚠️ src/modules/auth/middleware/authMiddleware.ts (rimuovi vecchi middleware)
⚠️ src/modules/auth/routes/auth.routes.ts       (aggiorna protezioni)
```

### 🆕 File da Creare

```
🆕 src/modules/auth/middleware/permissionMiddleware.ts (nuovi middleware RBAC)
🆕 src/modules/auth/services/PermissionService.ts      (verifica permessi)
🆕 src/modules/auth/services/RoleService.ts            (gestione ruoli)
🆕 src/modules/auth/seed/roles.seed.ts                 (seed ruoli predefiniti)
🆕 src/modules/auth/controllers/RoleController.ts      (OPZIONALE - admin UI)
🆕 src/modules/auth/routes/role.routes.ts              (OPZIONALE - admin UI)
```

---

## Prossimi Passi

### Fase 1: Completamento Base (PRIORITÀ ALTA)

1. ~~**Aggiornare app.ts**~~ ✅ COMPLETATO

   - ~~Registrare Role e RolePermission nei modelli~~
   - ~~Testare sincronizzazione database~~

2. **Aggiornare Types**

   - Rimuovere ProfileType, profile, level
   - Aggiungere RoleAttributes, RolePermissionAttributes
   - Aggiungere Module, Action, Permission types

3. **Creare Script Seed**

   - Implementare `roles.seed.ts`
   - Creare 9 ruoli predefiniti con permessi
   - Comando: `npm run seed:roles`

4. ~~**Testare Database**~~ ✅ COMPLETATO
   - ~~`npm run db:sync`~~
   - ~~Verificare creazione tabelle~~
   - ~~Eseguire seed~~ (da fare)
   - ~~Verificare dati~~ (da fare)

### Fase 2: Aggiornamento Business Logic (PRIORITÀ ALTA)

5. **Creare PermissionService**

   - Implementare logica verifica permessi (module AND action)
   - Metodi: hasPermission, hasAllPermissions, hasAnyPermission

6. **Creare Permission Middleware**

   - requirePermission(module, action)
   - requireResource(resource)
   - requireModule(module)
   - requireAction(action)

7. **Aggiornare AuthService**

   - Usare roleId nelle registrazioni
   - Caricare permissions nel login/refresh
   - Rimuovere logica profile/level

8. **Aggiornare AuthController**
   - Aggiornare tutti i metodi per RBAC
   - Rimuovere riferimenti profile/level

### Fase 3: Testing e Documentazione (PRIORITÀ MEDIA)

9. **Testing Completo**

   - Test unitari modelli
   - Test integration AuthService
   - Test middleware permessi
   - Test endpoints con vari ruoli

10. **Aggiornare Routes**
    - Proteggere endpoint con nuovi middleware
    - Testare autorizzazioni

### Fase 4: Features Opzionali (PRIORITÀ BASSA)

11. **Gestione Ruoli via API**

    - RoleService completo
    - RoleController
    - Route /roles/\*
    - UI Admin (futuro)

12. **Miglioramenti**
    - Cache permessi (Redis)
    - Logging avanzato
    - Metrics e monitoring

---

## Note Importanti

### Decisioni Architetturali Chiave

1. **Pattern Dual Key (id + uuid)**

   - PRIMARY KEY: `id` INTEGER AUTO_INCREMENT (performance)
   - PUBLIC ID: `uuid` UUID (sicurezza, API)
   - Foreign keys usano sempre `id` INTEGER

2. **Sistema RBAC Bidimensionale**

   - Permessi = MODULI (cosa) + AZIONI (come)
   - Accesso richiede ENTRAMBI (AND logic)
   - 16 permessi base invece di 50+

3. **Ordine Inizializzazione**

   - Database sync → Load models → Init services → Register routes
   - Previene dipendenze circolari

4. **Security**
   - JWT Access Token: 15 minuti
   - JWT Refresh Token: 7 giorni
   - BCrypt rounds: 12
   - Rate limiting: 100 req/15min per IP

### Convenzioni Codice

1. **Naming**

   - Modelli: PascalCase (Account, Role)
   - Servizi: PascalCase + Service suffix (AuthService)
   - Middleware: camelCase (authenticate, requirePermission)
   - Types: PascalCase per interfaces, lowercase per union types

2. **File Structure**

   - Un file = un modello/service/controller
   - index.ts per export centralizzato
   - Naming: PascalCase per classi, kebab-case per utilities

3. **Database**
   - Tabelle: snake_case plurale (accounts, role_permissions)
   - Colonne Sequelize: camelCase nel model, camelCase mappato a snake_case in DB
   - Foreign keys: sempre `{tabella}Id` (roleId, accountId)

### Environment Variables Richieste

```env
# Database
DB_NAME=edg_auth
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Service
SERVICE_NAME=EDG Auth Service
PORT=3001
NODE_ENV=development

# CORS (opzionale)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Security (opzionale)
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_ATTEMPTS=100
```

### Comandi Utili

```bash
# Development
npm run dev                 # Avvia con hot reload
npm run db:sync             # Sync database (crea tabelle)
DB_SYNC=true npm run dev    # Avvia con sync automatico

# Build & Production
npm run build              # Compila TypeScript
npm start                  # Avvia production

# Testing
npm test                   # Run tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report

# Code Quality
npm run lint               # Linting
npm run lint:fix           # Auto-fix

# Seed (da implementare)
npm run seed:roles         # Seed ruoli predefiniti
npm run seed:all           # Seed completo
```

### Troubleshooting Comune

**Errore: Cannot find module Role**

- Soluzione: Verificare export in `models/index.ts`
- Verificare import in `app.ts`

**Errore: roleId cannot be null**

- Soluzione: Assicurarsi che il seed ruoli sia stato eseguito
- Creare almeno un ruolo prima di creare account

**Errore: Foreign key constraint / Failed to open the referenced table 'roles'** ⚠️ IMPORTANTE

- Causa: Ordine errato di registrazione modelli in app.ts
- Soluzione: Rispettare ordine dipendenze FK:
  ```typescript
  models: [
    createRoleModel, // 1️⃣ PRIMO (nessuna FK)
    createRolePermissionModel, // 2️⃣ (FK → roles)
    createAccountModel, // 3️⃣ (FK → roles)
    createSessionModel, // 4️⃣ (FK → accounts)
    createResetTokenModel, // 5️⃣ (FK → accounts)
  ];
  ```
- **ORDINE CRITICO**: Le tabelle senza FK devono essere create prima di quelle che le referenziano

**Performance lenta con UUID**

- Ricorda: usiamo INTEGER per PK e FK (performance)
- UUID è solo per identificazione esterna (API)

**Database sync non crea tutte le tabelle**

- Soluzione: DROP manualmente tutte le tabelle e ricrea da zero
- Comando: `mysql -u root -p -e "USE edg_auth; DROP TABLE IF EXISTS reset_tokens, sessions, role_permissions, accounts, roles;"`

### Riferimenti Esterni

- **Sequelize Docs:** https://sequelize.org/docs/v6/
- **JWT Best Practices:** https://datatracker.ietf.org/doc/html/rfc8725
- **Express Security:** https://expressjs.com/en/advanced/best-practice-security.html
- **RBAC Pattern:** https://en.wikipedia.org/wiki/Role-based_access_control

---

## Checkpoint per Nuova Chat

Quando riprendi il lavoro in una nuova chat, condividi:

1. **Questo documento** (`PROJECT-STATUS.md`)
2. **RBAC-SYSTEM.md** (sistema autorizzazione completo)
3. **Stato attuale:** "Database funzionante, modelli sincronizzati. Prossimo step: creare seed ruoli o aggiornare types"
4. **Prossimo step:** "Creare script seed per ruoli predefiniti" o "Aggiornare auth.types.ts"

### Template Messaggio Nuova Chat

```
Sto sviluppando l'EDG Auth Service con sistema RBAC bidimensionale.

STATO ATTUALE:
- ✅ Modelli database completati e sincronizzati
- ✅ Pattern Dual Key implementato (id INT + uuid)
- ✅ Associazioni RBAC configurate
- ✅ app.ts aggiornato con ordine corretto modelli
- ✅ Database testato e funzionante (5 tabelle create)
- ⚠️ Da fare: seed ruoli, aggiornare types, services, middleware

SISTEMA RBAC:
- Permessi bidimensionali: MODULI (cosa) + AZIONI (come)
- Accesso = hasModule(modulo) AND hasAction(azione)
- 16 permessi base: 9 moduli + 7 azioni

DOCUMENTI DI RIFERIMENTO:
[Qui incolli PROJECT-STATUS.md e RBAC-SYSTEM.md]

PROSSIMO STEP:
Creare script seed per i ruoli predefiniti (root, admin, operatori...)
oppure aggiornare auth.types.ts per rimuovere profile/level.
```

---

**Documento aggiornato:** Ottobre 2025  
**Versione:** 1.1  
**Ultimo checkpoint:** Database sincronizzato, modelli registrati, servizio funzionante  
**Mantenere aggiornato** dopo ogni sessione di sviluppo significativa
