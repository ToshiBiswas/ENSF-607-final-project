//Unit tests for UserService
const { UserService } = require('../../services/UserService');
const { UserRepo } = require('../../repositories/UserRepo');

//Mock UserRepo
jest.mock('../../repositories/UserRepo');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  //Test updateProfile
  describe('updateProfile', () => {
    test('should call UserRepo.updateProfile with correct parameters', async () => {
      const userId = 1;
      const updateData = { name: 'Updated Name', email: 'updated@example.com' };
      const mockUser = {
        userId: 1,
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'user',
      };
      UserRepo.updateProfile.mockResolvedValue(mockUser);

      const result = await UserService.updateProfile(userId, updateData);

      expect(UserRepo.updateProfile).toHaveBeenCalledWith(userId, updateData);
      expect(result).toEqual(mockUser);
    });

    //Test updateProfile with only name
    test('should update only name when email not provided', async () => {
      const userId = 2;
      const updateData = { name: 'New Name' };
      const mockUser = {
        userId: 2,
        name: 'New Name',
        email: 'existing@example.com',
        role: 'user',
      };
      UserRepo.updateProfile.mockResolvedValue(mockUser);

      const result = await UserService.updateProfile(userId, updateData);

      expect(UserRepo.updateProfile).toHaveBeenCalledWith(userId, updateData);
      expect(result.name).toBe('New Name');
    });

    //Test updateProfile with only email
    test('should update only email when name not provided', async () => {
      const userId = 3;
      const updateData = { email: 'newemail@example.com' };
      const mockUser = {
        userId: 3,
        name: 'Existing Name',
        email: 'newemail@example.com',
        role: 'user',
      };
      UserRepo.updateProfile.mockResolvedValue(mockUser);

      const result = await UserService.updateProfile(userId, updateData);

      expect(UserRepo.updateProfile).toHaveBeenCalledWith(userId, updateData);
      expect(result.email).toBe('newemail@example.com');
    });
  });
});

