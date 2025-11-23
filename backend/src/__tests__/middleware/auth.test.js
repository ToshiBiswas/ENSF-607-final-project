//Unit tests for auth middleware
const { requireAuth, signJwt } = require('../../middleware/auth');
const { UserRepo } = require('../../repositories/UserRepo');
const jwt = require('jsonwebtoken');

//Mock dependencies
jest.mock('../../repositories/UserRepo');
jest.mock('jsonwebtoken');

describe('requireAuth middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
  });

  //Test requireAuth - missing authorization header
  test('should return 401 when authorization header is missing', async () => {
    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  //Test requireAuth - invalid scheme
  test('should return 401 when scheme is not Bearer', async () => {
    req.headers.authorization = 'Basic token123';

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' },
    });
  });

  //Test requireAuth - missing token
  test('should return 401 when token is missing', async () => {
    req.headers.authorization = 'Bearer ';

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' },
    });
  });

  //Test requireAuth - missing JWT_SECRET
  test('should return 500 when JWT_SECRET is not set', async () => {
    delete process.env.JWT_SECRET;
    req.headers.authorization = 'Bearer validtoken';

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL_ERROR', message: 'JWT configuration error' },
    });
  });

  //Test requireAuth - expired token
  test('should return 401 when token is expired', async () => {
    process.env.JWT_SECRET = 'test-secret';
    req.headers.authorization = 'Bearer expiredtoken';
    const error = new Error('Token expired');
    error.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => {
      throw error;
    });

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'TOKEN_EXPIRED', message: 'Token expired' },
    });
  });

  //Test requireAuth - invalid token
  test('should return 401 when token is invalid', async () => {
    process.env.JWT_SECRET = 'test-secret';
    req.headers.authorization = 'Bearer invalidtoken';
    const error = new Error('Invalid token');
    error.name = 'JsonWebTokenError';
    jwt.verify.mockImplementation(() => {
      throw error;
    });

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
    });
  });

  //Test requireAuth - token without userId
  test('should return 401 when token payload has no userId', async () => {
    process.env.JWT_SECRET = 'test-secret';
    req.headers.authorization = 'Bearer token';
    jwt.verify.mockReturnValue({ email: 'test@example.com' });
    //UserRepo.findById not called because userId is missing

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Invalid token payload' },
    });
  });

  //Test requireAuth - user not found
  test('should return 401 when user not found in database', async () => {
    process.env.JWT_SECRET = 'test-secret';
    req.headers.authorization = 'Bearer validtoken';
    jwt.verify.mockReturnValue({ userId: 999 });
    UserRepo.findById.mockResolvedValue(null);

    await requireAuth(req, res, next);

    expect(UserRepo.findById).toHaveBeenCalledWith(999);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'User not found' },
    });
  });

  //Test requireAuth - success
  test('should attach user to req and call next when token is valid', async () => {
    process.env.JWT_SECRET = 'test-secret';
    req.headers.authorization = 'Bearer validtoken';
    const mockUser = {
      userId: 1,
      name: 'Test User',
      email: 'test@example.com',
    };
    jwt.verify.mockReturnValue({ userId: 1 });
    UserRepo.findById.mockResolvedValue(mockUser);

    await requireAuth(req, res, next);

    expect(UserRepo.findById).toHaveBeenCalledWith(1);
    expect(req.user).toEqual(mockUser);
    expect(req.auth).toEqual({ token: 'validtoken', payload: { userId: 1 } });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  //Test requireAuth - userId from different payload fields
  test('should extract userId from sub field', async () => {
    process.env.JWT_SECRET = 'test-secret';
    req.headers.authorization = 'Bearer token';
    const mockUser = { userId: 2 };
    jwt.verify.mockReturnValue({ sub: 2 });
    UserRepo.findById.mockResolvedValue(mockUser);

    await requireAuth(req, res, next);

    expect(UserRepo.findById).toHaveBeenCalledWith(2);
    expect(next).toHaveBeenCalled();
  });
});

describe('signJwt', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
  });

  //Test signJwt - success
  test('should sign JWT with default expiry', () => {
    const payload = { userId: 1, email: 'test@example.com' };
    jwt.sign.mockReturnValue('signed-token');

    const result = signJwt(payload);

    expect(jwt.sign).toHaveBeenCalledWith(
      payload,
      'test-secret',
      { expiresIn: '7d' }
    );
    expect(result).toBe('signed-token');
  });

  //Test signJwt - with custom options
  test('should sign JWT with custom options', () => {
    const payload = { userId: 1 };
    jwt.sign.mockReturnValue('custom-token');

    const result = signJwt(payload, { expiresIn: '1h' });

    expect(jwt.sign).toHaveBeenCalledWith(
      payload,
      'test-secret',
      { expiresIn: '1h' }
    );
    expect(result).toBe('custom-token');
  });

  //Test signJwt - missing JWT_SECRET
  test('should throw error when JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;

    expect(() => signJwt({ userId: 1 })).toThrow('JWT_SECRET must be set in production');
  });

  //Test signJwt - default secret
  test('should throw error when JWT_SECRET is default value', () => {
    process.env.JWT_SECRET = 'changeme';

    expect(() => signJwt({ userId: 1 })).toThrow('JWT_SECRET must be set in production');
  });
});

