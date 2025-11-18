//Unit tests for UsersController
const { UsersController } = require('../../controllers/UsersController');
const { UserService } = require('../../services/UserService');
const { UserRepo } = require('../../repositories/UserRepo');
const { UserCardRepo } = require('../../repositories/UserCardRepo');

//Mock dependencies
jest.mock('../../services/UserService');
jest.mock('../../repositories/UserRepo');
jest.mock('../../repositories/UserCardRepo');
jest.mock('../../repositories/TicketMintRepo');
jest.mock('../../repositories/EventRepo');
jest.mock('../../repositories/PaymentRepo');

describe('UsersController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { userId: 1 },
      body: {},
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  //Test me - get current user
  describe('me', () => {
    test('should return current user', async () => {
      const mockUser = {
        userId: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      };
      UserRepo.findById.mockResolvedValue(mockUser);

      await UsersController.me(req, res);

      expect(UserRepo.findById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ user: mockUser });
    });

    //Test me - user not found
    test('should return null when user not found', async () => {
      UserRepo.findById.mockResolvedValue(null);

      await UsersController.me(req, res);

      expect(res.json).toHaveBeenCalledWith({ user: null });
    });
  });

  //Test updateProfile
  describe('updateProfile', () => {
    test('should update user profile', async () => {
      const updateData = { name: 'Updated Name' };
      req.body = updateData;
      const mockUpdatedUser = {
        userId: 1,
        name: 'Updated Name',
        email: 'test@example.com',
        role: 'user',
      };
      UserService.updateProfile.mockResolvedValue(mockUpdatedUser);

      await UsersController.updateProfile(req, res);

      expect(UserService.updateProfile).toHaveBeenCalledWith(1, updateData);
      expect(res.json).toHaveBeenCalledWith({ user: mockUpdatedUser });
    });

    //Test updateProfile - update email
    test('should update email when provided', async () => {
      const updateData = { email: 'newemail@example.com' };
      req.body = updateData;
      const mockUpdatedUser = {
        userId: 1,
        name: 'Test User',
        email: 'newemail@example.com',
        role: 'user',
      };
      UserService.updateProfile.mockResolvedValue(mockUpdatedUser);

      await UsersController.updateProfile(req, res);

      expect(UserService.updateProfile).toHaveBeenCalledWith(1, updateData);
      expect(res.json).toHaveBeenCalledWith({ user: mockUpdatedUser });
    });
  });

  //Test paymentMethods
  describe('paymentMethods', () => {
    test('should return list of payment methods', async () => {
      const mockPaymentMethods = [
        {
          paymentInfoId: 1,
          accountId: 'acct_123',
          name: 'Test User',
          last4: '1234',
          expMonth: 12,
          expYear: 2025,
        },
      ];
      UserCardRepo.listForUser.mockResolvedValue(mockPaymentMethods);

      await UsersController.paymentMethods(req, res);

      expect(UserCardRepo.listForUser).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ paymentMethods: mockPaymentMethods });
    });

    //Test paymentMethods - empty list
    test('should return empty array when no payment methods', async () => {
      UserCardRepo.listForUser.mockResolvedValue([]);

      await UsersController.paymentMethods(req, res);

      expect(res.json).toHaveBeenCalledWith({ paymentMethods: [] });
    });
  });

  //Test tickets
  describe('tickets', () => {
    test('should return user tickets with event details', async () => {
      const { TicketMintRepo } = require('../../repositories/TicketMintRepo');
      const { EventRepo } = require('../../repositories/EventRepo');

      const mockTickets = [
        {
          ticket_id: 1,
          code: 'ABC123',
          event: { eventId: 10 },
        },
      ];
      const mockEvent = {
        eventId: 10,
        title: 'Test Event',
        location: 'Test Location',
      };

      TicketMintRepo.listForUser.mockResolvedValue(mockTickets);
      EventRepo.findById.mockResolvedValue(mockEvent);

      await UsersController.tickets(req, res);

      expect(TicketMintRepo.listForUser).toHaveBeenCalledWith(1);
      expect(EventRepo.findById).toHaveBeenCalledWith(10);
      expect(res.json).toHaveBeenCalledWith({
        tickets: [{ ...mockTickets[0], event: mockEvent }],
      });
    });

    //Test tickets - ticket without event
    test('should handle tickets without event', async () => {
      const { TicketMintRepo } = require('../../repositories/TicketMintRepo');
      const { EventRepo } = require('../../repositories/EventRepo');

      const mockTickets = [
        {
          ticket_id: 2,
          code: 'XYZ789',
          event: null,
        },
      ];

      TicketMintRepo.listForUser.mockResolvedValue(mockTickets);

      await UsersController.tickets(req, res);

      expect(res.json).toHaveBeenCalledWith({
        tickets: [{ ...mockTickets[0], event: null }],
      });
      expect(EventRepo.findById).not.toHaveBeenCalled();
    });
  });

  //Test payments
  describe('payments', () => {
    test('should return user payment history', async () => {
      const { PaymentRepo } = require('../../repositories/PaymentRepo');
      const mockPayments = [
        {
          payment_id: 1,
          amount_cents: 5000,
          status: 'approved',
          created_at: '2024-01-01',
        },
      ];
      PaymentRepo.listForUser.mockResolvedValue(mockPayments);

      await UsersController.payments(req, res);

      expect(PaymentRepo.listForUser).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ payments: mockPayments });
    });
  });
});

