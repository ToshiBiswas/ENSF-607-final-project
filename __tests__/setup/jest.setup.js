// Stable globals for all tests
process.env.PAYMENTS_BASE_URL = 'http://payments.test';
process.env.NOTIFICATIONS_WEBHOOK_URL = 'http://webhook.test';

global.fetch = jest.fn();

// quiet console noise in tests; re-enable per test if you want to assert
const realWarn = console.warn;
beforeAll(() => { console.warn = jest.fn(); });
afterAll(() => { console.warn = realWarn; });
    