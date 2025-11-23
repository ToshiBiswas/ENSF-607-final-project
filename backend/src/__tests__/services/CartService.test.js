//Unit tests for CartService
const { CartService } = require('../../services/CartService');
const { knex } = require('../../config/db');
const { CartRepo } = require('../../repositories/CartRepo');
const { AppError } = require('../../utils/errors');
const { DBCart } = require('../../domain/Cart');

//Mock dependencies
jest.mock('../../config/db');
jest.mock('../../repositories/CartRepo');
jest.mock('../../repositories/EventRepo');

describe('CartService', () => {
  let mockTrx, mockUser;

  beforeEach(() => {
    mockUser = { userId: 1 };
    //Make mockTrx callable as a function
    mockTrx = jest.fn((table) => {
      const tableMock = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        del: jest.fn(),
        select: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
      };
      return tableMock;
    });
    //Add methods directly to mockTrx for direct access
    mockTrx.where = jest.fn().mockReturnThis();
    mockTrx.first = jest.fn();
    mockTrx.insert = jest.fn();
    mockTrx.update = jest.fn();
    mockTrx.del = jest.fn();
    knex.transaction = jest.fn((callback) => callback(mockTrx));
    jest.clearAllMocks();
  });

  //Test addToCart - success
  describe('addToCart', () => {
    test('should add item to cart successfully', async () => {
      const ticketInfoId = 5;
      const quantity = 2;
      const mockCartRow = { cart_id: 1, user_id: 1 };
      const mockTicketInfo = {
        info_id: 5,
        tickets_left: 10,
        ticket_price: 50.00,
      };
      const mockItems = [
        {
          cart_item_id: 1,
          info_id: 5,
          quantity: 2,
          unit_price_cents: 5000,
          ticket_name: 'General',
          event_id: 1,
        },
      ];

      CartRepo.getOrCreateCartForUser.mockResolvedValue(mockCartRow);
      //Mock trx('ticketinfo') call
      const ticketInfoMock = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockTicketInfo),
      };
      mockTrx.mockReturnValueOnce(ticketInfoMock);
      CartRepo.addOrIncrementItem.mockResolvedValue(1);
      CartRepo.getItems.mockResolvedValue(mockItems);

      const result = await CartService.addToCart(mockUser, ticketInfoId, quantity);

      expect(knex.transaction).toHaveBeenCalled();
      expect(CartRepo.getOrCreateCartForUser).toHaveBeenCalledWith(1, mockTrx);
      expect(mockTrx).toHaveBeenCalledWith('ticketinfo');
      expect(ticketInfoMock.first).toHaveBeenCalled();
      expect(CartRepo.addOrIncrementItem).toHaveBeenCalledWith(1, 5, 2, mockTrx);
      expect(result).toBeInstanceOf(DBCart);
    });

    //Test addToCart - missing ticket_info_id
    test('should throw error when ticket_info_id is missing', async () => {
      await expect(CartService.addToCart(mockUser, null, 2)).rejects.toThrow('Missing ticket_info_id');
    });

    //Test addToCart - missing quantity
    test('should throw error when quantity is missing', async () => {
      await expect(CartService.addToCart(mockUser, 5, null)).rejects.toThrow('Missing quantity');
    });

    //Test addToCart - invalid ticket_info_id
    test('should throw error when ticket_info_id is invalid', async () => {
      await expect(
        CartService.addToCart(mockUser, -1, 2)
      ).rejects.toThrow(AppError);

      await expect(
        CartService.addToCart(mockUser, 0, 2)
      ).rejects.toThrow('Invalid ticket_info_id');
    });

    //Test addToCart - ticket not found
    test('should throw error when ticket type not found', async () => {
      const mockCartRow = { cart_id: 1, user_id: 1 };
      CartRepo.getOrCreateCartForUser.mockResolvedValue(mockCartRow);
      const ticketInfoMock = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      };
      mockTrx.mockReturnValueOnce(ticketInfoMock);

      await expect(CartService.addToCart(mockUser, 999, 2)).rejects.toThrow('Ticket type not found');
    });

    //Test addToCart - insufficient stock
    test('should throw error when not enough tickets available', async () => {
      const mockCartRow = { cart_id: 1, user_id: 1 };
      const mockTicketInfo = {
        info_id: 5,
        tickets_left: 1,
      };
      CartRepo.getOrCreateCartForUser.mockResolvedValue(mockCartRow);
      const ticketInfoMock = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockTicketInfo),
      };
      mockTrx.mockReturnValue(ticketInfoMock);

      await expect(CartService.addToCart(mockUser, 5, 5)).rejects.toThrow('Not enough tickets left');
    });
  });

  //Test setItemQuantity
  describe('setItemQuantity', () => {
    test('should update item quantity successfully', async () => {
      const ticketInfoId = 5;
      const quantity = 3;
      const mockCartRow = { cart_id: 1, user_id: 1 };
      const mockCartItem = { cart_item_id: 1, info_id: 5, quantity: 2 };
      const mockTicketInfo = {
        info_id: 5,
        tickets_left: 10,
      };
      const mockItems = [
        {
          cart_item_id: 1,
          info_id: 5,
          quantity: 3,
          unit_price_cents: 5000,
          ticket_name: 'General',
          event_id: 1,
        },
      ];

      CartRepo.getOrCreateCartForUser.mockResolvedValue(mockCartRow);
      CartRepo.getCartItem.mockResolvedValue(mockCartItem);
      const ticketInfoMock = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockTicketInfo),
      };
      mockTrx.mockReturnValueOnce(ticketInfoMock);
      CartRepo.setItemQuantity.mockResolvedValue(1);
      CartRepo.getItems.mockResolvedValue(mockItems);

      const result = await CartService.setItemQuantity(mockUser, ticketInfoId, quantity);

      expect(mockTrx).toHaveBeenCalledWith('ticketinfo');
      expect(CartRepo.setItemQuantity).toHaveBeenCalledWith(1, 5, 3, mockTrx);
      expect(result).toBeInstanceOf(DBCart);
    });

    //Test setItemQuantity - remove item (quantity 0)
    test('should remove item when quantity is 0', async () => {
      const mockCartRow = { cart_id: 1, user_id: 1 };
      const mockCartItem = { cart_item_id: 1, info_id: 5, quantity: 2 };
      CartRepo.getOrCreateCartForUser.mockResolvedValue(mockCartRow);
      CartRepo.getCartItem.mockResolvedValue(mockCartItem);
      CartRepo.removeItem.mockResolvedValue(1);
      CartRepo.getItems.mockResolvedValue([]);

      //Quantity 0 is valid, so we need to pass it explicitly
      const result = await CartService.setItemQuantity(mockUser, 5, 0);

      expect(CartRepo.removeItem).toHaveBeenCalledWith(1, 5, mockTrx);
      expect(CartRepo.setItemQuantity).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(DBCart);
    });

    //Test setItemQuantity - cart item not found
    test('should throw error when cart item not found', async () => {
      const mockCartRow = { cart_id: 1, user_id: 1 };
      CartRepo.getOrCreateCartForUser.mockResolvedValue(mockCartRow);
      CartRepo.getCartItem.mockResolvedValue(null);

      await expect(
        CartService.setItemQuantity(mockUser, 999, 2)
      ).rejects.toThrow(AppError);

      await expect(
        CartService.setItemQuantity(mockUser, 999, 2)
      ).rejects.toThrow('Cart item not found');
    });
  });

  //Test getCart
  describe('getCart', () => {
    test('should return cart with items', async () => {
      const mockCartRow = { cart_id: 1, user_id: 1 };
      const mockItems = [
        {
          cart_item_id: 1,
          info_id: 5,
          quantity: 2,
          event_id: 1,
        },
      ];
      CartRepo.getOrCreateCartForUser.mockResolvedValue(mockCartRow);
      CartRepo.getItems
        .mockResolvedValueOnce(mockItems)
        .mockResolvedValueOnce(mockItems);

      //Mock EventRepo
      const { EventRepo } = require('../../repositories/EventRepo');
      const mockEvent = {
        purchasable: jest.fn().mockReturnValue(true),
      };
      EventRepo.findById = jest.fn().mockResolvedValue(mockEvent);

      const result = await CartService.getCart(mockUser);

      expect(result).toBeInstanceOf(DBCart);
    });
  });

  //Test clear
  describe('clear', () => {
    test('should clear all items from cart', async () => {
      const mockCartRow = { cart_id: 1, user_id: 1 };
      CartRepo.getOrCreateCartForUser.mockResolvedValue(mockCartRow);
      CartRepo.clear.mockResolvedValue(undefined);

      const result = await CartService.clear(mockUser);

      expect(CartRepo.clear).toHaveBeenCalledWith(1, mockTrx);
      expect(result).toBeInstanceOf(DBCart);
      expect(result.items).toEqual([]);
    });
  });
});

