//Test setup file for Jest
//Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

//Mock database connection
jest.mock('../../config/db', () => ({
  knex: jest.fn(() => ({
    transaction: jest.fn((callback) => callback(mockTrx)),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue([1]),
    update: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
    first: jest.fn().mockResolvedValue(null),
    orderBy: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    raw: jest.fn((str) => str),
  })),
}));

//Mock transaction object
const mockTrx = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  insert: jest.fn().mockResolvedValue([1]),
  update: jest.fn().mockResolvedValue(1),
  del: jest.fn().mockResolvedValue(1),
  first: jest.fn().mockResolvedValue(null),
  orderBy: jest.fn().mockReturnThis(),
  join: jest.fn().mockReturnThis(),
  raw: jest.fn((str) => str),
};

//Global test helpers
global.mockTrx = mockTrx;

