/**
 * Domain Model: Payment
 * Local ledger row linked to an upstream provider transaction.
 */
class Payment {
  constructor({ paymentId, user, event = null, ticketInfo = null, paymentInfo = null, amountCents, currency = 'CAD', status = 'pending', refundedCents = 0, providerPaymentId = null, idempotencyKey = null }) {
    this.paymentId = paymentId;
    this.user = user;
    this.event = event;
    this.ticketInfo = ticketInfo;
    this.paymentInfo = paymentInfo;
    this.amountCents = amountCents;
    this.currency = currency;
    this.status = status;
    this.refundedCents = refundedCents;
    this.providerPaymentId = providerPaymentId;
    this.idempotencyKey = idempotencyKey;
  }
}

module.exports = { Payment };
