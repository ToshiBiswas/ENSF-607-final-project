//Unit tests for User domain model
const { User } = require('../../domain/User');

describe('User', () => {
  //Test User constructor with all parameters
  test('should create User with all parameters', () => {
    const user = new User({
      userId: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      preferences: { location: 'Calgary' },
      paymentMethods: [{ accountId: 'acct_123' }],
    });

    expect(user.userId).toBe(1);
    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('admin');
    expect(user.preferences).toEqual({ location: 'Calgary' });
    expect(user.paymentMethods).toEqual([{ accountId: 'acct_123' }]);
  });

  //Test User constructor with default values
  test('should create User with default role and empty arrays', () => {
    const user = new User({
      userId: 2,
      name: 'Default User',
      email: 'default@example.com',
    });

    expect(user.role).toBe('user');
    expect(user.preferences).toBeNull();
    expect(user.paymentMethods).toEqual([]);
  });

  //Test User constructor with minimal parameters
  test('should create User with only required parameters', () => {
    const user = new User({
      userId: 3,
      name: 'Minimal User',
      email: 'minimal@example.com',
    });

    expect(user.userId).toBe(3);
    expect(user.name).toBe('Minimal User');
    expect(user.email).toBe('minimal@example.com');
    expect(user.role).toBe('user');
  });

  //Test User with null preferences
  test('should handle null preferences', () => {
    const user = new User({
      userId: 4,
      name: 'Null Prefs User',
      email: 'null@example.com',
      preferences: null,
    });

    expect(user.preferences).toBeNull();
  });

  //Test User with empty payment methods
  test('should handle empty payment methods array', () => {
    const user = new User({
      userId: 5,
      name: 'No Cards User',
      email: 'nocards@example.com',
      paymentMethods: [],
    });

    expect(user.paymentMethods).toEqual([]);
  });
});

