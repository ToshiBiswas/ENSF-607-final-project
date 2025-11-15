/**
 * AuthController
 * Bridges HTTP <-> AuthService
 */
'use strict';

const { AuthService } = require('../services/AuthService');
const asyncHandler = require('../utils/handler');
const { CartService } = require('../services/CartService');

// OOP singleton emitter (transport = WebhookService, payloads = WebhookEnvelope)

class AuthController {
  /**
   * POST /api/auth/register
   * body: { name, email, password }
   * returns: { user, token }
   */
  static register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    
    // Add validation
    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', 400, { code: 'MISSING_FIELDS' });
    }
    
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError('Invalid email format', 400, { code: 'INVALID_EMAIL' });
    }
    
    if (typeof password !== 'string' || password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400, { code: 'WEAK_PASSWORD' });
    }
    
    const result = await AuthService.register({ name, email, password });
    CartService.getCart(result.user);
    res.status(201).json(result);
  });
  
  
  /**
   * POST /api/auth/login
   * body: { email, password }
   * returns: { user, token }
   */
  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // Add validation
    if (!email || !password) {
      throw new AppError('Email and password are required', 400, { code: 'MISSING_FIELDS' });
    }
    
    const result = await AuthService.login({ email, password });
    res.status(200).json(result);
  });

}

module.exports = { AuthController };
