const { AppError } = require('../../utils/errors');

jest.mock('bcryptjs', () => ({ hash: jest.fn(), compare: jest.fn() }));
jest.mock('../../repositories/UserRepo', () => ({
  UserRepo: {
    findByEmail: jest.fn(),
    insert: jest.fn(),
    findById: jest.fn()
  }
}));
jest.mock('../../middleware/auth', () => ({ signJwt: jest.fn(() => 'jwt-token') }));

jest.mock('../../config/db', () => {
  const state = { rows: {} };
  const knex = (table) => ({
    where: () => ({ first: async () => state.rows[table] || null })
  });
  return { knex, __setRow: (t, r) => (state.rows[t] = r) };
});

const bcrypt = require('bcryptjs');
const { signJwt } = require('../../middleware/auth');
const { UserRepo } = require('../../repositories/UserRepo');
const { __setRow } = require('../../config/db');
const { AuthService } = require('../../services/AuthService');

describe('register', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects when email already exists', async () => {
    UserRepo.findByEmail.mockResolvedValue({ userId: 1 });
    await expect(AuthService.register({ name:'A', email:'a@a', password:'p' }))
      .rejects.toMatchObject({ status: 409 });
  });

  test('hashes password, inserts user, signs JWT', async () => {
    UserRepo.findByEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('HASH');
    UserRepo.insert.mockResolvedValue({ userId: 2, email:'b@b', role:'user' });

    const out = await AuthService.register({ name:'B', email:'b@b', password:'p' });
    expect(bcrypt.hash).toHaveBeenCalled();
    expect(UserRepo.insert).toHaveBeenCalledWith({ name:'B', email:'b@b', passwordHash:'HASH' });
    expect(out.token).toBe('jwt-token');
  });
});

describe('login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects when user not found', async () => {
    UserRepo.findByEmail.mockResolvedValue(null);
    await expect(AuthService.login({ email:'x', password:'p' })).rejects.toMatchObject({ status: 401 });
  });

  test('rejects for invalid credentials', async () => {
    UserRepo.findByEmail.mockResolvedValue({ userId: 9 });
    __setRow('users', { email:'x', user_id:9, password_hash:'H', role:'user' });
    bcrypt.compare.mockResolvedValue(false);
    await expect(AuthService.login({ email:'x', password:'bad' })).rejects.toMatchObject({ status: 401 });
  });

  test('issues token and returns domain user on success', async () => {
    UserRepo.findByEmail.mockResolvedValue({ userId: 9 });
    __setRow('users', { email:'x', user_id:9, password_hash:'H', role:'user' });
    bcrypt.compare.mockResolvedValue(true);
    UserRepo.findById.mockResolvedValue({ userId: 9, email:'x' });

    const out = await AuthService.login({ email:'x', password:'ok' });
    expect(signJwt).toHaveBeenCalledWith({ userId: 9, email:'x', role:'user' });
    expect(out.user.userId).toBe(9);
  });
});
