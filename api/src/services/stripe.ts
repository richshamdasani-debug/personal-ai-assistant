import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
  typescript: true,
});

export const PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER ?? "",
  pro: process.env.STRIPE_PRICE_PRO ?? "",
  max: process.env.STRIPE_PRICE_MAX ?? "",
};

/**
 * Creates a Stripe Checkout session for the given plan.
 * Returns the URL to redirect the user to.
 */
export async function createCheckoutSession({
  userId,
  email,
  plan,
  trialDays = 7,
}: {
  userId: string;
  email: string;
  plan: "starter" | "pro" | "max";
  trialDays?: number;
}): Promise<string> {
  const priceId = PRICE_IDS[plan];
  if (!priceId) throw new Error(`No price ID configured for plan: ${plan}`);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: trialDays },
    metadata: { userId, plan },
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?checkout=cancelled`,
  });

  return session.url!;
}
