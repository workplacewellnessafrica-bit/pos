import { config } from '../config.js';

/**
 * Send WhatsApp order confirmation message via Manus Forge API
 */
export async function sendWhatsAppOrderConfirmation(
  businessPhoneNumber: string,
  orderDetails: string
): Promise<boolean> {
  if (!businessPhoneNumber || businessPhoneNumber.length < 7) {
    return false;
  }

  const normalizedPhone = businessPhoneNumber.replace(/\D/g, "");
  const formattedPhone = normalizedPhone.startsWith("+")
    ? normalizedPhone
    : `+${normalizedPhone}`;

  if (!config.FORGE_API_URL || !config.FORGE_API_KEY) {
    console.warn("[WhatsApp] Forge API not configured, skipping order confirmation");
    return false;
  }

  try {
    const response = await fetch(`${config.FORGE_API_URL}/v1/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.FORGE_API_KEY}`,
      },
      body: JSON.stringify({
        to: formattedPhone,
        type: "text",
        text: {
          body: orderDetails,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`[WhatsApp] Failed to send order confirmation (${response.status})`);
      return false;
    }

    console.log(`[WhatsApp] Order confirmation sent to ${formattedPhone}`);
    return true;
  } catch (error) {
    console.error("[WhatsApp] Error sending order confirmation:", error);
    return false;
  }
}
