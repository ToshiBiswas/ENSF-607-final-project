# Event Planner API — Documentation (v0.1)

This doc summarizes the REST endpoints implemented so far for the **Event Planner** backend (Knex.js + MVC/OOP). It reflects the migrations and services we built together: users, events, categories, ticket types, carts, payments, and webhook-based notifications.

> **Auth**: JWT Bearer. Send `Authorization: Bearer <token>` on all protected routes.
>
> **Base URL**: `http://localhost:3000`

---

## Quick Start

1. **Migrate & Seed**
   ```bash
   npx knex migrate:latest
   # choose one of the seeds (see earlier messages)
   npx knex seed:run --specific=000_test_seed_vm.js
   ```
2. **Login** (seeded user):
   ```bash
   curl -X POST http://localhost:3000/api/auth/login      -H "Content-Type: application/json"      -d '{"email":"avery@user.test","password":"password123"}'
   ```
3. **Use token** for subsequent requests.

---

## Auth

### POST /api/auth/register
Register a new account.

**Body**
```json
{ "name": "Avery", "email": "avery@example.com", "password": "password123" }
```
**Example Response — 201**
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "userId": 101,
    "name": "Avery",
    "email": "avery@example.com",
    "role": "user",
    "createdAt": "2025-11-04T18:02:00.000Z"
  }
}
```

### POST /api/auth/login
Login to get a JWT.

**Body**
```json
{ "email": "avery@user.test", "password": "password123" }
```
**Example Response — 200**
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "userId": 5,
    "name": "Avery",
    "email": "avery@user.test",
    "role": "user"
  }
}
```

### GET /api/auth/me
Return the current user.

**Example Response — 200**
```json
{
  "user": {
    "userId": 5,
    "name": "Avery",
    "email": "avery@user.test",
    "role": "user"
  }
}
```

---

## Users

### GET /api/me
Fetch my profile.

**Example Response — 200**
```json
{
  "user": {
    "userId": 5,
    "name": "Avery",
    "email": "avery@user.test",
    "role": "user"
  }
}
```

### PATCH /api/me
Update profile fields (e.g., `name`).

**Body**
```json
{ "name": "Avery A." }
```
**Example Response — 200**
```json
{
  "user": {
    "userId": 5,
    "name": "Avery A.",
    "email": "avery@user.test",
    "role": "user"
  }
}
```

### GET /api/me/preferences
Get my preferences (`location`, `categoryId`).

**Example Response — 200**
```json
{ "preferences": { "location": "Calgary", "categoryId": 1 } }
```

### PUT /api/me/preferences
Set my preferences.

**Body**
```json
{ "location": "Calgary", "categoryId": 1 }
```
**Example Response — 200**
```json
{ "preferences": { "userId": 5, "location": "Calgary", "categoryId": 1 } }
```

### GET /api/me/payment-methods
List saved cards (non-sensitive shape).

**Example Response — 200**
```json
{
  "paymentMethods": [
    {
      "paymentInfoId": 10,
      "name": "Avery Attendee",
      "last4": "1111",
      "expMonth": 12,
      "expYear": 2030,
      "currency": "CAD",
      "primary": true
    }
  ]
}
```

### POST /api/me/payment-methods
Save a verified card (already verified with `/payments/verify-card`).

**Body**
```json
{
  "accountId": "acct_123",
  "name": "Avery Attendee",
  "last4": "1111",
  "expMonth": 12,
  "expYear": 2030,
  "currency": "CAD",
  "primary": true
}
```
**Example Response — 201**
```json
{
  "paymentMethod": {
    "paymentInfoId": 10,
    "accountId": "acct_123",
    "name": "Avery Attendee",
    "last4": "1111",
    "expMonth": 12,
    "expYear": 2030,
    "currency": "CAD",
    "primary": true
  }
}
```

### DELETE /api/me/payment-methods/{paymentInfoId}
Remove a saved card I own.

