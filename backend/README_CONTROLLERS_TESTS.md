
# Controllers Tests (backend/src/controllers/*)

**Where to place**: `backend/src/__tests__/`

**Run from `backend/`:**
```bash
SUT_BASE=".." npx jest --runInBand --verbose
```

**Files**
- `controllers-test-setup.js` — mocks `utils/handler` (pass-through), all dependent services/repos, and provides `makeReq/makeRes`.
- `events.controller.test.js` — EventsController: listByCategory, create (201), get (200/404), update, remove (passes PaymentService), ticketTypes (200/404).
- `payments.controller.test.js` — PaymentsController: verifyCard (201), refund.
- `users.controller.test.js` — UsersController: me, updateProfile, setPreferences, paymentMethods.
- `auth.controller.test.js` — AuthController: register (201), login.
- `cart.controller.test.js` — CartController: add (201), view (total_cents), clear, checkout.

All tests are **unit-style** (no DB/seed). They assert status codes, payload shapes, and that controllers delegate to services with the correct parameters.
