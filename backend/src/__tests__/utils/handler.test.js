//Unit tests for asyncHandler utility
const asyncHandler = require('../../utils/handler');

describe('asyncHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
  });

  //Test successful async function execution
  test('should execute async function successfully', async () => {
    const asyncFn = jest.fn().mockResolvedValue('success');
    const wrapped = asyncHandler(asyncFn);

    await wrapped(req, res, next);

    expect(asyncFn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  //Test error handling in async function
  test('should catch and forward errors to next', async () => {
    const error = new Error('Test error');
    const asyncFn = jest.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(asyncFn);

    await wrapped(req, res, next);

    expect(asyncFn).toHaveBeenCalledWith(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  //Test with synchronous function
  test('should handle synchronous function', async () => {
    const syncFn = jest.fn().mockReturnValue('sync result');
    const wrapped = asyncHandler(syncFn);

    await wrapped(req, res, next);

    expect(syncFn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  //Test with function that throws synchronously
  test('should catch synchronous errors', async () => {
    const error = new Error('Sync error');
    const syncFn = jest.fn(() => {
      throw error;
    });
    const wrapped = asyncHandler(syncFn);

    await wrapped(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  //Test with function that returns promise rejection
  test('should handle promise rejection', async () => {
    const error = new Error('Promise rejection');
    const asyncFn = jest.fn().mockReturnValue(Promise.reject(error));
    const wrapped = asyncHandler(asyncFn);

    await wrapped(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

