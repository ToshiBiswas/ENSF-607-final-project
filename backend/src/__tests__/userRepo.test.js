
const setup = require('./repos-test-setup');
const { SUT_BASE, seedTable, beforeEachReset } = setup;
const { UserRepo } = require(`${SUT_BASE}/repositories/UserRepo`);

describe('● Repos: UserRepo', () => {
  beforeEach(beforeEachReset);

  test('findById → returns User domain', async () => {
    seedTable('users', { firstRow: { user_id: 1, name: 'A', email: 'a@x', role: 'user' } });
    const u = await UserRepo.findById(1);
    expect(u.__type).toBe('User');
    expect(u.userId).toBe(1);
  });

  test('findByEmail → returns User domain', async () => {
    seedTable('users', { firstRow: { user_id: 2, name: 'B', email: 'b@x', role: 'user' } });
    const u = await UserRepo.findByEmail('b@x');
    expect(u.userId).toBe(2);
  });

  test('insert → returns domain by id', async () => {
    seedTable('users', { firstRow: { user_id: 3, name: 'C', email: 'c@x', role: 'user' } });
    const u = await UserRepo.insert({ name: 'C', email: 'c@x', passwordHash: 'h' });
    expect(u.userId).toBe(3);
  });

  test('updateProfile → updates and returns domain', async () => {
    seedTable('users', { firstRow: { user_id: 4, name: 'D', email: 'd@x', role: 'user' } });
    const u = await UserRepo.updateProfile(4, { name: 'DD', email: 'd@x' });
    expect(u.userId).toBe(4);
  });
});
