import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase";

// Required: tell Next.js not to parse the body so we can verify Stripe's signature
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[Stripe webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[Stripe webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier;

        if (userId && tier) {
          await supabase
            .from("users")
            .update({
              subscription_tier: tier,
              subscription_status: "active",
              stripe_customer_id: session.customer as string,
            })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;

        if (userId) {
          const status =
            sub.status === "active"
              ? "active"
              : sub.status === "trialing"
                ? "trialing"
                : sub.status === "paused"
                  ? "paused"
                  : "inactive";

          await supabase
            .from("users")
            .update({ subscription_status: status })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        // Look up user by customer ID (webhook may not have userId metadata if sub was managed externally)
        const userId = sub.metadata?.userId;
        let targetUserId = userId;

        if (!targetUserId) {
          const { data: user } = await supabase
            .from("users")
            .select("id")
            .eq("stripe_customer_id", sub.customer as string)
            .single();
          targetUserId = user?.id;
        }

        if (targetUserId) {
          await supabase
            .from("users")
            .update({ subscription_status: "cancelled", subscription_tier: null })
            .eq("id", targetUserId);

          await supabase
            .from("agents")
            .update({ status: "deprovisioned" })
            .eq("user_id", targetUserId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (user) {
          await supabase
            .from("users")
            .update({ subscription_status: "past_due" })
            .eq("id", user.id);
        }
        break;
      }
    }
  } catch (err) {
    console.error("[Stripe webhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
