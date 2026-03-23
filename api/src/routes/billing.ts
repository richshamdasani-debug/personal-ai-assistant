import { Router } from "express";
import { z } from "zod";
import { stripe, createCheckoutSession } from "../services/stripe.js";
import { supabase } from "../services/supabase.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import {
  provisionAgent,
  suspendAgent,
  teardownAgent,
} from "../services/agentProvisioner.js";

export const billingRouter = Router();

// POST /api/billing/checkout — creates a Stripe Checkout session
billingRouter.post("/checkout", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;

  const parsed = z
    .object({ plan: z.enum(["starter", "pro", "max"]) })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }

  const { data: user } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const url = await createCheckoutSession({
    userId,
    email: user.email,
    plan: parsed.data.plan,
  });

  res.json({ url });
});

// POST /api/webhooks/stripe — raw body handler (mounted in index.ts)
export const stripeWebhookHandler = async (
  req: { body: Buffer; headers: Record<string, string | string[] | undefined> },
  res: { status: (n: number) => { json: (d: unknown) => void } }
) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe webhook] Invalid signature:", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;

      if (userId && plan) {
        await supabase
          .from("users")
          .update({ plan, stripe_customer_id: session.customer })
          .eq("id", userId);

        await provisionAgent(userId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("stripe_customer_id", sub.customer)
        .single();

      if (user) {
        await supabase
          .from("users")
          .update({ plan: "cancelled" })
          .eq("id", user.id);
        await teardownAgent(user.id);
      }
      break;
    }

    case "customer.subscription.paused": {
      const sub = event.data.object;
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("stripe_customer_id", sub.customer)
        .single();

      if (user) await suspendAgent(user.id);
      break;
    }
  }

  return res.status(200).json({ received: true });
};
