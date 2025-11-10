
# Split Jest Test Suite (backend/src)

Place this folder under: `backend/src/__tests__`

Run from `backend/`:
```bash
SUT_BASE=".." npx jest --runInBand --verbose
```

Files:
- `test-setup.js` — shared mocks, helpers, and environment
- `auth.test.js` — AuthService
- `users.test.js` — UserService
- `notifications_webhook.test.js` — NotificationService + WebhookService
- `payments.test.js` — PaymentService (Square mock) — only VERIFIED payment flows
- `ticketing_cart.test.js` — TicketingService + CartService (no org features)
- `events.test.js` — EventService (create, update increase-only, delete with refunds)

Notes:
- No assumptions about DB seeds. All repos/DB are mocked.
- Results group with headings like `● Auth: ...`, matching your preferred output style.
- Only verified payment methods are tested; unverified flows are not executed.
```
