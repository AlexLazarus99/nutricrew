/** Stripe payment adapter — disabled until STRIPE_SECRET_KEY is set. */
import { config } from "../../config.js";

export type CheckoutSession = {
  url: string | null;
  provider: "stripe" | "stars";
  enabled: boolean;
};

export function isStripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export async function createProCheckout(userId: number, locale: string): Promise<CheckoutSession> {
  if (!isStripeEnabled()) {
    return { url: null, provider: "stars", enabled: false };
  }
  // Stub: real Stripe Checkout.Session.create would go here
  const base = config.webappUrl ?? "https://nutricrew.app";
  return {
    url: `${base}/settings?pro=stripe&uid=${userId}&lang=${locale}`,
    provider: "stripe",
    enabled: true,
  };
}

export async function handleStripeWebhook(_body: unknown, _signature: string | undefined) {
  if (!isStripeEnabled()) {
    return { ok: false, error: "STRIPE_DISABLED" };
  }
  return { ok: true, processed: false, note: "webhook_stub" };
}
