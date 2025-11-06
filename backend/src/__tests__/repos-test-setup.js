
/**
 * Repo Test Setup for backend/src/repositories/*
 * - Mocks knex with per-table query builders
 * - Mocks domain classes to simple passthrough objects
 * - Provides helpers to seed qb rows and chainable insert for ON CONFLICT IGNORE
 */
jest.useFakeTimers().setSystemTime(new Date('2025-11-04T18:00:00Z'));

const SUT_BASE = process.env.SUT_BASE || '..';

// ---- Simple Domain stubs ----
function makeDomain(name) {
  return class {
    constructor(props) { return { __type: name, ...props }; }
  };
}

jest.mock(`${SUT_BASE}/domain/User`, () => ({ User: makeDomain('User') }));
jest.mock(`${SUT_BASE}/domain/Event`, () => ({ Event: makeDomain('Event') }));
jest.mock(`${SUT_BASE}/domain/Category`, () => ({ Category: makeDomain('Category') }));
jest.mock(`${SUT_BASE}/domain/TicketInfo`, () => ({ TicketInfo: makeDomain('TicketInfo') }));
jest.mock(`${SUT_BASE}/domain/Ticket`, () => ({ Ticket: makeDomain('Ticket') }));
jest.mock(`${SUT_BASE}/domain/Payment`, () => ({ Payment: makeDomain('Payment') }));
jest.mock(`${SUT_BASE}/domain/PaymentInfo`, () => ({ PaymentInfo: makeDomain('PaymentInfo') }));
jest.mock(`${SUT_BASE}/domain/Notification`, () => ({ Notification: makeDomain('Notification') }));

// ---- knex stub ----
const qb = ({ firstRow = null, rows = [], updateResult = 1, mode = 'array' } = {}) => {
  // mode: 'array' → insert resolves to [id]; 'chain' → insert returns chain with .onConflict().ignore()
  const self = {
    _where: null,
    _forUpdate: false,
    _firstRow: firstRow,
    _rows: rows,
    where(obj) { this._where = obj; return this; },
    first: jest.fn(async () => this._firstRow),
    select: jest.fn(async () => this._rows),
    forUpdate() { this._forUpdate = true; return this; },
    update: jest.fn(async () => updateResult),
    decrement: jest.fn(async () => 1),
    increment: jest.fn(async () => 1),
    del: jest.fn(async () => 1),
    insert: jest.fn((...args) => {
      if (mode === 'chain') {
        return {
          onConflict: jest.fn(() => ({
            ignore: jest.fn(async () => 1)
          }))
        };
      }
      return Promise.resolve([1]);
    }),
  };
  return self;
};

const makeKnex = () => {
  const tableMap = new Map();
  const fn = (table) => {
    if (!tableMap.has(table)) tableMap.set(table, qb());
    return tableMap.get(table);
  };
  fn._tables = tableMap;
  fn.fn = { now: () => new Date() };
  fn.schema = { hasTable: jest.fn(async () => false) };
  return fn;
};

const mockKnex = makeKnex();

jest.mock(`${SUT_BASE}/config/db`, () => {
  const k = mockKnex;
  return { knex: k, default: k };
});

// Helpers
function seedTable(table, options) {
  const builder = qb(options);
  mockKnex._tables.set(table, builder);
  return builder;
}
function seedChainInsertTable(table, options={}) {
  const builder = qb({ ...options, mode: 'chain' });
  mockKnex._tables.set(table, builder);
  return builder;
}

async function expectFields(obj, fields) {
  for (const [k, v] of Object.entries(fields)) {
    expect(obj[k]).toEqual(v);
  }
}

function beforeEachReset() {
  jest.clearAllMocks();
  mockKnex._tables.clear();
  mockKnex.schema.hasTable.mockResolvedValue(false);
}

module.exports = {
  SUT_BASE,
  mockKnex,
  qb,
  seedTable,
  seedChainInsertTable,
  expectFields,
  beforeEachReset,
};
