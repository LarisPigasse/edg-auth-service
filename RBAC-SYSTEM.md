# Sistema di Autorizzazione RBAC - EDG Auth Service

**Versione:** 2.0 (Sistema Composto con Wildcards)  
**Data:** Ottobre 2025  
**Progetto:** EDG Auth Service

---

## Indice

1. [Panoramica](#panoramica)
2. [Concetto Core](#concetto-core)
3. [Architettura Permessi](#architettura-permessi)
4. [Moduli del Sistema](#moduli-del-sistema)
5. [Azioni Disponibili](#azioni-disponibili)
6. [Ruoli Predefiniti](#ruoli-predefiniti)
7. [Logica di Autorizzazione](#logica-di-autorizzazione)
8. [Esempi Pratici](#esempi-pratici)
9. [Implementazione](#implementazione)
10. [Schema Database](#schema-database)
11. [Espansione Futura](#espansione-futura)

---

## Panoramica

Il sistema di autorizzazione EDG utilizza un approccio **a permessi composti espliciti con wildcards** per garantire:

- **Massima flessibilità** per adattarsi a qualsiasi workflow
- **Chiarezza ed esplicitezza** - nessun comportamento implicito
- **Scalabilità** - facilmente estendibile con nuovi moduli e azioni
- **Standard industriale** - simile a AWS IAM, Kubernetes RBAC, Google Cloud IAM

### Perché Questo Sistema?

Dopo aver valutato diverse alternative (permessi bidimensionali, gerarchie implicite), abbiamo scelto il **sistema composto esplicito** perché:

1. **Nessuna ambiguità**: Se un utente ha `spedizioni.create`, può SOLO creare spedizioni (non implica automaticamente altri permessi)
2. **Supporta workflow complessi**: Un operatore può creare ma non modificare, oppure modificare ma non eliminare - qualsiasi combinazione è possibile
3. **Facile debug**: Se qualcuno non può fare un'azione, è immediato capire quale permesso manca
4. **Futuro-proof**: Nuovi moduli o azioni si aggiungono senza modificare la logica esistente

---

## Concetto Core

### Struttura Permessi

I permessi seguono la notazione **`modulo.azione`**:

```
spedizioni.read     → Visualizzare spedizioni
spedizioni.create   → Creare nuove spedizioni
gestione.*          → Wildcard: tutte le azioni sul modulo gestione
*                   → Root: accesso completo al sistema
```

### Regole Fondamentali

1. **Ogni permesso è esplicito**: Non esistono permessi impliciti o gerarchie
2. **Wildcard modulo** (`modulo.*`): Garantisce TUTTE le azioni su quel modulo
3. **Wildcard globale** (`*`): Solo per root, garantisce accesso completo
4. **Nessuna gerarchia**: `create` NON implica `read`, `update` NON implica `read` - tutto esplicito

---

## Architettura Permessi

### Formula di Verifica

```typescript
hasPermission(userPermissions, modulo, azione) {
  // 1. Root ha tutto
  if (userPermissions.includes('*')) return true;

  // 2. Wildcard modulo
  if (userPermissions.includes(`${modulo}.*`)) return true;

  // 3. Permesso specifico
  if (userPermissions.includes(`${modulo}.${azione}`)) return true;

  return false;
}
```

### Esempio Pratico

```typescript
// Utente con questi permessi
permissions: ['spedizioni.read', 'spedizioni.create', 'report.*']

// Verifiche
hasPermission('spedizioni', 'read')    → ✅ true  (ha spedizioni.read)
hasPermission('spedizioni', 'create')  → ✅ true  (ha spedizioni.create)
hasPermission('spedizioni', 'update')  → ❌ false (NON ha spedizioni.update)
hasPermission('spedizioni', 'delete')  → ❌ false (NON ha spedizioni.delete)
hasPermission('report', 'read')        → ✅ true  (ha report.*)
hasPermission('report', 'export')      → ✅ true  (ha report.*)
hasPermission('gestione', 'read')      → ❌ false (NON ha gestione.*)
```

---

## Moduli del Sistema

### Moduli Attuali

| Modulo       | Descrizione                     | Risorse Coperte                        |
| ------------ | ------------------------------- | -------------------------------------- |
| `spedizioni` | Gestione spedizioni e ordini    | Ordini, tracking, stato spedizioni     |
| `gestione`   | Amministrazione sistema         | Utenti, ruoli, configurazioni business |
| `report`     | Report e statistiche            | Dashboard, analytics, export dati      |
| `sistema`    | Configurazioni critiche sistema | Backup, config avanzate, manutenzione  |

### Caratteristiche Moduli

**`spedizioni`**

- Modulo operativo principale
- Accessibile a operatori e guest (limitato)

**`gestione`**

- Modulo amministrativo
- Solo admin e root
- Gestione utenti, ruoli, permessi

**`report`**

- Visualizzazione dati e analytics
- Accessibile in lettura anche a guest
- Export limitato ai ruoli autorizzati

**`sistema`**

- Configurazioni critiche
- **Solo root** - protezione massima
- Backup, config server, manutenzione

---

## Azioni Disponibili

### Azioni Standard

Ogni modulo supporta queste azioni base:

| Azione   | Descrizione                  | Esempio                    |
| -------- | ---------------------------- | -------------------------- |
| `read`   | Visualizzare risorse         | Vedere lista ordini        |
| `create` | Creare nuove risorse         | Creare nuovo ordine        |
| `update` | Modificare risorse esistenti | Aggiornare stato ordine    |
| `delete` | Eliminare risorse            | Eliminare ordine annullato |

### Azioni Speciali

Alcune azioni sono specifiche per certi moduli:

| Azione    | Moduli                   | Descrizione                      |
| --------- | ------------------------ | -------------------------------- |
| `export`  | `report`, `spedizioni`   | Esportare dati in Excel/PDF      |
| `approve` | `spedizioni`, `gestione` | Approvare/autorizzare (workflow) |

### Wildcard

| Wildcard   | Significato                    |
| ---------- | ------------------------------ |
| `modulo.*` | Tutte le azioni su quel modulo |
| `*`        | Accesso completo (solo root)   |

---

## Ruoli Predefiniti

### 1. root

**Descrizione:** Accesso completo assoluto al sistema

```typescript
permissions: ['*'];
```

**Cosa può fare:**

- ✅ Tutto su tutti i moduli
- ✅ Accesso configurazioni sistema critiche
- ✅ Gestione completa utenti e ruoli
- ✅ Backup e manutenzione sistema

**Quando usarlo:**

- Super amministratore
- Owner del sistema
- Operazioni di sistema critiche

---

### 2. admin

**Descrizione:** Amministratore del sistema (NO accesso sistema critico)

```typescript
permissions: [
  'spedizioni.*',
  'gestione.*',
  'report.*',
  // NO 'sistema.*' - solo root può accedere
];
```

**Cosa può fare:**

- ✅ Gestione completa spedizioni (CRUD)
- ✅ Gestione utenti, ruoli, permessi
- ✅ Creazione ed export report
- ❌ NON può modificare config sistema critiche (backup, server, ecc.)

**Quando usarlo:**

- Manager operativi
- Responsabili di area
- Amministratori delegati

---

### 3. operatore

**Descrizione:** Operatore standard (solo operativo, NO gestione)

```typescript
permissions: [
  'spedizioni.*',
  'report.read',
  'report.create',
  'report.export',
  // NO 'gestione.*' - non può gestire utenti/ruoli
  // NO 'sistema.*'
];
```

**Cosa può fare:**

- ✅ Gestione completa spedizioni (CRUD)
- ✅ Visualizzare report
- ✅ Creare report personalizzati
- ✅ Esportare dati
- ❌ NON può gestire utenti/ruoli
- ❌ NON può modificare configurazioni

**Quando usarlo:**

- Operatori quotidiani
- Staff operativo
- Utenti interni standard

---

### 4. guest

**Descrizione:** Accesso limitato in sola lettura

```typescript
permissions: [
  'spedizioni.read',
  'report.read',
  // Solo visualizzazione, nessuna modifica
];
```

**Cosa può fare:**

- ✅ Visualizzare spedizioni
- ✅ Visualizzare report
- ❌ NON può creare/modificare/eliminare nulla
- ❌ NON può esportare dati
- ❌ NON può accedere a gestione

**Quando usarlo:**

- Clienti esterni
- Partner con accesso limitato
- Account demo
- Visualizzatori

---

## Logica di Autorizzazione

### Matrice Permessi

```
              | read  | create | update | delete | export |
--------------|-------|--------|--------|--------|--------|
spedizioni    |       |        |        |        |   ✓    |
gestione      |       |        |        |        |        |
report        |   ✓   |   ✓    |        |        |   ✓    |
sistema       |       |        |        |        |        |
```

**root:**

```
              | read  | create | update | delete | export |
--------------|-------|--------|--------|--------|--------|
spedizioni    |   ✓   |   ✓    |   ✓    |   ✓    |   ✓    |
gestione      |   ✓   |   ✓    |   ✓    |   ✓    |   ✓    |
report        |   ✓   |   ✓    |   ✓    |   ✓    |   ✓    |
sistema       |   ✓   |   ✓    |   ✓    |   ✓    |   ✓    |
```

**admin:**

```
              | read  | create | update | delete | export |
--------------|-------|--------|--------|--------|--------|
spedizioni    |   ✓   |   ✓    |   ✓    |   ✓    |   ✓    |
gestione      |   ✓   |   ✓    |   ✓    |   ✓    |   ✓    |
report        |   ✓   |   ✓    |   ✓    |   ✓    |   ✓    |
sistema       |   ✗   |   ✗    |   ✗    |   ✗    |   ✗    |
```

**operatore:**

```
              | read  | create | update | delete | export |
--------------|-------|--------|--------|--------|--------|
spedizioni    |   ✓   |   ✓    |   ✓    |   ✓    |   ✓    |
gestione      |   ✗   |   ✗    |   ✗    |   ✗    |   ✗    |
report        |   ✓   |   ✓    |        |        |   ✓    |
sistema       |   ✗   |   ✗    |   ✗    |   ✗    |   ✗    |
```

**guest:**

```
              | read  | create | update | delete | export |
--------------|-------|--------|--------|--------|--------|
spedizioni    |   ✓   |   ✗    |   ✗    |   ✗    |   ✗    |
gestione      |   ✗   |   ✗    |   ✗    |   ✗    |   ✗    |
report        |   ✓   |   ✗    |   ✗    |   ✗    |   ✗    |
sistema       |   ✗   |   ✗    |   ✗    |   ✗    |   ✗    |
```

---

## Esempi Pratici

### Caso 1: Operatore Crea Spedizione

```typescript
// Operatore con permessi
permissions: ['spedizioni.*', 'report.read', 'report.create', 'report.export']

// Tenta di creare spedizione
POST /spedizioni
requirePermission('spedizioni', 'create')

// Verifica
hasPermission(['spedizioni.*', ...], 'spedizioni', 'create')
→ ✅ true (ha spedizioni.*)
→ ACCESSO CONSENTITO
```

### Caso 2: Guest Tenta di Modificare

```typescript
// Guest con permessi
permissions: ['spedizioni.read', 'report.read']

// Tenta di modificare spedizione
PUT /spedizioni/:id
requirePermission('spedizioni', 'update')

// Verifica
hasPermission(['spedizioni.read', 'report.read'], 'spedizioni', 'update')
→ ❌ false (ha solo spedizioni.read)
→ ACCESSO NEGATO (403 Forbidden)
```

### Caso 3: Admin Gestisce Utenti

```typescript
// Admin con permessi
permissions: ['spedizioni.*', 'gestione.*', 'report.*']

// Tenta di creare utente
POST /users
requirePermission('gestione', 'create')

// Verifica
hasPermission([..., 'gestione.*', ...], 'gestione', 'create')
→ ✅ true (ha gestione.*)
→ ACCESSO CONSENTITO
```

### Caso 4: Admin Tenta Config Sistema

```typescript
// Admin con permessi
permissions: ['spedizioni.*', 'gestione.*', 'report.*']

// Tenta di modificare config sistema
POST /system/backup
requirePermission('sistema', 'create')

// Verifica
hasPermission([..., 'gestione.*', ...], 'sistema', 'create')
→ ❌ false (NON ha sistema.*)
→ ACCESSO NEGATO (403 Forbidden)
→ Solo root può fare backup
```

### Caso 5: Operatore Export Report

```typescript
// Operatore con permessi
permissions: ['spedizioni.*', 'report.read', 'report.create', 'report.export']

// Tenta di esportare report
POST /reports/export
requirePermission('report', 'export')

// Verifica
hasPermission([..., 'report.export'], 'report', 'export')
→ ✅ true (ha report.export esplicito)
→ ACCESSO CONSENTITO
```

---

## Implementazione

### PermissionChecker Class

```typescript
export class PermissionChecker {
  /**
   * Verifica se l'utente ha il permesso richiesto
   */
  static hasPermission(userPermissions: string[], module: string, action: string): boolean {
    // 1. Root ha tutto
    if (userPermissions.includes('*')) {
      return true;
    }

    // 2. Wildcard modulo (es. 'spedizioni.*')
    if (userPermissions.includes(`${module}.*`)) {
      return true;
    }

    // 3. Permesso specifico (es. 'spedizioni.read')
    if (userPermissions.includes(`${module}.${action}`)) {
      return true;
    }

    // 4. Nessun permesso trovato
    return false;
  }

  /**
   * Verifica se ha TUTTI i permessi richiesti
   */
  static hasAllPermissions(userPermissions: string[], requirements: Array<{ module: string; action: string }>): boolean {
    return requirements.every(req => this.hasPermission(userPermissions, req.module, req.action));
  }

  /**
   * Verifica se ha ALMENO UNO dei permessi
   */
  static hasAnyPermission(userPermissions: string[], requirements: Array<{ module: string; action: string }>): boolean {
    return requirements.some(req => this.hasPermission(userPermissions, req.module, req.action));
  }
}
```

### Middleware Express

```typescript
/**
 * Middleware per richiedere permesso specifico
 * Uso: requirePermission('spedizioni', 'create')
 */
export const requirePermission = (module: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const account = (req as any).account;

    if (!account || !account.permissions) {
      res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta',
      });
      return;
    }

    const hasAccess = PermissionChecker.hasPermission(account.permissions, module, action);

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Permessi insufficienti',
        required: { module, action },
        message: `Richiede permesso: ${module}.${action}`,
      });
      return;
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

// ==================== SPEDIZIONI ====================
router.get('/spedizioni', authenticate, requirePermission('spedizioni', 'read'), getShipmentsHandler);

router.post('/spedizioni', authenticate, requirePermission('spedizioni', 'create'), createShipmentHandler);

router.put('/spedizioni/:id', authenticate, requirePermission('spedizioni', 'update'), updateShipmentHandler);

router.delete('/spedizioni/:id', authenticate, requirePermission('spedizioni', 'delete'), deleteShipmentHandler);

// ==================== REPORT ====================
router.get('/reports', authenticate, requirePermission('report', 'read'));

router.post('/reports/export', authenticate, requirePermission('report', 'export'));

// ==================== GESTIONE UTENTI ====================
router.get('/users', authenticate, requirePermission('gestione', 'read'));

router.post('/users', authenticate, requirePermission('gestione', 'create'));

// ==================== SISTEMA (solo root) ====================
router.post('/system/backup', authenticate, requirePermission('sistema', 'create'));
```

---

## Schema Database

### Tabelle

```sql
-- Ruoli
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  isSystem BOOLEAN NOT NULL DEFAULT false,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

-- Permessi dei ruoli
CREATE TABLE role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  roleId INT NOT NULL,
  permission VARCHAR(50) NOT NULL,
  createdAt DATETIME NOT NULL,

  FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE INDEX (roleId, permission)
);

-- Accounts
CREATE TABLE accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  roleId INT NOT NULL,
  -- altri campi...

  FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE RESTRICT
);
```

### Dati Seed

```sql
-- Root
INSERT INTO roles VALUES (1, 'uuid-1', 'root', 'Accesso completo', true);
INSERT INTO role_permissions VALUES (NULL, 1, '*');

-- Admin
INSERT INTO roles VALUES (2, 'uuid-2', 'admin', 'Amministratore', true);
INSERT INTO role_permissions VALUES
  (NULL, 2, 'spedizioni.*'),
  (NULL, 2, 'gestione.*'),
  (NULL, 2, 'report.*');

-- Operatore
INSERT INTO roles VALUES (3, 'uuid-3', 'operatore', 'Operatore standard', true);
INSERT INTO role_permissions VALUES
  (NULL, 3, 'spedizioni.*'),
  (NULL, 3, 'report.read'),
  (NULL, 3, 'report.create'),
  (NULL, 3, 'report.export');

-- Guest
INSERT INTO roles VALUES (4, 'uuid-4', 'guest', 'Ospite', true);
INSERT INTO role_permissions VALUES
  (NULL, 4, 'spedizioni.read'),
  (NULL, 4, 'report.read');
```

---

## Espansione Futura

### Aggiungere Nuovi Moduli

Quando il sistema cresce, aggiungere nuovi moduli è semplice:

```typescript
// Nuovo modulo: clienti
// Aggiungi permessi ai ruoli esistenti

// Admin ottiene accesso completo
INSERT INTO role_permissions VALUES (NULL, 2, 'clienti.*');

// Operatore ottiene accesso limitato
INSERT INTO role_permissions VALUES
  (NULL, 3, 'clienti.read'),
  (NULL, 3, 'clienti.create'),
  (NULL, 3, 'clienti.update');
```

### Aggiungere Nuove Azioni

```typescript
// Nuova azione: 'archive'
// Usala dove serve

router.post('/spedizioni/:id/archive',
  authenticate,
  requirePermission('spedizioni', 'archive')
);

// Aggiungi ai ruoli
INSERT INTO role_permissions VALUES (NULL, 2, 'spedizioni.archive');
```

### Creare Nuovi Ruoli

```typescript
// Ruolo custom: operatore_senior
INSERT INTO roles VALUES (5, 'uuid-5', 'operatore_senior', 'Operatore senior', false);
INSERT INTO role_permissions VALUES
  (NULL, 5, 'spedizioni.*'),
  (NULL, 5, 'report.*'),
  (NULL, 5, 'gestione.read'); // Può vedere (non modificare) gestione
```

### Permessi Temporanei (Futuro)

```typescript
// Estensione futura: permessi con scadenza
{
  permission: 'sistema.backup',
  expiresAt: '2025-12-31T23:59:59Z'
}
```

---

## Best Practices

### 1. Principio del Minimo Privilegio

Assegna sempre il minimo set di permessi necessario. Meglio aggiungere permessi dopo che toglierli.

### 2. Usa Wildcards con Cautela

`modulo.*` è comodo ma potente. Usalo solo quando l'utente deve davvero fare TUTTO su quel modulo.

### 3. Proteggi Azioni Critiche

`delete`, `approve`, accesso a `sistema` - richiedono sempre permessi espliciti.

### 4. Documenta Ruoli Custom

Se crei ruoli oltre ai 4 base, documenta il loro scopo e permessi.

### 5. Audit Log

Considera di loggare accessi negati per monitorare tentativi non autorizzati.

---

## Checklist Implementazione

- [ ] Creare tabelle `roles` e `role_permissions`
- [ ] Implementare `PermissionChecker` class
- [ ] Implementare middleware `requirePermission`
- [ ] Creare script seed per 4 ruoli base
- [ ] Aggiornare `AuthService` per caricare permissions
- [ ] Proteggere tutte le route con middleware appropriati
- [ ] Testare matrice permessi completa
- [ ] Documentare permessi richiesti per ogni endpoint

---

## Conclusione

Questo sistema di autorizzazione offre il **miglior equilibrio** tra:

- **Semplicità**: Permessi chiari e espliciti
- **Flessibilità**: Supporta qualsiasi workflow presente e futuro
- **Scalabilità**: Facilmente estendibile
- **Standard**: Pattern industriale consolidato

È progettato per durare e adattarsi alle esigenze del sistema EDG per anni.

---

**Documento creato per:** EDG Auth Service  
**Sistema:** RBAC con Permessi Composti e Wildcards  
**Versione:** 2.0 - Sistema Definitivo  
**Mantenere aggiornato:** Quando si aggiungono nuovi moduli, azioni o ruoli
