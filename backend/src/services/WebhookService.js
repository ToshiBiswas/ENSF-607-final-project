/**
 * WebhookService
 * Fire-and-forget JSON POST to an external URL with notification payloads.
 * Intentionally resilient: network failures are logged but do not crash the API.
 */
class WebhookService {
  /**
   * @param {object} payload - Serializable body
   * @param {string|null} [urlOverride=null] - If provided, send to this URL instead of NOTIFICATIONS_WEBHOOK_URL
   */
  static async send(payload, urlOverride = null) {
    const url = urlOverride || process.env.NOTIFICATIONS_WEBHOOK_URL;
    if (!url) return; // webhooks optional in dev
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn('Webhook failed', res.status, text);
      }
    } catch (e) {
      console.warn('Webhook error', e.message);
    }
  }
}

module.exports = { WebhookService };
