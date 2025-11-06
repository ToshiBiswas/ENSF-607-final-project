
const setup = require('./repos-test-setup');
const { SUT_BASE, seedTable, beforeEachReset } = setup;
const { CategoryRepo } = require(`${SUT_BASE}/repositories/CategoryRepo`);

describe('● Repos: CategoryRepo', () => {
  beforeEach(beforeEachReset);

  test('findOrCreate → returns existing', async () => {
    seedTable('categoriesid', { firstRow: { category_id: 9, category_value: 'vip' } });
    const c = await CategoryRepo.findOrCreate('vip');
    expect(c.value).toBe('vip');
  });

  test('getByValue → returns null when absent', async () => {
    seedTable('categoriesid', { firstRow: null });
    const c = await CategoryRepo.getByValue('rock');
    expect(c).toBeNull();
  });
});
