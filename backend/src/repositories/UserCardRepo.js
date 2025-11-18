// src/repositories/UserCardRepo.js
'use strict';
const { knex } = require('../config/db');
const { AppError } = require('../utils/errors');

const TABLE = 'user_cards';

class UserCardRepo {
  /**
   * Simple boolean check: is this payment_info_id linked to this user?
   */
  static async isLinked(userId, paymentInfoId) {
    const r = await knex(TABLE)
      .where({ user_id: userId, payment_info_id: paymentInfoId })
      .first();
    return !!r;
  }

  /**
   * Create a link row between user and payment_info.
   */
  static async link(userId, paymentInfoId) {
    try {
      const [id] = await knex(TABLE).insert({
        user_id: userId,
        payment_info_id: paymentInfoId,
      });
      return { userCardId: id, userId, paymentInfoId };
    } catch (e) {
      // Unique(user_id, payment_info_id) → treat as duplicate link
      if (e && /duplicate/i.test(String(e.message))) {
        throw new AppError('Account already exists', 409, {
          code: 'ACCOUNT_EXISTS',
          userId,
          paymentInfoId,
        });
      }
      throw e;
    }
  }

  /**
   * Ensure a link exists between this user and payment_info.
   * - If the row already exists, return it.
   * - If not, create it via link().
   */
  static async ensureLinked(userId, paymentInfoId) {
    const existing = await knex(TABLE)
      .where({ user_id: userId, payment_info_id: paymentInfoId })
      .first();

    if (existing) {
      return {
        userCardId: existing.user_card_id,
        userId,
        paymentInfoId,
      };
    }

    // Will throw AppError if duplicate race, which is fine for this project.
    return this.link(userId, paymentInfoId);
  }
  static async partOFLinked(paymentInfoId){
    const r = await knex(TABLE)
      .where({payment_info_id: paymentInfoId })
      .first();
    return !!r;
  }
  
  /**
   * Get the joined user-card + paymentinfo record if it exists.
   * Useful when you want to "see" that the card & link exist in one go.
   */
  static async findLinkedCard(userId, paymentInfoId) {
    return knex('user_cards as uc')
      .join('paymentinfo as pi', 'pi.payment_info_id', 'uc.payment_info_id')
      .where('uc.user_id', userId)
      .andWhere('uc.payment_info_id', paymentInfoId)
      .select(
        'uc.user_card_id as userCardId',
        'uc.user_id as userId',
        'uc.payment_info_id as paymentInfoId',
        'pi.name',
        'pi.last4',
        'pi.exp_month as expMonth',
        'pi.exp_year as expYear'
      )
      .first();
  }

  // Helpful for listing a user's saved cards
  static async listForUser(userId) {
    return knex('user_cards as uc')
      .join('paymentinfo as pi', 'pi.payment_info_id', 'uc.payment_info_id')
      .where('uc.user_id', userId)
      .select(
        'pi.payment_info_id as paymentInfoId',
        'pi.name',
        'pi.last4',
        'pi.exp_month as expMonth',
        'pi.exp_year as expYear'
      )
      .orderBy('pi.payment_info_id', 'desc');
  }
    /**
   * Drop the user ↔ payment_info link.
   * Returns true if a row was actually deleted.
   */
  static async unlink(userId, paymentInfoId) {
    const deleted = await knex(TABLE)
      .where({ user_id: userId, payment_info_id: paymentInfoId })
      .del();

    return deleted > 0;
  }

}

module.exports = { UserCardRepo };