**Example Response — 200**
```json
{ "deleted": true }
```

---

## Categories

### GET /api/categories
List categories.

**Example Response — 200**
```json
{
  "categories": [
    { "categoryId": 1, "value": "Tech" },
    { "categoryId": 2, "value": "Music" },
    { "categoryId": 3, "value": "Comedy" }
  ]
}
```

### GET /api/categories/{name}/events
Return events in a category by **category name** (e.g., `Tech`).

**Example Response — 200**
```json
{
  "events": [
    {
      "eventId": 101,
      "title": "Tech Meetup YYC",
      "location": "Innovation Hub",
      "startTime": "2025-10-23T01:00:00Z",
      "endTime": "2025-10-23T04:00:00Z"
    }
  ]
}
```

---

## Events

> **Organizer rules**
> * Only the organizer can update/delete their event.
> * **Cannot reduce** total ticket stock — only increase or add new ticket types.
> * Deleting an event triggers **refunds** for purchasers and **webhook notifications**.

### GET /api/events
List events (optional filters: `q`, `category`, `active`).

**Example Response — 200**
```json
{
  "events": [
    {
      "eventId": 101,
      "title": "Tech Meetup YYC",
      "description": "Talks + demos",
      "location": "Innovation Hub",
      "startTime": "2025-10-23T01:00:00Z",
      "endTime": "2025-10-23T04:00:00Z",
      "categories": ["Tech"]
    }
  ]
}
```

### POST /api/events
Create an event.

**Body**
```json
{
  "title": "Tech Meetup YYC",
  "description": "Talks + demos",
  "location": "Innovation Hub",
  "startTime": "2025-10-23T01:00:00Z",
  "endTime": "2025-10-23T04:00:00Z",
  "categories": ["Tech"],
  "ticketTypes": [
    { "ticketType": "Early Bird", "ticketPrice": 10, "ticketsQuantity": 30 },
    { "ticketType": "Regular",    "ticketPrice": 20, "ticketsQuantity": 70 }
  ]
}
```
**Example Response — 201**
```json
{
  "event": {
    "eventId": 101,
    "title": "Tech Meetup YYC",
    "description": "Talks + demos",
    "location": "Innovation Hub",
    "startTime": "2025-10-23T01:00:00Z",
    "endTime": "2025-10-23T04:00:00Z",
    "categories": ["Tech"],
    "tickets": [
      { "infoId": 1, "ticketType": "Early Bird", "ticketPrice": 10, "ticketsLeft": 30 },
      { "infoId": 2, "ticketType": "Regular",    "ticketPrice": 20, "ticketsLeft": 70 }
    ]
  }
}
```

### GET /api/events/{eventId}
Get event details.

**Example Response — 200**
```json
{
  "event": {
    "eventId": 101,
    "title": "Tech Meetup YYC",
    "description": "Talks + demos",
    "location": "Innovation Hub",
    "startTime": "2025-10-23T01:00:00Z",
    "endTime": "2025-10-23T04:00:00Z",
    "categories": ["Tech"],
    "tickets": [
      { "infoId": 1, "ticketType": "Early Bird", "ticketPrice": 10, "ticketsLeft": 30 },
      { "infoId": 2, "ticketType": "Regular",    "ticketPrice": 20, "ticketsLeft": 70 }
    ]
  }
}
```

### PATCH /api/events/{eventId}
Update event fields or **increase** ticket stock (attempting to lower `ticketsQuantity` is rejected).

