
# Mock Payments API (TypeScript + Docker)

Functions you asked for:
1) **GET** `/v1/accounts/verify` — returns `account.id` and **non-secure info** if `number + name + ccv + exp` are correct.
2) **POST** `/v1/payments` — **no card details**; send `{ account_id, ccv, amount_cents, currency }` to create a mock payment. Simple idempotency supported via `idempotency_key`.

> Warning: GET with sensitive fields is for **mock/demo only**. In production you’d use POST + TLS.

## Run (Docker)
```bash
cp .env.example .env
docker compose up --build -d
curl http://localhost:8080/v1/health
```

## Verify (GET)
```
GET /v1/accounts/verify?number=4000...&name=Avery%20Patel&ccv=123&exp_month=12&exp_year=2028
```
Response:
```json
{
  "account": {
    "id": "acct_001",
    "last4": "1234",
    "name": "Avery Patel",
    "exp_month": 12,
    "exp_year": 2028,
    "currency": "CAD"
  }
}
```

## Payment (POST)
```bash
curl -X POST http://localhost:8080/v1/payments   -H "Content-Type: application/json"   -d '{
    "account_id": "acct_001",
    "ccv": "123",
    "amount_cents": 2599,
    "currency": "CAD",
    "idempotency_key": "order-123"
  }'
```
Success returns a payment object; insufficient funds returns `402` with `DECLINED` and error.

## Dev
```bash
npm i
npm run dev
# or
npm run build && npm start
```



## Refund (POST)
`POST /v1/refunds`
```bash
curl -X POST http://localhost:8080/v1/refunds \  -H "Content-Type: application/json" \  -d '{
    "payment_id": "pay_...",
    "amount_cents": 1000,
    "idempotency_key": "refund-123"
  }'
```
- Refunds only **approved** payments.
- Supports **partial refunds**; rejects if amount exceeds remaining refundable.
- Credits the account balance back and tracks `payment.refunded_cents`.
