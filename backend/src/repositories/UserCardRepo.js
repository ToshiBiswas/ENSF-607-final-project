// src/repositories/UserCardRepo.js
'use strict';
const { knex } = require('../config/db');
const { AppError } = require('../utils/errors');

const TABLE = 'user_cards';

class UserCardRepo {
  static async isLinked(userId, paymentInfoId) {
    console.log(userId)
    console.log(paymentInfoId)
    const r = await knex(TABLE).where({ user_id: userId, payment_info_id: paymentInfoId }).first();
    return !!r;
  }

  static async link(userId, paymentInfoId) {
    try {
      const [id] = await knex(TABLE).insert({ user_id: userId, payment_info_id: paymentInfoId });
      return { userCardId: id, userId, paymentInfoId };
    } catch (e) {
      // Unique(user_id, payment_info_id) → treat as duplicate link
      if (e && /duplicate/i.test(String(e.message))) {
        throw new AppError('Account already exists', 409, {
          code: 'ACCOUNT_EXISTS',
          userId,
          paymentInfoId
        });
      }
      throw e;
    }
  }

  // Helpful for listing a user's saved cards
  static async listForUser(userId) {
    console.log(userId)
    return knex('user_cards as uc')
      .join('paymentinfo as pi', 'pi.payment_info_id', 'uc.payment_info_id')
      .where('uc.user_id', userId)
      .select(
        'pi.payment_info_id as paymentInfoId',
        'pi.account_id as accountId',
        'pi.name',
        'pi.last4',
        'pi.exp_month as expMonth',
        'pi.exp_year as expYear',
        'pi.currency'
      )
      .orderBy('pi.payment_info_id', 'desc');
  }
}

module.exports = { UserCardRepo };
