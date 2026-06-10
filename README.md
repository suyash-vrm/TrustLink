# TrustLink

TrustLink is now a fullstack distributor-retailer trust ledger.

## Project Structure

- `frontend/` - React + Vite user interface
- `backend/` - Node.js API server
- `backend/data/db.json` - local JSON database for users, transactions, and partner requests

## Features

- Authentication with login and signup
- Role-based accounts for distributors and retailers
- Retailers discover distributors; distributors discover retailers
- Transaction ledger with confirmation and payment marking
- Partner connection requests
- Rule-based trust score and suggested credit limit
- Location fields with Google Maps search and route links

## Demo Login

- Distributor: `ramesh@trustlink.demo` / `demo123`
- Retailer: `suresh@trustlink.demo` / `demo123`

## Run Locally

Open two terminals in `C:\Users\ASUS\Documents\New project`.

Terminal 1:

```powershell
npm.cmd run dev:backend
```

Terminal 2:

```powershell
npm.cmd run dev:frontend
```

Then open:

```text
http://127.0.0.1:5173/
```

Do not use `http://127.0.0.1:4173/` for development anymore. That was the old static demo server.

## Data Storage

User accounts and login-related business data are stored in:

```text
backend/data/db.json
```

Passwords are stored as PBKDF2 hashes, not plain text.

## Scoring Model

- 42% payment timeliness
- 28% mutual transaction confirmation
- 18% clean dispute record
- 12% transaction depth
- Overdue unpaid entries apply a penalty
