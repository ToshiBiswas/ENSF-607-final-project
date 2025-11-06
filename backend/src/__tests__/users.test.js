
const setup = require('./test-setup');
const { SUT_BASE, beforeEachReset } = setup;

const { UserService } = require(`${SUT_BASE}/services/UserService`);

describe('● Users: /api/me & preferences', () => {
  beforeEach(beforeEachReset);

  test('PATCH /api/me → update profile', async () => {
    const r = await UserService.updateProfile(1, { name: 'Toshi', email: 't@test' });
    expect(r).toEqual(expect.objectContaining({ userId: 1, name: 'Toshi' }));
  });

  test('PUT /api/me/preferences → upsert', async () => {
    const r = await UserService.setPreferences(1, { location: 'YYC', categoryId: 7 });
    expect(r).toEqual(expect.objectContaining({ userId: 1, location: 'YYC' }));
  });
});
