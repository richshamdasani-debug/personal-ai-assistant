/**
 * WhatsApp channel — sends replies via Twilio's WhatsApp API.
 */

export class WhatsAppChannel {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
    this.authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
    this.fromNumber = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";
  }

  /**
   * Sends a WhatsApp message via Twilio.
   * `to` should be in the format "+15551234567" (without whatsapp: prefix).
   */
  async send(to: string, text: string): Promise<void> {
    if (!this.accountSid || !this.authToken) {
      console.warn("[WhatsApp] Twilio credentials not configured");
      return;
    }

    const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    const body = new URLSearchParams({
      From: this.fromNumber,
      To: toNumber,
      Body: text.slice(0, 1600), // WhatsApp/Twilio limit
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
        },
        body: body.toString(),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[WhatsApp] Twilio send failed:", err);
    }
  }
}
