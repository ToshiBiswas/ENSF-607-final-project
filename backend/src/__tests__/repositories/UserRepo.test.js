//Unit tests for UserRepo
const { UserRepo } = require('../../repositories/UserRepo');
const { knex } = require('../../config/db');
const { User } = require('../../domain/User');

//Mock knex
jest.mock('../../config/db', () => ({
  knex: jest.fn(),
}));

describe('UserRepo', () => {
  let mockKnex;

  beforeEach(() => {
    mockKnex = {
      where: jest.fn().mockReturnThis(),
      insert: jest.fn(),
      update: jest.fn(),
      first: jest.fn(),
    };
    knex.mockReturnValue(mockKnex);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  //Test findById with existing user
  describe('findById', () => {
    test('should return User domain object when user exists', async () => {
      const mockRow = {
        user_id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      };
      mockKnex.first.mockResolvedValue(mockRow);

      const result = await UserRepo.findById(1);

      expect(knex).toHaveBeenCalledWith('users');
      expect(mockKnex.where).toHaveBeenCalledWith({ user_id: 1 });
      expect(mockKnex.first).toHaveBeenCalled();
      expect(result).toBeInstanceOf(User);
      expect(result.userId).toBe(1);
      expect(result.name).toBe('Test User');
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('user');
    });

    //Test findById with non-existent user
    test('should return null when user does not exist', async () => {
      mockKnex.first.mockResolvedValue(null);

      const result = await UserRepo.findById(999);

      expect(result).toBeNull();
    });
  });

  //Test findByEmail
  describe('findByEmail', () => {
    test('should return User when email exists', async () => {
      const mockRow = {
        user_id: 2,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
      };
      mockKnex.first.mockResolvedValue(mockRow);

      const result = await UserRepo.findByEmail('john@example.com');

      expect(knex).toHaveBeenCalledWith('users');
      expect(mockKnex.where).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(result).toBeInstanceOf(User);
      expect(result.email).toBe('john@example.com');
    });

    //Test findByEmail with non-existent email
    test('should return null when email does not exist', async () => {
      mockKnex.first.mockResolvedValue(null);

      const result = await UserRepo.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  //Test findAuthByEmail
  describe('findAuthByEmail', () => {
    test('should return raw row with password_hash', async () => {
      const mockRow = {
        user_id: 3,
        name: 'Auth User',
        email: 'auth@example.com',
        password_hash: 'hashed_password',
        role: 'user',
      };
      mockKnex.first.mockResolvedValue(mockRow);

      const result = await UserRepo.findAuthByEmail('auth@example.com');

      expect(knex).toHaveBeenCalledWith('users');
      expect(mockKnex.where).toHaveBeenCalledWith({ email: 'auth@example.com' });
      expect(result).toEqual(mockRow);
      expect(result.password_hash).toBe('hashed_password');
    });
  });

  //Test insert
  describe('insert', () => {
    test('should insert user and return User domain object', async () => {
      const insertData = {
        name: 'New User',
        email: 'new@example.com',
        passwordHash: 'hashed_password',
      };
      mockKnex.insert.mockResolvedValue([5]);
      
      //Mock findById call after insert
      const mockUser = new User({
        userId: 5,
        name: 'New User',
        email: 'new@example.com',
        role: 'user',
      });
      
      //Mock the second knex call for findById
      const mockKnex2 = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          user_id: 5,
          name: 'New User',
          email: 'new@example.com',
          role: 'user',
        }),
      };
      knex.mockReturnValueOnce(mockKnex).mockReturnValueOnce(mockKnex2);

      const result = await UserRepo.insert(insertData);

      expect(knex).toHaveBeenCalledWith('users');
      expect(mockKnex.insert).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        password_hash: 'hashed_password',
      });
      expect(result).toBeInstanceOf(User);
    });
  });

  //Test updateProfile
  describe('updateProfile', () => {
    test('should update user profile and return updated User', async () => {
      const userId = 1;
      const updateData = { name: 'Updated Name', email: 'updated@example.com' };
      
      mockKnex.update.mockResolvedValue(1);
      
      //Mock findById call after update
      const mockKnex2 = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          user_id: 1,
          name: 'Updated Name',
          email: 'updated@example.com',
          role: 'user',
        }),
      };
      knex.mockReturnValueOnce(mockKnex).mockReturnValueOnce(mockKnex2);

      const result = await UserRepo.updateProfile(userId, updateData);

      expect(knex).toHaveBeenCalledWith('users');
      expect(mockKnex.where).toHaveBeenCalledWith({ user_id: 1 });
      expect(mockKnex.update).toHaveBeenCalledWith(updateData);
      expect(result).toBeInstanceOf(User);
      expect(result.name).toBe('Updated Name');
    });
  });
});

