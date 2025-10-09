# Guida Script Seed Ruoli

## 📋 Cosa fa lo script

Lo script `roles.seed.ts` popola il database con i **4 ruoli base** del sistema RBAC:

| Ruolo         | Permessi                                                        | Descrizione                    |
| ------------- | --------------------------------------------------------------- | ------------------------------ |
| **root**      | `*`                                                             | Accesso completo (super admin) |
| **admin**     | `spedizioni.*`, `gestione.*`, `report.*`                        | Admin completo (no sistema)    |
| **operatore** | `spedizioni.*`, `report.read`, `report.create`, `report.export` | Operativo (no admin)           |
| **guest**     | `spedizioni.read`, `report.read`                                | Solo lettura                   |

## 🚀 Come usarlo

### 1. Prima volta (database vuoto)

```bash
# Assicurati che il database esista e sia sincronizzato
npm run db:sync

# Esegui lo script seed
npm run seed:roles
```

**Output atteso:**

```
🚀 Avvio script seed ruoli...
📊 Connessione al database...
🔄 Sincronizzazione database...
✅ Database sincronizzato

╔═══════════════════════════════════════════════════════════╗
║         SEED RUOLI BASE - EDG Auth Service                ║
╚═══════════════════════════════════════════════════════════╝

📝 Processando ruolo: root
   ✅ Creazione ruolo "root"...
   🔑 Configurazione permessi per "root"...
      → *
   ✅ Ruolo "root" configurato con 1 permessi

📝 Processando ruolo: admin
   ✅ Creazione ruolo "admin"...
   🔑 Configurazione permessi per "admin"...
      → spedizioni.*
      → gestione.*
      → report.*
   ✅ Ruolo "admin" configurato con 3 permessi

[... continua per operatore e guest ...]

╔═══════════════════════════════════════════════════════════╗
║              SEED COMPLETATO CON SUCCESSO                 ║
╚═══════════════════════════════════════════════════════════╝

📊 Verifica ruoli nel database:

┌─────────────┬──────────────────────────────────────────┬────────────┐
│ Ruolo       │ Descrizione                              │ Permessi   │
├─────────────┼──────────────────────────────────────────┼────────────┤
│ admin       │ Amministratore sistema - gestione com... │          3 │
│             │ ├─ spedizioni.*                          │            │
│             │ ├─ gestione.*                            │            │
│             │ └─ report.*                              │            │
├─────────────┼──────────────────────────────────────────┼────────────┤
│ guest       │ Ospite - accesso in sola lettura        │          2 │
│             │ ├─ spedizioni.read                       │            │
│             │ └─ report.read                           │            │
├─────────────┼──────────────────────────────────────────┼────────────┤
│ operatore   │ Operatore standard - gestione operati... │          4 │
│             │ ├─ spedizioni.*                          │            │
│             │ ├─ report.read                           │            │
│             │ ├─ report.create                         │            │
│             │ └─ report.export                         │            │
├─────────────┼──────────────────────────────────────────┼────────────┤
│ root        │ Accesso completo al sistema - super a... │          1 │
│             │ └─ *                                     │            │
└─────────────┴──────────────────────────────────────────┴────────────┘

✅ Totale ruoli: 4

✅ Connessione database chiusa
```

### 2. Aggiornamento permessi

Se modifichi i permessi dei ruoli in `roles.seed.ts`, puoi ri-eseguire lo script:

```bash
npm run seed:roles
```

**Comportamento:**

- ✅ **Idempotente** - può essere eseguito più volte
- ⚠️ Ruoli esistenti vengono **aggiornati** (non duplicati)
- 🔄 Permessi vengono **sovrascritti** con i nuovi valori
- 📌 UUID dei ruoli rimane lo stesso

### 3. Seed completo (futuro)

```bash
npm run seed:all
```

Attualmente esegue solo `seed:roles`, ma in futuro potrà includere:

- Seed account di test
- Seed dati demo
- Seed configurazioni

## 🔍 Verifica manuale

### Query SQL per verificare ruoli

```sql
-- Mostra tutti i ruoli
SELECT * FROM roles ORDER BY name;

-- Mostra ruoli con permessi
SELECT
  r.name,
  r.description,
  rp.permission
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.roleId
ORDER BY r.name, rp.permission;

-- Conta permessi per ruolo
SELECT
  r.name,
  COUNT(rp.id) as total_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.roleId
GROUP BY r.id, r.name
ORDER BY r.name;
```

