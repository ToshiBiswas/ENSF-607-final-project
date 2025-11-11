/**
 * Domain Model: PaymentInfo
 * Represents a stored card/account returned by the external Payments API.
 * Only non-sensitive fields (like last4/exp) are persisted here.
 */
class PaymentInfo {
  constructor({ paymentInfoId, owner, accountId, name, last4, expMonth, expYear, currency}) {
    this.paymentInfoId = paymentInfoId;
    this.owner = owner; // User
    this.accountId = accountId;
    this.name = name;
    this.last4 = last4;
    this.expMonth = expMonth;
    this.expYear = expYear;
    this.currency = currency || 'CAD';
  }
}

module.exports = { PaymentInfo };
