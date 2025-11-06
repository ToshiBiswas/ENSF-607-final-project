
const setup = require('./test-setup');
const { SUT_BASE, bcryptHashMock, bcryptCompareMock, signJwtMock, mockKnex, qb, expectAppError, beforeEachReset } = setup;

const { AuthService } = require(`${SUT_BASE}/services/AuthService`);

describe('● Auth: register & login', () => {
  beforeEach(beforeEachReset);

  test('register → creates user, hashes password, emits JWT', async () => {
    const out = await AuthService.register({ name: 'A', email: 'new@test', password: 'pw' });
    expect(bcryptHashMock).toHaveBeenCalled();
    expect(signJwtMock).toHaveBeenCalledWith(expect.objectContaining({ userId: 123, email: 'new@test' }));
    expect(out).toEqual(expect.objectContaining({ token: 'jwt-for-123' }));
  });

  test('register → duplicate email → 409', async () => {
    await expectAppError(AuthService.register({ name: 'A', email: 'exists@test', password: 'pw' }), 409, /Email already in use/);
  });

  test('login → invalid email → 401', async () => {
    await expectAppError(AuthService.login({ email: 'none@test', password: 'pw' }), 401, /Invalid credentials/);
  });

  test('login → wrong password → 401', async () => {
    // Seed users table mock for email lookup
    mockKnex._tables.set('users', (() => {
      const k = qb({ firstRow: { user_id: 99, email: 'exists@test', role: 'user', password_hash: '$hash' } });
      k.where = () => k;
      return k;
    })());
    bcryptCompareMock.mockResolvedValueOnce(false);
    await expectAppError(AuthService.login({ email: 'exists@test', password: 'bad' }), 401, /Invalid credentials/);
  });

  test('login → success returns user + token', async () => {
    mockKnex._tables.set('users', (() => {
      const k = qb({ firstRow: { user_id: 123, email: 'exists@test', role: 'user', password_hash: '$hash' } });
      k.where = () => k;
      return k;
    })());
    bcryptCompareMock.mockResolvedValueOnce(true);
    const out = await AuthService.login({ email: 'exists@test', password: 'pw' });
    expect(out.token).toBe('jwt-for-123');
    expect(out.user).toEqual(expect.objectContaining({ userId: 123 }));
  });
});
