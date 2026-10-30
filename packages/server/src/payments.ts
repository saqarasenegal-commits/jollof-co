/**
 * Payment providers. The app never talks to the bank directly: the server
 * creates the payment and the customer is sent to the provider's secure page.
 *
 * Only the sandbox exists today. To add the real gateway (SADAD, SkipCash or Tap),
 * write one class implementing PaymentProvider and select it in paymentProviderFromEnv.
 */
import type { PaymentMethod } from "@jollofco/core";

export interface PaymentRequest {
  orderId: string;
  orderNumber: string;
  amountQar: number;
  method: Exclude<PaymentMethod, "cash">;
}

export type PaymentResult =
  /** Paid immediately (sandbox, or a saved card). */
  | { status: "paid"; reference: string }
  /** The customer must finish on the provider's page; the provider calls our webhook after. */
  | { status: "redirect"; reference: string; url: string }
  | { status: "failed"; reason: string };

export interface PaymentProvider {
  readonly name: string;
  createPayment(req: PaymentRequest): Promise<PaymentResult>;
}

/** Accepts every payment without charging anything. For development and demos only. */
export class SandboxPayments implements PaymentProvider {
  readonly name = "sandbox";

  async createPayment(req: PaymentRequest): Promise<PaymentResult> {
    return { status: "paid", reference: `sandbox-${req.orderNumber}` };
  }
}

export function paymentProviderFromEnv(env: Record<string, string | undefined>): PaymentProvider {
  const name = env.PAYMENT_PROVIDER ?? "sandbox";
  if (name === "sandbox") return new SandboxPayments();
  throw new Error(`Unknown PAYMENT_PROVIDER "${name}". Only "sandbox" is available for now.`);
}
