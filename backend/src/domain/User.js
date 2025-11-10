/**
 * Domain Model: User
 *
 * NOTE: Domain models prefer object references (composition) vs raw IDs.
 * e.g., User.preferences is a UserPreferences INSTANCE (or null)
 *       User.paymentMethods is an array of PaymentInfo instances
 *
 * Keep models dumb (data containers); push logic to Services.
 */
class User {
  /**
   * @param {object} args
   * @param {number} args.userId
   * @param {string} args.name
   * @param {string} args.email
   * @param {'user'|'admin'|'organizer'} [args.role='user']
   * @param {object|null} [args.preferences=null] - UserPreferences instance
   * @param {object[]} [args.paymentMethods=[]] - PaymentInfo instances
   */
  constructor({ userId, name, email, role = 'user', preferences = null, paymentMethods = [] }) {
    this.userId = userId;
    this.name = name;
    this.email = email;
    this.role = role;
    this.preferences = preferences;
    this.paymentMethods = paymentMethods;
  }
}

module.exports = { User };
