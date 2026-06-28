# Full-Stack Ledger & Stock Management System

A complete full-stack web application to manage accounting ledgers and warehouse product stocks. Scopes all data by active company profile with real-time balance and stock calculations.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS v4, React Router DOM, Axios, React Icons, React Toastify, Recharts |
| Backend | Node.js, Express.js (ES6 Modules) |
| Database | MongoDB (Mongoose) |
| Architecture | MVC, REST API, CORS, Company Scope Middleware |

---

## Modules

1. **Dashboard** — Summary cards (Cash, Receivables, Payables, Inventory), Quick Actions, Charts, Recent Transactions
2. **Companies** — Multi-company management, active company switching (one place only)
3. **Accounts Ledger** — Customer, Supplier, Cash, Bank, Expense accounts with running balances
4. **Transactions** — Receipts (credits) and Payments (debits), columns: Account / Date / Payment Mode / Amount
5. **Inventory Products** — Product catalog, columns: Product Name / Stock Count only
6. **Stock Entry** — Stock In/Out logs, columns: Product Name / Movement Type / Quantity / Date
7. **Reports** — Summary, Ledger, Inventory tabs with date + account filters, PDF print, CSV export
8. **Settings** — App preferences, Backup (JSON download), Restore (JSON upload), Data Summary

---

## Prerequisites

- **Node.js** v18.0.0 or higher
- **MongoDB** running locally on `mongodb://localhost:27017`

---

## Quick Start

### 1. Install all dependencies

```bash
npm run install-all
```

### 2. Start development servers

```bash
npm run dev
```

This starts:
- Backend API: `http://localhost:5001`
- Frontend: `http://localhost:5173`

### 3. Open the app

Navigate to **http://localhost:5173**

The database auto-seeds with demo data for **Sri Lakshmi Traders** on first run — pre-populated accounts, products, transactions, and stock entries.

---

## API Endpoints

### Companies
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/companies` | List all companies |
| GET | `/api/companies/:id` | Get company by ID |
| POST | `/api/companies` | Create company (auto-creates Cash/Bank accounts + Settings) |
| PUT | `/api/companies/:id` | Update company |
| DELETE | `/api/companies/:id` | Cascade-delete company and all its data |

### Accounts `(x-company-id header required)`
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/accounts` | List accounts (filter: `type`, `search`) |
| GET | `/api/accounts/:id` | Account details + transaction history |
| POST | `/api/accounts` | Create account |
| PUT | `/api/accounts/:id` | Update account |
| DELETE | `/api/accounts/:id` | Delete account + its transactions |

### Transactions `(x-company-id header required)`
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/transactions` | List transactions (filter: `accountId`, `startDate`, `endDate`, `search`) |
| POST | `/api/transactions` | Create transaction (updates account + Cash/Bank balances) |
| PUT | `/api/transactions/:id` | Update transaction (rebalances) |
| DELETE | `/api/transactions/:id` | Delete transaction (rebalances) |

### Products `(x-company-id header required)`
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/products` | List products (filter: `search`, `category`) |
| GET | `/api/products/:id` | Product details + stock history |
| POST | `/api/products` | Create product (opening stock auto-creates Stock In) |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product + stock entries |

### Stock Entries `(x-company-id header required)`
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/stock-entries` | List entries (filter: `productId`, `type`) |
| POST | `/api/stock-entries` | Create entry (adjusts product quantity) |
| PUT | `/api/stock-entries/:id` | Update entry (recalculates stock) |
| DELETE | `/api/stock-entries/:id` | Delete entry (reverts stock) |

### Reports `(x-company-id header required)`
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/reports/dashboard` | Cash, Receivables, Payables, Inventory, recent transactions, chart data |
| GET | `/api/reports/summary` | Sales, Purchases, Receipts, Payments, Expenses, Net Profit |
| GET | `/api/reports/ledger` | Account-wise period balances |
| GET | `/api/reports/inventory` | Stock valuation + movement summary |

### Settings `(x-company-id header required)`
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/settings` | Get settings + data summary counts |
| PUT | `/api/settings` | Update settings |
| GET | `/api/settings/backup` | Download full JSON backup |
| POST | `/api/settings/restore` | Restore from JSON backup (overwrites all data) |

---

## Environment Variables

`backend/.env`:
```
PORT=5001
MONGO_URI=mongodb://localhost:27017/ledger_stock_db
```

---

## Project Structure

```
ledger-stock-management-system/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/dummyDataSeeder.js
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/    # Layout, Modals, ConfirmDialog, LoadingSpinner
│       ├── context/       # CompanyContext (active company state)
│       ├── pages/         # Dashboard, Companies, Accounts, Transactions, Products, StockEntry, Reports, Settings
│       └── services/api.js
├── package.json           # Root (concurrently scripts)
└── README.md
```
