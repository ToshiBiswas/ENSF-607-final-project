
const setup = require('./controllers-test-setup');
const { SUT_BASE, AuthService, makeReq, makeRes, beforeEachReset } = setup;
const { AuthController } = require(`${SUT_BASE}/controllers/AuthController`);

describe('● Controllers: AuthController', () => {
  beforeEach(beforeEachReset);

  test('register → 201 and returns token', async () => {
    AuthService.register.mockResolvedValueOnce({ user: { userId: 1 }, token: 'jwt' });
    const req = makeReq({ body: { name: 'A', email: 'a@x', password: 'pw' } });
    const res = makeRes();
    await AuthController.register(req, res, jest.fn());
    expect(AuthService.register).toHaveBeenCalledWith({ name: 'A', email: 'a@x', password: 'pw' });
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBe('jwt');
  });

  test('login → 200 and returns token', async () => {
    AuthService.login.mockResolvedValueOnce({ user: { userId: 1 }, token: 'jwt' });
    const req = makeReq({ body: { email: 'a@x', password: 'pw' } });
    const res = makeRes();
    await AuthController.login(req, res, jest.fn());
    expect(AuthService.login).toHaveBeenCalledWith({ email: 'a@x', password: 'pw' });
    expect(res.body.token).toBe('jwt');
  });
});
