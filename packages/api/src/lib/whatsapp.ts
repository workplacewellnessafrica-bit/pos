/**
 * ShopLink WhatsApp Notification Service
 *
 * Sends business-critical WhatsApp messages via the Meta Cloud API.
 * Covers:
 *   - Order notifications to business owners
 *   - Order confirmations to customers
 *
 * NOTE: SMS fallback is intentionally deferred to a later phase.
 * All notification attempts are fire-and-forget (non-blocking) with
 * structured logging so failures never interrupt the checkout flow.
 */

/** Normalize any phone number to E.164 format (+254...) */
function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return null;
  return digits.startsWith('+') ? digits : `+${digits}`;
}

/**
 * Low-level WhatsApp text sender via Meta Business Cloud API.
 * Returns true on success, false on any failure (log only — never throws).
 */
async function sendWhatsAppMessage(to: string, body: string): Promise<boolean> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn('[WhatsApp] WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set — skipping message.');
    return false;
  }

  const e164 = toE164(to);
  if (!e164) {
    console.warn(`[WhatsApp] Invalid phone number: ${to}`);
    return false;
  }

  // Strip the leading '+' for the Meta API — it expects the number without it
  const recipient = e164.replace(/^\+/, '');

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'text',
          text: { body, preview_url: false },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown');
      console.warn(`[WhatsApp] Send failed (${res.status}): ${err}`);
      return false;
    }

    console.log(`[WhatsApp] Message sent to ${e164}`);
    return true;
  } catch (err) {
    console.error('[WhatsApp] Network error:', err);
    return false;
  }
}

/** ── Public API ─────────────────────────────────────────────────────── */

/**
 * Notify a business owner when a new order is placed.
 * Called after the order is persisted to the database.
 */
export async function notifyBusinessNewOrder(opts: {
  businessPhone: string;
  businessName: string;
  customerName: string;
  customerPhone: string;
  orderTotal: number;
  currency: string;
  items: Array<{ name: string; qty: number; price: number }>;
}): Promise<void> {
  const { businessPhone, businessName, customerName, customerPhone, orderTotal, currency, items } = opts;

  const itemLines = items
    .map((i) => `  • ${i.name} × ${i.qty} — ${currency} ${(i.price * i.qty).toFixed(2)}`)
    .join('\n');

  const message =
    `🛍️ *New Order — ${businessName}*\n\n` +
    `*Customer:* ${customerName} (${customerPhone})\n` +
    `*Items:*\n${itemLines}\n\n` +
    `*Total:* ${currency} ${orderTotal.toFixed(2)}\n\n` +
    `Log in to your ShopLink dashboard to manage this order.`;

  await sendWhatsAppMessage(businessPhone, message);
}

/**
 * Send an order confirmation to the customer on successful checkout.
 */
export async function sendOrderConfirmationToCustomer(opts: {
  customerPhone: string;
  customerName: string;
  orderTotal: number;
  currency: string;
  businessName: string;
}): Promise<void> {
  const { customerPhone, customerName, orderTotal, currency, businessName } = opts;

  const message =
    `✅ *Order Confirmed!*\n\n` +
    `Hi ${customerName}, your order from *${businessName}* has been received.\n\n` +
    `*Total:* ${currency} ${orderTotal.toFixed(2)}\n\n` +
    `You'll receive updates as your order is processed. Thank you for shopping with ShopLink! 🚀`;

  await sendWhatsAppMessage(customerPhone, message);
}
