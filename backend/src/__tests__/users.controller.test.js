
const setup = require('./controllers-test-setup');
const { SUT_BASE, UserRepo, UserService, PaymentInfoRepo, makeReq, makeRes, beforeEachReset } = setup;
const { UsersController } = require(`${SUT_BASE}/controllers/UsersController`);

describe('● Controllers: UsersController', () => {
  beforeEach(beforeEachReset);

  test('me → returns current user', async () => {
    UserRepo.findById.mockResolvedValueOnce({ userId: 1, email: 'u@test' });
    const req = makeReq({ userId: 1 });
    const res = makeRes();
    await UsersController.me(req, res, jest.fn());
    expect(UserRepo.findById).toHaveBeenCalledWith(1);
    expect(res.body.user.userId).toBe(1);
  });

  test('updateProfile → delegates to service', async () => {
    UserService.updateProfile.mockResolvedValueOnce({ userId: 1, name: 'T' });
    const req = makeReq({ userId: 1, body: { name: 'T' } });
    const res = makeRes();
    await UsersController.updateProfile(req, res, jest.fn());
    expect(UserService.updateProfile).toHaveBeenCalledWith(1, { name: 'T' });
    expect(res.body.user.name).toBe('T');
  });

  test('setPreferences → delegates to service', async () => {
    UserService.setPreferences.mockResolvedValueOnce({ userId: 1, location: 'YYC' });
    const req = makeReq({ userId: 1, body: { location: 'YYC' } });
    const res = makeRes();
    await UsersController.setPreferences(req, res, jest.fn());
    expect(UserService.setPreferences).toHaveBeenCalledWith(1, { location: 'YYC' });
    expect(res.body.preferences.location).toBe('YYC');
  });

  test('paymentMethods → lists stored methods', async () => {
    PaymentInfoRepo.listForUser.mockResolvedValueOnce([{ paymentInfoId: 1 }]);
    const req = makeReq({ userId: 1 });
    const res = makeRes();
    await UsersController.paymentMethods(req, res, jest.fn());
    expect(PaymentInfoRepo.listForUser).toHaveBeenCalledWith(1);
    expect(res.body.paymentMethods[0].paymentInfoId).toBe(1);
  });
});
