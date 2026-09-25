# Guide de démarrage rapide — MatériauxPro

## Prérequis

- Node.js 20+
- pnpm 9+
- Docker Desktop (pour PostgreSQL)

## 1. Démarrer la base de données

```bash
# Depuis la racine du projet
docker compose up -d postgres
```

## 2. Configurer les variables d'environnement

```bash
# Les fichiers .env de développement sont déjà créés
# Pour la production, copiez les .env.example et modifiez les valeurs
```

## 3. Appliquer la migration et seeder les données

```bash
cd apps/api

# Appliquer la migration initiale
pnpm db:migrate

# Charger les données de démonstration
pnpm db:seed
```

## 4. Lancer le projet en développement

```bash
# Depuis la racine — lance API + Web en parallèle
pnpm dev
```

- API  : http://localhost:3001
- Web  : http://localhost:5173
- pgAdmin : http://localhost:5050 (avec `docker compose --profile tools up`)

## Comptes de démonstration (après seed)

| Rôle         | Email                    | Mot de passe    |
|--------------|--------------------------|-----------------|
| Super Admin  | admin@materiaux.pro      | Admin@1234      |
| Propriétaire | proprietaire@demo.pro    | Owner@1234      |
| Caissier     | caissier@demo.pro        | Caissier@1234   |

## Structure des routes API

```
GET    /health

POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
PATCH  /api/v1/auth/change-password

GET    /api/v1/stores
POST   /api/v1/stores
GET    /api/v1/stores/:id
PATCH  /api/v1/stores/:id

GET    /api/v1/products
GET    /api/v1/products/search?q=&storeId=
POST   /api/v1/products
GET    /api/v1/products/:id
PATCH  /api/v1/products/:id

GET    /api/v1/stock/entries?storeId=
GET    /api/v1/stock/alerts?storeId=
GET    /api/v1/stock/movements
POST   /api/v1/stock/adjustment
GET    /api/v1/stock/transfers
POST   /api/v1/stock/transfers
PATCH  /api/v1/stock/transfers/:id/validate
PATCH  /api/v1/stock/transfers/:id/cancel

GET    /api/v1/sales
POST   /api/v1/sales
GET    /api/v1/sales/:id
GET    /api/v1/sales/:id/receipt
POST   /api/v1/sales/:id/return

GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id
PATCH  /api/v1/customers/:id
GET    /api/v1/customers/:id/sales
POST   /api/v1/customers/:id/payments
GET    /api/v1/customers/:id/payments

GET    /api/v1/suppliers
POST   /api/v1/suppliers
GET    /api/v1/suppliers/orders
POST   /api/v1/suppliers/orders
GET    /api/v1/suppliers/orders/:orderId
PATCH  /api/v1/suppliers/orders/:orderId/send
PATCH  /api/v1/suppliers/orders/:orderId/receive
PATCH  /api/v1/suppliers/orders/:orderId/cancel

GET    /api/v1/dashboard/kpis?storeId=
GET    /api/v1/dashboard/sales-chart?period=7d|30d|12m&storeId=
GET    /api/v1/dashboard/top-products?storeId=
GET    /api/v1/dashboard/alerts?storeId=

GET    /api/v1/reports/sales?storeId=&from=&to=&groupBy=day|week|month
GET    /api/v1/reports/stock?storeId=
GET    /api/v1/reports/treasury?storeId=&from=&to=
GET    /api/v1/reports/customers-debt

# Super Admin uniquement
GET    /api/v1/tenants
POST   /api/v1/tenants
GET    /api/v1/tenants/:id
PATCH  /api/v1/tenants/:id
PATCH  /api/v1/tenants/:id/suspend
PATCH  /api/v1/tenants/:id/activate
DELETE /api/v1/tenants/:id
```
