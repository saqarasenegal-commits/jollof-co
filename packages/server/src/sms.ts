/**
 * SMS / WhatsApp messages to customers. Same pattern as payments: one interface,
 * a console implementation for development, the real provider added later.
 */
export interface MessageProvider {
  readonly name: string;
  /** `phone` is an 8-digit Qatar mobile. */
  send(phone: string, text: string): Promise<void>;
}

/** Prints messages instead of sending them. */
export class ConsoleMessages implements MessageProvider {
  readonly name = "console";
  readonly sent: Array<{ phone: string; text: string }> = [];

  async send(phone: string, text: string): Promise<void> {
    this.sent.push({ phone, text });
    console.info(`[sms to +974${phone}] ${text}`);
  }
}

export function messageProviderFromEnv(env: Record<string, string | undefined>): MessageProvider {
  const name = env.SMS_PROVIDER ?? "console";
  if (name === "console") return new ConsoleMessages();
  throw new Error(`Unknown SMS_PROVIDER "${name}". Only "console" is available for now.`);
}
