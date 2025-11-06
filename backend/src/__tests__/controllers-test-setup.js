
/**
 * Controllers Test Setup
 * - Mocks asyncHandler to identity (so handlers run directly)
 * - Mocks services/repos used by controllers
 * - Provides req/res builders
 */
jest.useFakeTimers().setSystemTime(new Date('2025-11-04T18:00:00Z'));

const SUT_BASE = process.env.SUT_BASE || '..';

// asyncHandler passthrough
jest.mock(`${SUT_BASE}/utils/handler`, () => (fn) => fn);

// ---- Service & Repo Mocks (exported so tests can assert calls) ----
const EventService = { listByCategory: jest.fn(), createEvent: jest.fn(), updateEvent: jest.fn(), deleteEvent: jest.fn() };
jest.mock(`${SUT_BASE}/services/EventService`, () => ({ EventService }));

const EventRepo = { findById: jest.fn() };
jest.mock(`${SUT_BASE}/repositories/EventRepo`, () => ({ EventRepo }));

const PaymentService = { verifyAndStore: jest.fn(), refund: jest.fn() };
jest.mock(`${SUT_BASE}/services/PaymentService`, () => ({ PaymentService }));

const UserService = { updateProfile: jest.fn(), setPreferences: jest.fn() };
jest.mock(`${SUT_BASE}/services/UserService`, () => ({ UserService }));

const PaymentInfoRepo = { listForUser: jest.fn() };
jest.mock(`${SUT_BASE}/repositories/PaymentInfoRepo`, () => ({ PaymentInfoRepo }));

const UserRepo = { findById: jest.fn() };
jest.mock(`${SUT_BASE}/repositories/UserRepo`, () => ({ UserRepo }));

const CartService = { getCart: jest.fn(), clear: jest.fn() };
jest.mock(`${SUT_BASE}/services/CartService`, () => ({ CartService }));

const TicketingService = { addToCart: jest.fn(), checkout: jest.fn() };
jest.mock(`${SUT_BASE}/services/TicketingService`, () => ({ TicketingService }));

const AuthService = { register: jest.fn(), login: jest.fn() };
jest.mock(`${SUT_BASE}/services/AuthService`, () => ({ AuthService }));

// ---- helpers ----
function makeReq({ userId = 1, params = {}, query = {}, body = {} } = {}) {
  return { user: { userId }, params, query, body };
}
function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined,
    status: jest.fn(function (code) { this.statusCode = code; return this; }),
    json: jest.fn(function (payload) { this.body = payload; return this; }),
  };
  return res;
}
function beforeEachReset() {
  jest.clearAllMocks();
}

module.exports = {
  SUT_BASE,
  EventService,
  EventRepo,
  PaymentService,
  UserService,
  PaymentInfoRepo,
  UserRepo,
  CartService,
  TicketingService,
  AuthService,
  makeReq,
  makeRes,
  beforeEachReset,
};
