//Unit tests for error utilities
const { AppError, errorMiddleware, notFound } = require('../../utils/errors');

describe('AppError', () => {
  //Test AppError constructor with default values
  test('should create AppError with default status 400', () => {
    const error = new AppError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.status).toBe(400);
    expect(error.extra).toEqual({});
    expect(error).toBeInstanceOf(Error);
  });

  //Test AppError with custom status
  test('should create AppError with custom status', () => {
    const error = new AppError('Not found', 404);
    expect(error.message).toBe('Not found');
    expect(error.status).toBe(404);
    expect(error.extra).toEqual({});
  });

  //Test AppError with extra data
  test('should create AppError with extra data', () => {
    const extra = { code: 'VALIDATION_ERROR', field: 'email' };
    const error = new AppError('Validation failed', 400, extra);
    expect(error.message).toBe('Validation failed');
    expect(error.status).toBe(400);
    expect(error.extra).toEqual(extra);
  });

  //Test AppError inheritance
  test('should be instance of Error', () => {
    const error = new AppError('Test');
    expect(error instanceof Error).toBe(true);
    expect(error instanceof AppError).toBe(true);
  });
});

describe('errorMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    console.error = jest.fn(); //Mock console.error
  });

  //Test handling AppError
  test('should handle AppError with code and message', () => {
    const error = new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  //Test AppError with details
  test('should include details when provided', () => {
    const error = new AppError('Validation failed', 400, {
      code: 'VALIDATION_ERROR',
      details: { field: 'email', reason: 'invalid format' },
    });
    errorMiddleware(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { field: 'email', reason: 'invalid format' },
      },
    });
  });

  //Test generic Error handling
  test('should handle generic Error as 500', () => {
    const error = new Error('Database connection failed');
    errorMiddleware(error, req, res, next);

    expect(console.error).toHaveBeenCalledWith(error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal Server Error',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  //Test AppError without code
  test('should use default code when not provided', () => {
    const error = new AppError('Test error', 400);
    errorMiddleware(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'ERROR',
        message: 'Test error',
      },
    });
  });
});

describe('notFound', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
  });

  //Test notFound middleware
  test('should call next with 404 AppError', () => {
    notFound(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Not Found');
    expect(error.status).toBe(404);
  });
});