**Body**
```json
{
  "title": "Tech Meetup YYC (Updated)",
  "ticketTypes": [
    { "ticketType": "Regular", "ticketsQuantity": 90 },
    { "ticketType": "VIP",     "ticketPrice": 99, "ticketsQuantity": 10 }
  ]
}
```
**Example Response — 200**
```json
{
  "event": {
    "eventId": 101,
    "title": "Tech Meetup YYC (Updated)",
    "description": "Talks + demos",
    "location": "Innovation Hub",
    "startTime": "2025-10-23T01:00:00Z",
    "endTime": "2025-10-23T04:00:00Z",
    "categories": ["Tech"],
    "tickets": [
      { "infoId": 2, "ticketType": "Regular", "ticketPrice": 20, "ticketsLeft": 90 },
      { "infoId": 3, "ticketType": "VIP",     "ticketPrice": 99, "ticketsLeft": 10 }
    ]
  }
}
```

### DELETE /api/events/{eventId}
Delete my event → refunds all related payments and sends notifications via webhook.

**Example Response — 200**
```json
{ "deleted": true }
```

---

## Tickets

### GET /api/events/{eventId}/tickets
List ticket types for an event (name, price, `ticketsLeft`).

**Example Response — 200**
```json
{
  "ticketTypes": [
    { "infoId": 1, "ticketType": "Early Bird", "ticketPrice": 10, "ticketsLeft": 30 },
    { "infoId": 2, "ticketType": "Regular",    "ticketPrice": 20, "ticketsLeft": 70 }
  ]
}
```

### GET /api/me/tickets
List my minted tickets (each has a unique **6‑digit** `code`).

**Example Response — 200**
```json
{
  "tickets": [
    {
      "ticketId": 5001,
      "code": "842913",
      "eventId": 101,
      "infoId": 2,
      "ownerId": 5
    }
  ]
}
```

---

## Cart

> Cart exists server-side per user-session. Adding requires the event to be ongoing and stock available.

### GET /api/cart
Return current cart.

**Example Response — 200**
```json
{
  "cart": {
    "items": [
      { "infoId": 2, "ticketType": "Regular", "ticketPrice": 20, "quantity": 2 }
    ]
  },
  "total_cents": 4000
}
```

### POST /api/cart/items
Add a ticket type to cart.

**Body**
```json
{ "ticketInfoId": 42, "quantity": 2 }
```
**Example Response — 201**
```json
{
  "cart": {
    "items": [
      { "infoId": 42, "quantity": 2 }
    ]
  }
}
```

### PATCH /api/cart/items/{ticketInfoId}
Update quantity (use `0` to remove).

**Body**
```json
{ "quantity": 3 }
```
**Example Response — 200**
```json
{
  "cart": {
    "items": [
      { "infoId": 42, "quantity": 3 }
    ]
  }
}
```

### DELETE /api/cart/items/{ticketInfoId}
Remove a ticket type from the cart.

**Example Response — 200**
```json
{
  "cart": {
    "items": []
  }
}
```

### POST /api/cart/checkout
Checkout with either a **saved card** or a **new verified card**.

**Saved card**
```json
{ "paymentInfoId": 10 }
```

**New card** (verified before charge via payment processor)
```json
{
  "card": { "number":"4111111111111111", "name":"Avery", "ccv":"123", "expMonth":12, "expYear":2030 },
  "saveCard": true
}
```
**Example Response — 200**
```json
{
  "payment": {
    "paymentId": 9001,
    "status": "approved",
    "amountCents": 4000,
    "currency": "CAD"
  },
  "tickets": [
    { "ticketId": 6001, "code": "123456", "eventId": 101, "infoId": 2, "ownerId": 5 },
    { "ticketId": 6002, "code": "654321", "eventId": 101, "infoId": 2, "ownerId": 5 }
  ]
}
```

---

## Payments

### POST /api/payments/verify-card
Verify a card with the external processor (no charge). Used for **new card** checkout or to pre-save a card.

**Body**
```json
{ "number":"4111111111111111", "name":"Avery", "ccv":"123", "expMonth":12, "expYear":2030 }
```
**Example Response — 201**
```json
{ "paymentMethod": { "paymentInfoId": 33, "accountId": "acct_123", "last4": "1111", "expMonth": 12, "expYear": 2030 } }
```

### GET /api/payments/{paymentId}
Fetch payment details.

