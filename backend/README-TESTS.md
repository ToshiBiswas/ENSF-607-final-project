
# No-Mocks Integration Tests

These tests avoid `jest.mock` entirely. They exercise your real services and DB.

## How it works

- **Database**: Tests use your real `require('../config/db').knex`. Ensure a **test database** is reachable via your usual config/env (e.g., `NODE_ENV=test` or `DATABASE_URL`).
- **Square provider**: A tiny local HTTP server is started **inside each payment-related test**. We point the services to it with `process.env.PAYMENTS_BASE_URL`. No Jest mocking is used.

## Quick start

From the root of your **backend** project (where your `src/` folder lives):

```bash
# 1) Ensure your test DB is up (docker/mysql) and migrations are applied
# If you keep separate configs, set them now, e.g.:
set NODE_ENV=test   # (Windows PowerShell use: $env:NODE_ENV='test')

# 2) Copy the 'src/__tests__' folder and jest.config.js into your repo
#    OR place this entire pack adjacent to your src folder.

# 3) Run:
npx jest --runInBand --config ./jest.config.js
```

If your services expect specific env vars (like JWT secret), provide them the same way you do in dev.

## Notes

- Controllers are not tested here to keep things DB-focused and avoid asyncHandler or Express wiring issues.
- Repo tests are *shape* checks (no DB I/O) to confirm named exports exist without touching the database.
- Payment tests spin a real local HTTP server (not a Jest mock).

