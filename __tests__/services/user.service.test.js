jest.mock('../../repositories/UserRepo', () => ({ UserRepo: { updateProfile: jest.fn(), findById: jest.fn() } }));
jest.mock('../../repositories/UserPreferencesRepo', () => ({ UserPreferencesRepo: { upsert: jest.fn() } }));

const { UserRepo } = require('../../repositories/UserRepo');
const { UserPreferencesRepo } = require('../../repositories/UserPreferencesRepo');
const { UserService } = require('../../services/UserService');

test('updateProfile delegates to repo', async () => {
  UserRepo.updateProfile.mockResolvedValue({ userId: 1, name: 'X' });
  const out = await UserService.updateProfile(1, { name: 'X', email: 'x@x' });
  expect(UserRepo.updateProfile).toHaveBeenCalledWith(1, { name: 'X', email: 'x@x' });
  expect(out.name).toBe('X');
});

test('setPreferences delegates to repo', async () => {
  UserPreferencesRepo.upsert.mockResolvedValue({ userId: 1, location: 'YYZ', categoryId: 3 });
  const out = await UserService.setPreferences(1, { location: 'YYZ', categoryId: 3 });
  expect(out.location).toBe('YYZ');
});
