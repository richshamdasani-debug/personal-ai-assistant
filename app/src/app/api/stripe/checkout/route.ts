import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { stripe, PRICE_IDS } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as Record<string, unknown> | undefined)
    ?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { tier?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const tier = body.tier;
  if (!tier || !PRICE_IDS[tier]) {
    return NextResponse.json(
      { error: "Invalid tier. Must be one of: starter, pro, max" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Fetch or create Stripe customer
  const { data: user } = await supabase
    .from("users")
    .select("stripe_customer_id, email")
    .eq("id", userId)
    .single();

  let customerId = user?.stripe_customer_id as string | null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: (user?.email ?? session.user?.email) as string,
      metadata: { userId },
    });
    customerId = customer.id;
    await supabase
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId);
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: PRICE_IDS[tier], quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId, tier },
    },
    metadata: { userId, tier },
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?checkout=cancelled`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
