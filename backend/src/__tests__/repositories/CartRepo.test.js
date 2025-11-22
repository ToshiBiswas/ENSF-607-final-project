//Unit tests for CartRepo
const { CartRepo } = require('../../repositories/CartRepo');
const { knex } = require('../../config/db');

//Mock knex
jest.mock('../../config/db', () => ({
  knex: jest.fn(),
}));

describe('CartRepo', () => {
  let mockKnex, mockTrx;

  beforeEach(() => {
    mockTrx = {
      where: jest.fn().mockReturnThis(),
      insert: jest.fn(),
      first: jest.fn(),
      update: jest.fn(),
      del: jest.fn(),
      select: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      raw: jest.fn((str) => str),
    };
    mockKnex = mockTrx;
    knex.mockReturnValue(mockKnex);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  //Test getOrCreateCartForUser - existing cart
  describe('getOrCreateCartForUser', () => {
    test('should return existing cart when cart exists', async () => {
      const mockCart = { cart_id: 1, user_id: 1 };
      mockKnex.first.mockResolvedValue(mockCart);

      const result = await CartRepo.getOrCreateCartForUser(1);

      expect(knex).toHaveBeenCalledWith('carts');
      expect(mockKnex.where).toHaveBeenCalledWith({ user_id: 1 });
      expect(mockKnex.first).toHaveBeenCalledTimes(1);
      expect(mockKnex.insert).not.toHaveBeenCalled();
      expect(result).toEqual(mockCart);
    });

    //Test getOrCreateCartForUser - create new cart
    test('should create and return new cart when cart does not exist', async () => {
      mockKnex.first
        .mockResolvedValueOnce(null) //First call - no cart
        .mockResolvedValueOnce({ cart_id: 2, user_id: 1 }); //Second call - created cart
      mockKnex.insert.mockResolvedValue([2]);

      const result = await CartRepo.getOrCreateCartForUser(1);

      expect(mockKnex.insert).toHaveBeenCalledWith({ user_id: 1 });
      expect(mockKnex.first).toHaveBeenCalledTimes(2);
      expect(result.cart_id).toBe(2);
    });

    //Test getOrCreateCartForUser with transaction
    test('should use transaction when provided', async () => {
      const mockCart = { cart_id: 3, user_id: 2 };
      const transactionMock = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockCart),
        insert: jest.fn().mockResolvedValue([3]),
      };
      //Make transaction mock callable
      const trxFn = jest.fn((table) => {
        if (table === 'carts') return transactionMock;
        return transactionMock;
      });
      Object.assign(trxFn, transactionMock);

      const result = await CartRepo.getOrCreateCartForUser(2, trxFn);

      expect(trxFn).toHaveBeenCalledWith('carts');
      expect(transactionMock.where).toHaveBeenCalledWith({ user_id: 2 });
      expect(result).toEqual(mockCart);
    });
  });

  //Test addOrIncrementItem - new item
  describe('addOrIncrementItem', () => {
    test('should insert new item when item does not exist', async () => {
      mockKnex.first.mockResolvedValue(null);
      mockKnex.insert.mockResolvedValue([10]);

      const result = await CartRepo.addOrIncrementItem(1, 5, 2);

      expect(knex).toHaveBeenCalledWith('cart_items');
      expect(mockKnex.where).toHaveBeenCalledWith({ cart_id: 1, info_id: 5 });
      expect(mockKnex.insert).toHaveBeenCalledWith({
        cart_id: 1,
        info_id: 5,
        quantity: 2,
      });
      expect(result).toBe(10);
    });

    //Test addOrIncrementItem - increment existing item
    test('should increment quantity when item exists', async () => {
      const existingItem = { cart_item_id: 20, quantity: 3 };
      mockKnex.first.mockResolvedValue(existingItem);
      const mockUpdateKnex = {
        where: jest.fn().mockReturnThis(),
        update: jest.fn().mockResolvedValue(1),
      };
      knex.mockReturnValueOnce(mockKnex).mockReturnValueOnce(mockUpdateKnex);

      const result = await CartRepo.addOrIncrementItem(1, 5, 2);

      expect(mockUpdateKnex.where).toHaveBeenCalledWith({ cart_item_id: 20 });
      expect(mockUpdateKnex.update).toHaveBeenCalledWith({ quantity: 5 });
      expect(result).toBe(20);
    });
  });

  //Test getCartItem
  describe('getCartItem', () => {
    test('should return cart item when exists', async () => {
      const mockItem = { cart_item_id: 1, cart_id: 1, info_id: 5, quantity: 2 };
      mockKnex.first.mockResolvedValue(mockItem);

      const result = await CartRepo.getCartItem(1, 5);

      expect(knex).toHaveBeenCalledWith('cart_items');
      expect(mockKnex.where).toHaveBeenCalledWith({ cart_id: 1, info_id: 5 });
      expect(result).toEqual(mockItem);
    });

    //Test getCartItem - not found
    test('should return null when item does not exist', async () => {
      mockKnex.first.mockResolvedValue(null);

      const result = await CartRepo.getCartItem(1, 999);

      expect(result).toBeNull();
    });
  });

  //Test setItemQuantity
  describe('setItemQuantity', () => {
    test('should update item quantity', async () => {
      mockKnex.update.mockResolvedValue(1);

      const result = await CartRepo.setItemQuantity(1, 5, 10);

      expect(knex).toHaveBeenCalledWith('cart_items');
      expect(mockKnex.where).toHaveBeenCalledWith({ cart_id: 1, info_id: 5 });
      expect(mockKnex.update).toHaveBeenCalledWith({ quantity: 10 });
      expect(result).toBe(1);
    });
  });

  //Test removeItem
  describe('removeItem', () => {
    test('should delete cart item', async () => {
      mockKnex.del.mockResolvedValue(1);

      const result = await CartRepo.removeItem(1, 5);

      expect(knex).toHaveBeenCalledWith('cart_items');
      expect(mockKnex.where).toHaveBeenCalledWith({ cart_id: 1, info_id: 5 });
      expect(mockKnex.del).toHaveBeenCalled();
      expect(result).toBe(1);
    });
  });

  //Test getItems
  describe('getItems', () => {
    test('should return cart items with ticket info', async () => {
      const mockItems = [
        {
          cart_item_id: 1,
          info_id: 5,
          quantity: 2,
          unit_price_cents: 5000,
          ticket_name: 'VIP',
          event_id: 10,
        },
      ];
      mockKnex.orderBy.mockResolvedValue(mockItems);

      const result = await CartRepo.getItems(1);

      expect(knex).toHaveBeenCalledWith('cart_items as ci');
      expect(mockKnex.join).toHaveBeenCalled();
      expect(mockKnex.where).toHaveBeenCalledWith('ci.cart_id', 1);
      expect(mockKnex.orderBy).toHaveBeenCalledWith('ci.cart_item_id', 'asc');
      expect(result).toEqual(mockItems);
    });
  });

  //Test clear
  describe('clear', () => {
    test('should delete all items from cart', async () => {
      mockKnex.del.mockResolvedValue(3);

      await CartRepo.clear(1);

      expect(knex).toHaveBeenCalledWith('cart_items');
      expect(mockKnex.where).toHaveBeenCalledWith({ cart_id: 1 });
      expect(mockKnex.del).toHaveBeenCalled();
    });
  });
});

