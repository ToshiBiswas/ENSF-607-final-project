
/**
 * Shared Jest setup for backend/src services.
 * Import at the TOP of each test file:
 *   const setup = require('./test-setup');
 *
 * Exposes: SUT_BASE, AppError, mockKnex, helpers, repo mocks, CartService, fetchMock, beforeEachReset.
 */

jest.useFakeTimers().setSystemTime(new Date('2025-11-04T18:00:00Z'));

// ---------- Path base for SUT (services live under backend/src)
const SUT_BASE = process.env.SUT_BASE || '..'; // when tests are under src/__tests__, '..' points at src

// ---------- Minimal AppError used across services
class AppError extends Error {
  constructor(message, status = 400, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

// ---------- knex-like stubs
const qb = ({ firstRow = null, rows = [], updateResult = 1 } = {}) => {
  const self = {
    _where: null,
    where(obj) { this._where = obj; return this; },
    first: jest.fn(async () => firstRow),
    update: jest.fn(async () => updateResult),
    delete: jest.fn(async () => 1),
    insert: jest.fn(async () => 1),
    select: jest.fn(async () => rows),
  };
  return self;
};

const makeKnex = () => {
  const tableMap = new Map();
  const makeFunc = () => {
    const fn = (table) => {
      if (!tableMap.has(table)) tableMap.set(table, qb());
      return tableMap.get(table);
    };
    fn._tables = tableMap;
    fn.transaction = jest.fn(async (cb) => {
      const trx = makeKnex();
      trx._tables = new Map();
      return cb(trx);
    });
    fn.fn = { now: () => new Date() };
    return fn;
  };
  return makeFunc();
};

const mockKnex = makeKnex();

// ---------- Global fetch mock to simulate Square + webhooks
const fetchMock = jest.fn();
global.fetch = fetchMock;

function parseJSON(b) { try { return JSON.parse(b); } catch { return {}; } }
function mkRes(status, json) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return json; },
    async text() { return JSON.stringify(json); }
  };
}

// ---------- Mocks (must be defined before requiring SUTs)
jest.mock(`${SUT_BASE}/config/db`, () => {
  const k = mockKnex;
  return { knex: k, default: k };
});

jest.mock(`${SUT_BASE}/utils/errors`, () => ({ AppError }));

const signJwtMock = jest.fn((payload) => `jwt-for-${payload.userId}`);
jest.mock(`${SUT_BASE}/middleware/auth`, () => ({ signJwt: signJwtMock }));

const bcryptHashMock = jest.fn(async () => '$2b$hash');
const bcryptCompareMock = jest.fn(async () => true);
jest.mock('bcryptjs', () => ({
  hash: (...args) => bcryptHashMock(...args),
  compare: (...args) => bcryptCompareMock(...args)
}));

const NotificationRepo = { insert: jest.fn(async (row) => ({ notificationId: 101, ...row })) };
jest.mock(`${SUT_BASE}/repositories/NotificationRepo`, () => ({ NotificationRepo }));

const PaymentInfoRepo = {
  findByAccountId: jest.fn(async () => null),
  insert: jest.fn(async ({ userId, account }) => ({ paymentInfoId: 33, userId, accountId: account.id, owner: { userId } })),
  findById: jest.fn(async (id) => id === 33 ? ({ paymentInfoId: 33, accountId: 'acct_33', owner: { userId: 1 } }) : null)
};
jest.mock(`${SUT_BASE}/repositories/PaymentInfoRepo`, () => ({ PaymentInfoRepo }));

const PaymentRepo = {
  insert: jest.fn(async (_trx, row) => ({ paymentId: 9001, ...row })),
  findById: jest.fn(async (id) => id === 9001 ? ({ paymentId: 9001, providerPaymentId: 'prov_9001' }) : null),
  updateStatus: jest.fn(async () => 1),
  listApprovedForEvent: jest.fn(async (_eventId) => [
    { paymentId: 1001, amountCents: 5000, user: { userId: 1 } },
    { paymentId: 1002, amountCents: 7000, user: { userId: 2 } }
  ])
};
jest.mock(`${SUT_BASE}/repositories/PaymentRepo`, () => ({ PaymentRepo }));

const TicketInfoRepo = {
  findById: jest.fn(async (id) => id === 77 ? ({ infoId: 77, left: 10, price: 50 }) : null),
  lockAndLoad: jest.fn(async (_trx, infoId) => ({ row: { info_id: infoId, tickets_left: 10, event_id: 555, ticket_price: 50 } })),
  decrementLeft: jest.fn(async (_trx, _infoId, _qty) => 1)
};
jest.mock(`${SUT_BASE}/repositories/TicketInfoRepo`, () => ({ TicketInfoRepo }));