## ⚠️ Note Importanti

### 1. Database deve esistere

Prima di eseguire il seed, assicurati che:

- ✅ Il database `edg_auth` (o il tuo) esista
- ✅ Le tabelle siano create (`npm run db:sync`)
- ✅ Le variabili ENV siano configurate

### 2. Permessi personalizzati

Se vuoi modificare i permessi, edita l'array `DEFAULT_ROLES` in `roles.seed.ts`:

```typescript
const DEFAULT_ROLES: RoleDefinition[] = [
  {
    name: 'operatore',
    description: 'Operatore standard',
    isSystem: true,
    permissions: [
      'spedizioni.*',
      'report.read',
      'report.create',
      'report.export',
      // 'gestione.read', // ✅ AGGIUNGI questo per dare accesso lettura gestione
    ],
  },
  // ... altri ruoli
];
```

Poi ri-esegui: `npm run seed:roles`

### 3. Ruoli custom

Per aggiungere nuovi ruoli, aggiungi alla lista `DEFAULT_ROLES`:

```typescript
{
  name: 'supervisore',
  description: 'Supervisore operativo',
  isSystem: false, // false = ruolo custom (non di sistema)
  permissions: [
    'spedizioni.*',
    'report.*',
    'gestione.read', // Può solo vedere gestione, non modificare
  ],
}
```

## 🧪 Testing dopo seed

Dopo aver eseguito il seed, puoi testare:

### 1. Registrazione account

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@edg.com",
    "password": "Admin123!@#",
    "accountType": "operatore",
    "entityId": "123e4567-e89b-12d3-a456-426614174000",
    "roleId": 2
  }'
```

**Nota:** `roleId: 2` corrisponde ad **admin** (il primo creato dopo root)

Per trovare i roleId:

```sql
SELECT id, name FROM roles ORDER BY name;
```

### 2. Login e test permessi

```bash
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@edg.com",
    "password": "Admin123!@#",
    "accountType": "operatore"
  }'

# Riceverai un accessToken - usalo per chiamate protette
# Il token contiene automaticamente il campo "permissions": [...]
```

## 📊 Matrice Permessi

Riferimento rapido di cosa ogni ruolo può fare:

```
Modulo          | read | create | update | delete | export |
----------------|------|--------|--------|--------|--------|
ROOT            |  ✅  |   ✅   |   ✅   |   ✅   |   ✅   | (*)
ADMIN           |      |        |        |        |        |
  spedizioni    |  ✅  |   ✅   |   ✅   |   ✅   |   ✅   |
  gestione      |  ✅  |   ✅   |   ✅   |   ✅   |   ✅   |
  report        |  ✅  |   ✅   |   ✅   |   ✅   |   ✅   |
  sistema       |  ❌  |   ❌   |   ❌   |   ❌   |   ❌   |
OPERATORE       |      |        |        |        |        |
  spedizioni    |  ✅  |   ✅   |   ✅   |   ✅   |   ✅   |
  gestione      |  ❌  |   ❌   |   ❌   |   ❌   |   ❌   |
  report        |  ✅  |   ✅   |   ❌   |   ❌   |   ✅   |
  sistema       |  ❌  |   ❌   |   ❌   |   ❌   |   ❌   |
GUEST           |      |        |        |        |        |
  spedizioni    |  ✅  |   ❌   |   ❌   |   ❌   |   ❌   |
  gestione      |  ❌  |   ❌   |   ❌   |   ❌   |   ❌   |
  report        |  ✅  |   ❌   |   ❌   |   ❌   |   ❌   |
  sistema       |  ❌  |   ❌   |   ❌   |   ❌   |   ❌   |
```

## 🔗 Prossimi passi

Dopo il seed:

1. ✅ Crea account di test con vari ruoli
2. ✅ Testa login e verifica che il JWT contenga `permissions`
3. ✅ Proteggi le route con `requirePermission(module, action)`
4. ✅ Testa accesso negato/consentito per vari ruoli

## 📚 Documentazione correlata

- **RBAC-SYSTEM.md** - Sistema completo di autorizzazione
- **PROJECT-STATUS.md** - Stato sviluppo progetto
- **README.md** - Setup generale progetto
