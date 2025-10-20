# 🏦 Payment Processor Mock (TypeScript + Docker)

A minimal **Express + TypeScript** API that simulates a payment processor — complete with seeded accounts, card validation (Luhn check, expiry, CCV, cardholder match), and refund support.  
It’s containerized for easy local testing and simulation.

---

## 🚀 Quick Start

### 1️⃣ Build and run with Docker Compose

```bash
docker compose up --build
```

Then open your browser at:  
👉 **http://localhost:3001/v1/health**

This starts the mock server and mounts your `./seed` folder, so balances and ledger entries persist between restarts.

### 2️⃣ Stopping the container

```bash
docker compose down
```

---

## ⚙️ Endpoints

### ✅ Health check
`GET /v1/health` → `{ "ok": true }`

### 👤 Inspect an account
`GET /v1/accounts/:id`  
Returns account info with masked card number.

Example:
```bash
curl http://localhost:3001/v1/accounts/acct_1000
```

### 💳 Create payment
`POST /v1/payments`

Request body:
```json
{
  "accountId": "acct_1000",
  "amount": 1299,
  "currency": "CAD",
  "description": "Mocha purchase",
  "firstName": "Alex",
  "lastName": "Smith",
  "card": {
    "number": "4429873876049417",
    "ccv": "127",
    "expMonth": 11,
    "expYear": 2026
  }
}
```

Headers (optional):  
`Idempotency-Key: any-unique-string`

Response (201 Created):
```json
{
  "id": "pay_xxx",
  "status": "succeeded",
  "amount": 1299,
  "currency": "CAD",
  "accountId": "acct_1000"
}
```

### ↩️ Create refund
`POST /v1/refunds`
```json
{
  "paymentId": "pay_xxx",
  "amount": 500,
  "reason": "Customer changed mind"
}
```

If `amount` is omitted, the mock refunds the remaining refundable balance.

### 📜 View ledger
`GET /v1/ledger`  
Shows all payments and refunds.

---

## 🧠 Validation Rules

The payment mock enforces:
- ✅ Luhn-valid card number  
- ✅ Cardholder `firstName` and `lastName` match the account  
- ✅ Card not expired (`expMonth`, `expYear`)  
- ✅ CCV matches stored account  
- ✅ Currency matches account currency  
- ✅ Idempotency-Key prevents duplicate charges  

---

## 🧰 Developer Mode (optional)

If you want to run locally without Docker:

```bash
npm i
npm run dev
```

Then visit:
```
http://localhost:3001/v1/health
```

---

## 📂 Project Structure

```
src/
  ├── server.ts           # Express setup
  ├── db.ts               # JSON persistence
  ├── services/ledger.ts  # Payment/refund logic + validations
  ├── validators.ts       # Zod schemas for input validation
  ├── types.ts            # Shared type definitions
seed/
  ├── accounts.json       # 20 seeded accounts with cards
  ├── ledger.json         # Transactions log
  └── idempotency.json    # For replay-safe requests
```
