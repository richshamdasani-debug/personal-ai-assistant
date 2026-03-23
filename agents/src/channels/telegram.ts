/**
 * Telegram channel — sends replies back to users via the Bot API.
 * Uses long polling in dev; webhook in production (set via API route).
 */

export class TelegramChannel {
  private token: string;
  private apiBase: string;

  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN ?? "";
    this.apiBase = `https://api.telegram.org/bot${this.token}`;
  }

  /**
   * Sends a text message to a Telegram chat.
   * Long messages are automatically split at 4096-char Telegram limit.
   */
  async send(chatId: string | number, text: string): Promise<void> {
    if (!this.token) {
      console.warn("[Telegram] No bot token configured");
      return;
    }

    // Split messages longer than Telegram's 4096 char limit
    const chunks = this.splitMessage(text, 4096);

    for (const chunk of chunks) {
      const res = await fetch(`${this.apiBase}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          parse_mode: "Markdown",
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`[Telegram] sendMessage failed:`, err);
      }
    }
  }

  /** Registers a webhook URL with Telegram (call once on deploy) */
  async setWebhook(url: string): Promise<void> {
    const res = await fetch(`${this.apiBase}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    console.log("[Telegram] setWebhook:", data);
  }

  private splitMessage(text: string, maxLen: number): string[] {
    if (text.length <= maxLen) return [text];
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      chunks.push(text.slice(start, start + maxLen));
      start += maxLen;
    }
    return chunks;
  }
}
