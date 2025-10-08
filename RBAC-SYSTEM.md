# Sistema di Autorizzazione Bidimensionale (RBAC)

**Versione:** 1.0  
**Data:** Ottobre 2025  
**Progetto:** EDG Auth Service

---

## Indice

1. [Panoramica](#panoramica)
2. [Concetto Core](#concetto-core)
3. [Architettura](#architettura)
4. [Permessi Disponibili](#permessi-disponibili)
5. [Logica di Autorizzazione](#logica-di-autorizzazione)
6. [Esempi Pratici](#esempi-pratici)
7. [Schema Database](#schema-database)
8. [Ruoli Predefiniti](#ruoli-predefiniti)
9. [Implementazione Middleware](#implementazione-middleware)
10. [Casi d'Uso](#casi-duso)
11. [Vantaggi del Sistema](#vantaggi-del-sistema)
12. [Confronto con Altre Soluzioni](#confronto-con-altre-soluzioni)

---

## Panoramica

Il sistema di autorizzazione EDG utilizza un approccio **bidimensionale** basato su due tipologie di permessi ortogonali:

1. **MODULI** (dimensione "cosa"): Aree funzionali del sistema
2. **AZIONI** (dimensione "come"): Operazioni eseguibili

Un utente può accedere a una risorsa **solo se possiede ENTRAMBI i permessi** necessari (modulo AND azione).

### Esempio Concettuale

```
Utente ha: ['sales', 'warehouse', 'read', 'create', 'update']

Per modificare un cliente serve: modulo 'sales' AND azione 'update'
✅ L'utente ha entrambi → ACCESSO CONSENTITO

Per eliminare un cliente serve: modulo 'sales' AND azione 'delete'
❌ L'utente ha 'sales' ma NON ha 'delete' → ACCESSO NEGATO

Per vedere prodotti serve: modulo 'warehouse' AND azione 'read'
✅ L'utente ha entrambi → ACCESSO CONSENTITO

Per modificare prodotti serve: modulo 'warehouse' AND azione 'update'
✅ L'utente ha entrambi → ACCESSO CONSENTITO (anche se non era ovvio!)
```

---

## Concetto Core

### Due Dimensioni Ortogonali

```
        read    create   update   delete   approve   export
      +-------+--------+--------+--------+---------+--------+
sales |   ?   |   ?    |   ?    |   ?    |    ?    |   ?    |
      +-------+--------+--------+--------+---------+--------+
ware- |   ?   |   ?    |   ?    |   ?    |    ?    |   ?    |
house +-------+--------+--------+--------+---------+--------+
accou-|   ?   |   ?    |   ?    |   ?    |    ?    |   ?    |
nting +-------+--------+--------+--------+---------+--------+
repor-|   ?   |   ?    |   ?    |   ?    |    ?    |   ?    |
ts    +-------+--------+--------+--------+---------+--------+
admin |   ?   |   ?    |   ?    |   ?    |    ?    |   ?    |
      +-------+--------+--------+--------+---------+--------+
```

Ogni cella rappresenta una **combinazione modulo+azione**.  
L'utente ha accesso alla cella **solo se possiede ENTRAMBE le coordinate**.

### Formula di Accesso

```
hasAccess = hasModule(modulo) AND hasAction(azione)
```

### Permesso Speciale: '\*' (Root)

Il permesso `*` (wildcard) fornisce **accesso completo a tutto**:

- `permissions: ['*']` → Tutte le celle della matrice sono ✅

---

## Architettura

### Struttura Permessi

```typescript
type Permission = Module | Action;

// Esempio utente
permissions: [
  // MODULI
  'sales', // Accesso area vendite
  'warehouse', // Accesso magazzino
  'reports', // Accesso report

  // AZIONI
  'read', // Può leggere
  'create', // Può creare
  'update', // Può modificare
  // NO 'delete' → Non può eliminare nulla
];
```

### Database Schema

```
accounts
├── id (UUID)
├── email
├── password
├── accountType
├── roleId (FK → roles.id)
└── ...

roles
├── id (UUID)
├── name
├── description
└── isSystem

role_permissions
├── id (UUID)
├── roleId (FK → roles.id)
└── permission (VARCHAR)  ← 'sales' | 'read' | 'warehouse' | ...
```

**Nota importante:** Non servono tabelle incrociate moduli×azioni! I permessi sono semplicemente stringhe nella tabella `role_permissions`.

---

## Permessi Disponibili

### MODULI (Area Funzionali)

| Permesso     | Descrizione                              | Risorse Coperte                |
| ------------ | ---------------------------------------- | ------------------------------ |
| `*`          | Accesso a tutti i moduli (solo root)     | Tutto                          |
| `sales`      | Area vendite                             | clienti, ordini, preventivi    |
| `warehouse`  | Area magazzino                           | prodotti, giacenze, movimenti  |
| `accounting` | Area contabilità                         | fatture, pagamenti, scadenze   |
| `reports`    | Area report                              | report, statistiche, analytics |
| `admin`      | Amministrazione sistema                  | utenti, ruoli, configurazioni  |
| `partners`   | Gestione partner                         | anagrafica partner, contratti  |
| `agents`     | Gestione agenti                          | anagrafica agenti, commissioni |
| `system`     | Configurazioni sistema (solo root/admin) | backup, config avanzate        |

**Totale moduli:** ~9 permessi

### AZIONI (Operazioni)

| Permesso  | Descrizione                      | Applicabile A              |
| --------- | -------------------------------- | -------------------------- |
| `*`       | Tutte le azioni (solo root)      | Tutto                      |
| `read`    | Visualizzare risorse             | Tutte le risorse           |
| `create`  | Creare nuove risorse             | Tutte le risorse           |
| `update`  | Modificare risorse esistenti     | Tutte le risorse           |
| `delete`  | Eliminare risorse                | Tutte le risorse           |
| `approve` | Approvare (azione speciale)      | Fatture, ordini, richieste |
| `export`  | Esportare dati (azione speciale) | Report, dati               |

**Totale azioni:** ~7 permessi

### Totale Permessi Sistema

```
9 moduli + 7 azioni = 16 permessi totali
```

Invece di 50+ permessi nel sistema tradizionale (sales.read, sales.create, warehouse.read, warehouse.create, ecc.)!

---

## Logica di Autorizzazione

### Algoritmo di Verifica

```typescript
function hasAccess(userPermissions: string[], module: string, action: string): boolean {
  // 1. Root ha tutto
  if (userPermissions.includes('*')) {
    return true;
  }

  // 2. Verifica modulo
  const hasModule = userPermissions.includes(module);

  // 3. Verifica azione
  const hasAction = userPermissions.includes(action);

  // 4. Serve ENTRAMBI
  return hasModule && hasAction;
}
```

### Pseudo-codice Middleware

```typescript
// Route protetta
router.put('/clients/:id', requirePermission('sales', 'update'), updateClient);

// Il middleware verifica:
function requirePermission(module, action) {
  return (req, res, next) => {
    const userPerms = req.account.permissions; // es. ['sales', 'read', 'update']

    if (hasAccess(userPerms, module, action)) {
      next(); // ✅ Accesso consentito
    } else {
      res.status(403).json({ error: 'Permessi insufficienti' }); // ❌ Negato
    }
  };
}
```

---

## Esempi Pratici

### Esempio 1: Operatore Vendite Standard

**Permessi assegnati:**

```typescript
permissions: ['sales', 'reports', 'read', 'create', 'update'];
```

**Matrice permessi risultante:**

```
              | read | create | update | delete | approve | export |
--------------|------|--------|--------|--------|---------|--------|
sales         |  ✓   |   ✓    |   ✓    |   ✗    |    ✗    |   ✗    |
warehouse     |  ✗   |   ✗    |   ✗    |   ✗    |    ✗    |   ✗    |
accounting    |  ✗   |   ✗    |   ✗    |   ✗    |    ✗    |   ✗    |
reports       |  ✓   |   ✓    |   ✓    |   ✗    |    ✗    |   ✗    |
admin         |  ✗   |   ✗    |   ✗    |   ✗    |    ✗    |   ✗    |
```

**Cosa può fare:**

- ✅ Visualizzare clienti (`sales` + `read`)
- ✅ Creare clienti (`sales` + `create`)
- ✅ Modificare clienti (`sales` + `update`)
- ❌ Eliminare clienti (manca `delete`)
- ✅ Visualizzare ordini (`sales` + `read`)
- ✅ Creare ordini (`sales` + `create`)
- ✅ Visualizzare report (`reports` + `read`)
- ❌ Vedere prodotti (manca `warehouse`)

### Esempio 2: Operatore Magazzino

**Permessi assegnati:**

```typescript
permissions: ['warehouse', 'sales', 'read', 'create', 'update', 'delete'];
```

**Cosa può fare:**

- ✅ Gestione completa magazzino (CRUD completo)
- ✅ Visualizzare ordini per evadere (`sales` + `read`)
- ❌ Modificare ordini (manca `sales` + `update`)
- ❌ Vedere contabilità (manca `accounting`)

### Esempio 3: Contabile

**Permessi assegnati:**

```typescript
permissions: ['accounting', 'sales', 'reports', 'read', 'create', 'update', 'approve', 'export'];
```

**Cosa può fare:**

- ✅ Gestione completa contabilità
- ✅ Approvare fatture (`accounting` + `approve`)
- ✅ Visualizzare vendite (`sales` + `read`)
- ❌ Modificare clienti (ha `sales` + `read` ma NON `sales` + `update`)
- ✅ Esportare report (`reports` + `export`)
- ❌ Eliminare fatture (manca `delete` per sicurezza contabile)

### Esempio 4: Admin

**Permessi assegnati:**

```typescript
permissions: [
  'sales',
  'warehouse',
  'accounting',
  'reports',
  'admin',
  'partners',
  'agents',
  'read',
  'create',
  'update',
  'delete',
  'approve',
  'export',
];
// NO 'system' → Non può modificare config sistema
```

**Cosa può fare:**

- ✅ Praticamente tutto
- ❌ Solo root può accedere a configurazioni sistema critiche

### Esempio 5: Operatore ReadOnly

**Permessi assegnati:**

```typescript
permissions: ['sales', 'warehouse', 'accounting', 'reports', 'read'];
```

**Cosa può fare:**

- ✅ Visualizzare tutto in 4 moduli
- ❌ Non può creare/modificare/eliminare NULLA (manca `create`, `update`, `delete`)

---

## Schema Database

### Tabelle

```sql
-- Ruoli
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  isSystem BOOLEAN DEFAULT false,
  createdAt DATETIME,
  updatedAt DATETIME
);

-- Permessi dei ruoli (semplice lista)
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  roleId UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission VARCHAR(50) NOT NULL,  -- 'sales' | 'read' | 'warehouse' | ...
  createdAt DATETIME,
  UNIQUE(roleId, permission)
);

-- Accounts con ruolo
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255),
  accountType ENUM('operatore', 'partner', 'cliente', 'agente'),
  entityId UUID NOT NULL,
  roleId UUID NOT NULL REFERENCES roles(id),  -- ← Link al ruolo
  isActive BOOLEAN DEFAULT true,
  isVerified BOOLEAN DEFAULT false,
  lastLogin DATETIME,
  createdAt DATETIME,
  updatedAt DATETIME,
  UNIQUE(email, accountType)
);
```

### Esempio Dati

```sql
-- Ruolo operatore vendite standard
INSERT INTO roles VALUES
  ('uuid-1', 'operatore_vendite_standard', 'Operatore vendite senza delete', false);

-- Permessi del ruolo
INSERT INTO role_permissions (roleId, permission) VALUES
  ('uuid-1', 'sales'),
  ('uuid-1', 'reports'),
  ('uuid-1', 'read'),
  ('uuid-1', 'create'),
  ('uuid-1', 'update');
  -- NO delete!

-- Account con questo ruolo
INSERT INTO accounts VALUES
  ('uuid-account', 'mario.rossi@edg.it', 'hash...', 'operatore', 'uuid-entity', 'uuid-1', ...);
```

---

## Ruoli Predefiniti

### Root

```typescript
permissions: ['*'];
```

**Descrizione:** Accesso completo a tutto, nessuna restrizione.

### Admin

```typescript
permissions: [
  'sales',
  'warehouse',
  'accounting',
  'reports',
  'admin',
  'partners',
  'agents',
  'read',
  'create',
  'update',
  'delete',
  'approve',
  'export',
];
```

**Descrizione:** Amministratore con accesso quasi completo. Non può modificare configurazioni sistema critiche.

### Operatore Vendite Full

```typescript
permissions: ['sales', 'reports', 'read', 'create', 'update', 'delete', 'export'];
```

**Descrizione:** Gestione completa area vendite + export report.

### Operatore Vendite Standard

```typescript
permissions: ['sales', 'reports', 'read', 'create', 'update', 'export'];
```

**Descrizione:** Gestione vendite senza possibilità di eliminare.

### Operatore Vendite Junior

```typescript
permissions: ['sales', 'reports', 'read', 'create'];
```

**Descrizione:** Solo lettura e creazione, non può modificare o eliminare.

### Operatore Magazzino

```typescript
permissions: ['warehouse', 'sales', 'read', 'create', 'update', 'delete'];
```

**Descrizione:** Gestione completa magazzino + visualizzazione ordini.

### Contabile

```typescript
permissions: ['accounting', 'sales', 'reports', 'read', 'create', 'update', 'approve', 'export'];
```

**Descrizione:** Gestione contabilità completa, può approvare fatture. Non può eliminare per sicurezza.

### Operatore Report/Analytics

```typescript
permissions: ['sales', 'warehouse', 'accounting', 'reports', 'read', 'create', 'export'];
```

**Descrizione:** Accesso lettura ovunque, può creare ed esportare report. Non può modificare dati operativi.

### Operatore ReadOnly

```typescript
permissions: ['sales', 'warehouse', 'accounting', 'reports', 'read'];
```

**Descrizione:** Solo visualizzazione, nessuna modifica possibile.

### Guest

```typescript
permissions: ['sales', 'reports', 'read'];
```

**Descrizione:** Accesso minimo, solo visualizzazione vendite e report.

---

## Implementazione Middleware

### Middleware Principale

```typescript
/**
 * Richiede modulo + azione
 * Uso: requirePermission('sales', 'update')
 */
export const requirePermission = (module: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const account = req.account;

    if (!account || !account.permissions) {
      return res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta',
      });
    }

    const hasAccess = PermissionChecker.hasPermission(account.permissions, module, action);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Permessi insufficienti',
        required: { module, action },
      });
    }

    next();
  };
};
```

### Utilizzo nelle Route

```typescript
import { Router } from 'express';
import { authenticate } from './authMiddleware';
import { requirePermission } from './permissionMiddleware';

const router = Router();

// ==================== CLIENTI ====================
router.get('/clients', authenticate, requirePermission('sales', 'read'), getClientsHandler);

router.post('/clients', authenticate, requirePermission('sales', 'create'), createClientHandler);

router.put('/clients/:id', authenticate, requirePermission('sales', 'update'), updateClientHandler);

router.delete('/clients/:id', authenticate, requirePermission('sales', 'delete'), deleteClientHandler);

// ==================== PRODOTTI ====================
router.get('/products', authenticate, requirePermission('warehouse', 'read'));

router.post('/products', authenticate, requirePermission('warehouse', 'create'));

// ==================== FATTURE ====================
router.post('/invoices/:id/approve', authenticate, requirePermission('accounting', 'approve'));

// ==================== REPORT ====================
router.post('/reports/export', authenticate, requirePermission('reports', 'export'));
```

### Middleware Alternativi

```typescript
// Richiede solo modulo (qualsiasi azione)
requireModule('sales');

// Richiede solo azione (qualsiasi modulo)
requireAction('delete');

// Usa mapping risorse predefinito
requireResource('clients.update'); // → tradotto in ('sales', 'update')
```

---

## Casi d'Uso

### Caso 1: Separare Lettura da Modifica

**Problema:** Alcuni operatori possono solo vedere, altri possono modificare.

**Soluzione:**

```typescript
// Junior: può solo vedere
permissions: ['sales', 'read'];

// Senior: può vedere e modificare
permissions: ['sales', 'read', 'update'];
```

### Caso 2: Approvazione Fatture

**Problema:** Solo alcuni utenti possono approvare fatture.

**Soluzione:**

```typescript
// Contabile normale: può creare fatture
permissions: ['accounting', 'read', 'create', 'update'];

// Contabile senior: può anche approvare
permissions: ['accounting', 'read', 'create', 'update', 'approve'];
```

### Caso 3: Export Dati Sensibili

**Problema:** Non tutti possono esportare dati.

**Soluzione:**

```typescript
// Operatore normale: può vedere
permissions: ['sales', 'read'];

// Manager: può vedere ed esportare
permissions: ['sales', 'read', 'export'];
```

### Caso 4: Protezione Delete

**Problema:** Il delete è pericoloso, limitarlo.

**Soluzione:**

```typescript
// Maggior parte operatori: NON hanno 'delete'
permissions: ['sales', 'read', 'create', 'update'];

// Solo admin e senior: hanno 'delete'
permissions: ['sales', 'read', 'create', 'update', 'delete'];
```

### Caso 5: Ruolo Cross-Funzionale

**Problema:** Manager che deve vedere più aree ma non modificare.

**Soluzione:**

```typescript
permissions: ['sales', 'warehouse', 'accounting', 'reports', 'read', 'export'];
// Vede tutto, può esportare, non può modificare
```

---

## Vantaggi del Sistema

### 1. Numero Ridotto di Permessi

**Confronto:**

- Sistema tradizionale: 50+ permessi (sales.read, sales.create, warehouse.read, ...)
- Sistema bidimensionale: ~16 permessi (9 moduli + 7 azioni)

### 2. Combinazioni Potenti

Con 16 permessi base puoi creare **centinaia di configurazioni diverse**:

```
9 moduli × 7 azioni = 63 possibili combinazioni
```

### 3. Facile da Capire

```typescript
// Immediato da leggere
requirePermission('sales', 'update');
// → "Serve accesso vendite E capacità di modificare"

// Vs sistema tradizionale
requirePermission('clients.update', 'orders.update', 'quotes.update');
// → Ripetitivo e prolisso
```

### 4. Manutenzione Semplice

**Aggiungere nuovo modulo:**

```typescript
// Aggiungi solo 1 permesso
'logistics'; // → Automaticamente combinabile con tutte le azioni
```

**Aggiungere nuova azione:**

```typescript
// Aggiungi solo 1 permesso
'archive'; // → Automaticamente applicabile a tutti i moduli
```

### 5. Granularità Perfetta

Puoi controllare:

- **Per area**: "Accesso a vendite sì, magazzino no"
- **Per azione**: "Può creare e leggere, ma non modificare o eliminare"
- **Combinato**: "Può leggere vendite e magazzino, ma modificare solo magazzino"

### 6. Database Leggero

```sql
-- Per operatore vendite standard serve solo:
INSERT INTO role_permissions VALUES
  ('uuid', 'sales'),
  ('uuid', 'reports'),
  ('uuid', 'read'),
  ('uuid', 'create'),
  ('uuid', 'update');

-- Invece di 10+ righe nel sistema tradizionale
```

---

## Confronto con Altre Soluzioni

### Soluzione A: Permessi per Risorsa

```typescript
permissions: [
  'clients.read',
  'clients.create',
  'clients.update',
  'clients.delete',
  'orders.read',
  'orders.create',
  'orders.update',
  'orders.delete',
  'products.read',
  'products.create',
  'products.update',
  'products.delete',
  // ... 50+ permessi totali
];
```

**Problemi:**

- ❌ Esplosione permessi
- ❌ Ripetitivo
- ❌ Difficile manutenzione
- ❌ Database pesante

### Soluzione B: Permessi Generici Globali

```typescript
permissions: ['read', 'create', 'update', 'delete'];
```

**Problemi:**

- ❌ Zero granularità per area
- ❌ 'update' = modifica TUTTO (clienti, ordini, config sistema, ecc.)
- ❌ Impossibile separare accessi per modulo

### Soluzione C: Sistema Bidimensionale (SCELTO) ✅

```typescript
permissions: ['sales', 'warehouse', 'read', 'create', 'update'];
```

**Vantaggi:**

- ✅ Pochi permessi (16 base)
- ✅ Granularità perfetta
- ✅ Combinazioni infinite
- ✅ Facile manutenzione
- ✅ Intuitivo

---

## Note Implementative

### Caricamento Permessi in Token JWT

```typescript
// Nel token JWT salva solo l'ID ruolo
const accessToken = jwt.sign(
  {
    accountId: account.id,
    email: account.email,
    roleId: account.roleId, // ← Solo ID
  },
  secret
);

// Al middleware authenticate, carica i permessi
const role = await Role.findByPk(payload.roleId, {
  include: [{ model: RolePermission, as: 'permissions' }],
});

req.account = {
  ...payload,
  permissions: role.permissions.map(p => p.permission), // ['sales', 'read', ...]
};
```

**Perché non mettere permessi nel JWT?**

- ✅ Token più leggero
- ✅ Permessi aggiornabili in real-time (senza re-login)
- ✅ Revoca permessi immediata

### Performance

**Query ottimizzata:**

```sql
SELECT rp.permission
FROM accounts a
JOIN roles r ON a.roleId = r.id
JOIN role_permissions rp ON r.id = rp.roleId
WHERE a.id = ?
```

**Cache suggerita:**

- Cache permessi in memoria (Redis) per 5-10 minuti
- Invalidazione cache su modifica ruolo

### Estensioni Future

**Wildcard modulo (opzionale):**

```typescript
// Per coprire tutti i sottomoduli
permissions: ['sales.*']; // → sales, sales.quotes, sales.orders, ecc.
```

**Permessi temporanei:**

```typescript
// Permesso con scadenza
{ permission: 'system.backup', expiresAt: '2025-12-31' }
```

---

## Checklist Implementazione

- [ ] Creare tabella `roles`
- [ ] Creare tabella `role_permissions`
- [ ] Aggiungere `roleId` a tabella `accounts`
- [ ] Rimuovere campi `profile` e `level` da `accounts`
- [ ] Implementare `PermissionChecker` class
- [ ] Implementare middleware `requirePermission`
- [ ] Creare seed per ruoli predefiniti
- [ ] Aggiornare `AuthService` per gestire ruoli
- [ ] Aggiornare middleware `authenticate` per caricare permessi
- [ ] Aggiornare tutte le route con nuovi middleware
- [ ] Creare UI admin per gestione ruoli (opzionale)
- [ ] Documentare permessi nel README
- [ ] Test completi sistema autorizzazione

---

## Conclusione

Questo sistema bidimensionale offre il **miglior equilibrio** tra:

- **Semplicità**: Solo ~16 permessi base
- **Potenza**: Centinaia di combinazioni possibili
- **Manutenibilità**: Facile aggiungere moduli/azioni
- **Chiarezza**: Intuitivo per sviluppatori e amministratori

È la soluzione ideale per sistemi complessi che richiedono controllo granulare senza esplodere in complessità.

---

**Documento creato per:** EDG Auth Service  
**Sistema:** Role-Based Access Control (RBAC) Bidimensionale  
**Versione:** 1.0  
**Mantenere aggiornato:** Quando si aggiungono nuovi moduli o azioni