const EventRepo = {
  insert: jest.fn(async (row) => ({ eventId: 555, ...row })),
  findById: jest.fn(async (id) => {
    if (id !== 555) return null;
    return {
      eventId: 555,
      title: 'Launch',
      description: 'x',
      location: 'y',
      startTime: new Date(Date.now() - 3600e3),
      endTime: new Date(Date.now() + 3600e3),
      organizer: { userId: 42 },
      isActive() { const now = new Date(); return now >= this.startTime && now <= this.endTime; }
    };
  }),
  attachCategories: jest.fn(async () => 1),
  upsertTicketInfos: jest.fn(async () => 1),
  updateTicketsIncreaseOnly: jest.fn(async () => 1),
  findByCategoryValue: jest.fn(async () => []),
  deleteEvent: jest.fn(async () => 1)
};
jest.mock(`${SUT_BASE}/repositories/EventRepo`, () => ({ EventRepo }));

const CategoryRepo = { findOrCreate: jest.fn(async (v) => ({ categoryId: Math.abs(hashCode(v)) % 1000, value: v })) };
jest.mock(`${SUT_BASE}/repositories/CategoryRepo`, () => ({ CategoryRepo }));

const TicketMintRepo = { save: jest.fn(async (row) => ({ ticketId: Math.floor(Math.random() * 100000), ...row })) };
jest.mock(`${SUT_BASE}/repositories/TicketMintRepo`, () => ({ TicketMintRepo }));

const UserRepo = {
  updateProfile: jest.fn(async (_id, patch) => ({ userId: _id, ...patch })),
  findByEmail: jest.fn(async (email) => (email === 'exists@test' ? ({ userId: 99, email }) : null)),
  insert: jest.fn(async (row) => ({ userId: 123, role: 'user', ...row })),
  findById: jest.fn(async (id) => ({ userId: id, email: 'u@test', role: 'user' }))
};
jest.mock(`${SUT_BASE}/repositories/UserRepo`, () => ({ UserRepo }));

const UserPreferencesRepo = { upsert: jest.fn(async (userId, patch) => ({ userId, ...patch })) };
jest.mock(`${SUT_BASE}/repositories/UserPreferencesRepo`, () => ({ UserPreferencesRepo }));

let cartStore;
const CartService = {
  getCart: jest.fn((user) => {
    if (!cartStore) cartStore = new Map();
    let c = cartStore.get(user.userId);
    if (!c) {
      c = {
        owner: user,
        items: [],
        add(tinfo, qty) { this.items.push({ ticketInfo: { infoId: tinfo.infoId || 77 }, quantity: qty }); },
        clear() { this.items = []; }
      };
      cartStore.set(user.userId, c);
    }
    return c;
  }),
  clear: jest.fn((user) => {
    const c = CartService.getCart(user);
    c.clear();
    return c;
  })
};
jest.mock(`${SUT_BASE}/services/CartService`, () => ({ CartService }));

// ---------- Shared helpers
function hashCode(str) {
  let h = 0; for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; } return h;
}
async function expectAppError(promise, status, messageMatch) {
  try {
    await promise;
    throw new Error('Expected AppError');
  } catch (e) {
    expect(e).toBeInstanceOf(AppError);
    if (status) expect(e.status).toBe(status);
    if (messageMatch) expect(e.message).toMatch(messageMatch);
  }
}

// ---------- Reset for each test
function beforeEachReset() {
  jest.clearAllMocks();
  cartStore = null;

  process.env.PAYMENTS_BASE_URL = 'http://square.mock';
  delete process.env.NOTIFICATIONS_WEBHOOK_URL;

  fetchMock.mockImplementation(async (url, opts = {}) => {
    const u = new URL(typeof url === 'string' ? url : url.toString());
    if (u.pathname === '/v1/accounts/verify') {
      const number = u.searchParams.get('number');
      if (number === '4111111111111111') {
        return mkRes(200, { account: { id: 'acct_ok_1', brand: 'visa', last4: '1111' } });
      }
      return mkRes(402, { error: 'Verification failed', code: 'VERIFICATION_FAILED' });
    }
    if (u.pathname === '/v1/payments' && opts.method === 'POST') {
      const body = parseJSON(opts.body);
      if (body.amount_cents > 0) return mkRes(200, { payment_id: 'pay_ok_1', status: 'approved' });
      return mkRes(402, { error: 'Payment declined', code: 'DECLINED' });
    }
    if (u.pathname === '/v1/refunds' && opts.method === 'POST') {
      const body = parseJSON(opts.body);
      if (body.payment_id) return mkRes(200, { refund_id: 'rf_1', status: 'succeeded' });
      return mkRes(400, { error: 'Missing payment_id' });
    }
    if (u.hostname === 'webhook.receiver') return mkRes(200, { ok: true });
    return mkRes(404, { error: 'not found' });
  });
}

module.exports = {
  SUT_BASE,
  AppError,
  qb,
  makeKnex,
  mockKnex,
  mkRes,
  fetchMock,
  signJwtMock,
  bcryptHashMock,
  bcryptCompareMock,
  NotificationRepo,
  PaymentInfoRepo,
  PaymentRepo,
  TicketInfoRepo,
  EventRepo,
  CategoryRepo,
  TicketMintRepo,
  UserRepo,
  UserPreferencesRepo,
  CartService,
  expectAppError,
  beforeEachReset,
};
