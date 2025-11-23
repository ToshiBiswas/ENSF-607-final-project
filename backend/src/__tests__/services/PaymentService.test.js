const { AppError } = require('../../utils/errors');

jest.mock('../../config/db', () => ({
  knex: jest.fn(),
}));

jest.mock('../../repositories/PaymentInfoRepo', () => {
  const mock = {
    findByAccountId: jest.fn(),
    insertCard: jest.fn(),
  };
  return { PaymentInfoRepo: mock };
});

jest.mock('../../repositories/UserCardRepo', () => {
  const mock = {
    isLinked: jest.fn(),
    link: jest.fn(),
    unlink: jest.fn(),
  };
  return { UserCardRepo: mock };
});

jest.mock('../../repositories/PaymentRepo', () => {
  const mock = {
    insertPayment: jest.fn(),
    refund: jest.fn(),
  };
  return { PaymentRepo: mock };
});

jest.mock('../../services/MockPaymentProcessor', () => ({
  MockPaymentProcessor: {
    verifyCard: jest.fn(),
    refund: jest.fn(),
  },
}));

const { PaymentService } = require('../../services/PaymentService');
const { PaymentInfoRepo: mockPaymentInfoRepo } = require('../../repositories/PaymentInfoRepo');
const { UserCardRepo: mockUserCardRepo } = require('../../repositories/UserCardRepo');
const { PaymentRepo: mockPaymentRepo } = require('../../repositories/PaymentRepo');
const { MockPaymentProcessor } = require('../../services/MockPaymentProcessor');
const { knex } = require('../../config/db');

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockTrx = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
      del: jest.fn(),
    };
    const mockKnex = {
      transaction: jest.fn((cb) => cb(mockTrx)),
    };
    knex.mockReturnValue(mockKnex);
    knex.transaction = mockKnex.transaction;
  });

  describe('verifyAndStore', () => {
    it('throws when card is not verified', async () => {
      MockPaymentProcessor.verifyCard.mockResolvedValue({ verified: false, account: {} });
      await expect(PaymentService.verifyAndStore(1, {})).rejects.toBeInstanceOf(AppError);
    });

    it('stores and links new card', async () => {
      MockPaymentProcessor.verifyCard.mockResolvedValue({ verified: true, account: { account_id: 'acct1' } });
      mockPaymentInfoRepo.findByAccountId.mockResolvedValue(null);
      mockPaymentInfoRepo.insertCard.mockResolvedValue({ paymentInfoId: 9, accountId: 'acct1', last4: '1234' });
      mockUserCardRepo.isLinked.mockResolvedValue(false);

      const res = await PaymentService.verifyAndStore(5, { number: '4111111111111111' });
      expect(res.paymentInfoId).toBe(9);
      expect(mockUserCardRepo.link).toHaveBeenCalledWith(5, 9);
    });

    it('returns existing link without re-linking', async () => {
      MockPaymentProcessor.verifyCard.mockResolvedValue({ verified: true, account: { account_id: 'acct1' } });
      const row = { paymentInfoId: 3, accountId: 'acct1', last4: '9999' };
      mockPaymentInfoRepo.findByAccountId.mockResolvedValue(row);
      mockUserCardRepo.isLinked.mockResolvedValue(true);

      const res = await PaymentService.verifyAndStore(2, { number: '4000' });
      expect(res.paymentInfoId).toBe(3);
      expect(mockUserCardRepo.link).not.toHaveBeenCalled();
    });
  });

  describe('chargeAndRecord', () => {
    it('throws when missing paymentInfo', async () => {
      await expect(PaymentService.chargeAndRecord({ userId: 1, amountCents: 100 })).rejects.toBeInstanceOf(AppError);
    });

    it('records payment', async () => {
      mockPaymentRepo.insertPayment.mockResolvedValue({ paymentId: 12 });
      const res = await PaymentService.chargeAndRecord({ userId: 1, amountCents: 100, paymentInfo: { paymentInfoId: 5 } });
      expect(res.paymentId).toBe(12);
      expect(mockPaymentRepo.insertPayment).toHaveBeenCalled();
    });
  });

  describe('refund', () => {
    it('throws when data incomplete', async () => {
      await expect(PaymentService.refund(null)).rejects.toBeInstanceOf(AppError);
    });

    it('calls processor and repo', async () => {
      const purchase = { user_id: 1, payment_id: 2, account_id: 3, purchase_amount_cents: 500 };
      MockPaymentProcessor.refund.mockResolvedValue(true);
      mockPaymentRepo.refund.mockResolvedValue(true);

      const ok = await PaymentService.refund(purchase);
      expect(ok).toBe(true);
      expect(MockPaymentProcessor.refund).toHaveBeenCalledWith({ accountId: 3, amountCents: 500 });
    });
  });

  describe('deletePaymentMethod', () => {
    it('rejects bad id', async () => {
      await expect(PaymentService.deletePaymentMethod(1, 'abc')).rejects.toBeInstanceOf(AppError);
    });

    it('throws when card not linked', async () => {
      mockUserCardRepo.isLinked.mockReturnValue(false);
      await expect(PaymentService.deletePaymentMethod(1, 2)).rejects.toMatchObject({ status: 404 });
    });
  });
});
