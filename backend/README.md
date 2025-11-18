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
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"avery@user.test","password":"password123"}'
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
**201** → `{ token, user }`

### POST /api/auth/login
Login to get a JWT.

**Body**
```json
{ "email": "avery@user.test", "password": "password123" }
```
**200** → `{ token, user }`

### GET /api/auth/me
Return the current user.

**200** → `User`

---

## Users

### GET /api/me
Fetch my profile.

### PATCH /api/me
Update profile fields (e.g., `name`).

```json
{ "name": "Avery A." }
```

### GET /api/me/preferences
Get my preferences (`location`, `categoryId`).

### PUT /api/me/preferences
Set my preferences.

```json
{ "location": "Calgary", "categoryId": 1 }
```

### GET /api/me/payment-methods
List saved cards (non-sensitive shape: `name`, `last4`, `expMonth`, `expYear`, `currency`, `primary`).

### POST /api/me/payment-methods
Save a verified card.

```json
{
  "accountId": "acct_123",
  "name": "Avery Attendee",
  "last4": "4242",
  "expMonth": 12,
  "expYear": 2030,
  "currency": "CAD",
  "primary": true
}
```

### DELETE /api/me/payment-methods/{paymentInfoId}
Remove a saved card I own.

---

## Categories

### GET /api/categories
List categories.

### GET /api/categories/{name}/events
Return events in a category by **category name** (e.g., `Tech`).

---

## Events

> **Organizer rules**
> * Only the organizer can update/delete their event.
> * **Cannot reduce** total ticket stock — only increase or add new ticket types.
> * Deleting an event triggers **refunds** for purchasers and **webhook notifications**.

### GET /api/events
List events (optional filters: `q`, `category`, `active`).

### POST /api/events
Create an event. Example:
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
**201** → `Event`

### GET /api/events/{eventId}
Get event details.

### PATCH /api/events/{eventId}
Update event fields or **increase** ticket stock. Attempting to lower `ticketsQuantity` is rejected.

```json
{
  "title": "Tech Meetup YYC (Updated)",
  "ticketTypes": [
    { "ticketType": "Regular", "ticketsQuantity": 90 },
    { "ticketType": "VIP",     "ticketPrice": 99, "ticketsQuantity": 10 }
  ]
}
```

### DELETE /api/events/{eventId}
Delete my event → refunds all related payments and sends notifications via webhook.

---

## Tickets

### GET /api/events/{eventId}/tickets
List ticket types for an event (name, price, `ticketsLeft`).

### GET /api/me/tickets
List my minted tickets (each has a unique **6‑digit** `code`).

---

## Cart

> Cart exists server-side per user-session. Adding requires the event to be ongoing and stock available.

### GET /api/cart
Return current cart.

### POST /api/cart/items
Add a ticket type to cart.
```json
{ "ticketInfoId": 42, "quantity": 2 }
```

### PATCH /api/cart/items/{ticketInfoId}
Update quantity (use `0` to remove).
```json
{ "quantity": 3 }
```

### DELETE /api/cart/items/{ticketInfoId}
Remove a ticket type from the cart.

### POST /api/cart/checkout
Checkout with either a **saved card** or a **new card**.

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
**200** → `{ payment, tickets: [ ... minted ... ] }`

---

## Payments

### POST /api/payments/verify-card
Verify a card with the external processor (no charge). Used for **new card** checkout or to pre-save a card.
```json
{ "number":"4111...", "name":"Avery", "ccv":"123", "expMonth":12, "expYear":2030 }
```
**200** → `{ valid: true, accountId: "acct_..." }`

### GET /api/payments/{paymentId}
Fetch payment details.

### POST /api/payments/{paymentId}/refund
Refund a payment (used by cancel flow; may also be exposed for admin/organizer tooling).

---

## Notifications

### GET /api/me/notifications
List my notifications.

### PATCH /api/me/notifications/{notificationId}/read
Mark as read.

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