**Example Response — 200**
```json
{
  "payment": {
    "paymentId": 9001,
    "userId": 5,
    "eventId": 101,
    "ticketInfoId": 2,
    "amountCents": 4000,
    "currency": "CAD",
    "status": "approved"
  }
}
```

### POST /api/payments/{paymentId}/refund
Refund a payment (used by cancel flow; may also be exposed for admin/organizer tooling).

**Body**
```json
{ "amount_cents": 4000 }
```
**Example Response — 200**
```json
{ "refunded": true }
```

---

## Notifications

### GET /api/me/notifications
List my notifications.

**Example Response — 200**
```json
{
  "notifications": [
    {
      "notificationId": 7001,
      "type": "payment_approved",
      "message": "Payment approved for Tech Meetup YYC",
      "eventId": 101,
      "paymentId": 9001,
      "readAt": null,
      "createdAt": "2025-10-22T20:22:10.000Z"
    }
  ]
}
```

### PATCH /api/me/notifications/{notificationId}/read
Mark as read.

**Example Response — 200**
```json
{ "notification": { "notificationId": 7001, "readAt": "2025-10-22T20:25:40.000Z" } }
```

> **Dispatch**: Notifications are **sent as webhooks** to your configured endpoint(s) when events are canceled or payments succeed/fail/refund. Delivery attempts are POST requests with JSON payloads.

**Example webhook payload** (event canceled):
```json
{
  "type": "event_canceled",
  "userId": 5,
  "eventId": 101,
  "message": "Event 'Tech Meetup YYC' was canceled. A refund has been issued.",
  "sentAt": "2025-10-22T20:22:10.000Z"
}
```

**Configure**:
- `NOTIFY_WEBHOOK_URL` — primary target URL
- (optional) `NOTIFY_WEBHOOK_SECRET` — HMAC signature header (e.g., `X-Webhook-Signature`)

---

## Error Format
All errors follow a consistent shape:
```json
{
  "error": { "code": "string", "message": "human readable", "details": {"field": "why"} }
}
```

**Common codes**: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `PAYMENT_FAILED`, `OUT_OF_STOCK`, `EVENT_EXPIRED`.

**Example Error — 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "Not found" } }
```

---

## Business Rules
- **Ticketing**: cannot add to cart or buy if the event has ended or not yet started (configurable as ongoing window).
- **Stock**: `ticketsLeft` must be ≥ requested quantity. On success, decremented atomically.
- **Minting**: each purchased ticket gets a **unique 6‑digit** `code`.
- **Event updates**: organizers may **increase** total stock but not reduce (service enforces monotonicity).
- **Event deletion**: refunds all payments for that event, then sends notifications via webhook.
- **Cards**: saving requires verification; saved records store **non-sensitive** fields only (`last4`, expiry, name, currency, provider `accountId`).

---

## Security
- JWT signed with `JWT_SECRET`.
- Bearer token required for all non-public endpoints.
- Webhook security: (optional) HMAC signature.

---

## OpenAPI (Machine‑Readable)
A complete OpenAPI 3.1 spec is available here:

**event-planner-openapi.yaml** — download and import into Postman or Swagger UI.

---

## Environment
- `PORT` — HTTP port (default `3000`)
- `DATABASE_URL` or `DB_*` — Knex connection settings
- `JWT_SECRET` — JWT signing secret
- `PAYMENT_API_BASE_URL` — external payment processor base URL
- `NOTIFY_WEBHOOK_URL` — where to deliver notifications
- `NOTIFY_WEBHOOK_SECRET` — (optional) HMAC secret for signatures

---

## Notes
- Our seed (`000_test_seed_vm.js`) supports TypeScript `accounts.ts` (default/named exports, comments, `as const`).
- If your `users.role` enum doesn’t include `organizer`, either add it via migration or keep seed roles as `user`.
- If migrations have mismatched historical names, use the provided shim set or reset your DB.