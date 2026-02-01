/**
 * Stripe Checkout Integration
 * Handles creating checkout sessions and processing webhooks
 */

import Stripe from "stripe";
import { Router, Request, Response } from "express";
import { getDb } from "./db";
import { orders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover",
});

// Product price mapping (slug -> Stripe price in cents)
// These should match the products in Sales.tsx
export const productPrices: Record<string, { price: number; name: string }> = {
  "editorial-on-the-run": { price: 5000, name: "Editorial on the Run - The Book" },
  "editorial-on-the-rocks": { price: 5000, name: "Editorial on the Rocks" },
  "abscond-boxset": { price: 30000, name: "ABSCOND Box Set Vol. I-VI" },
  "abscond-series": { price: 15000, name: "ABSCOND: The Series (Presale)" },
  "abscond-vol1-france": { price: 5000, name: "ABSCOND Vol. I: France" },
  "abscond-vol2-morocco": { price: 5000, name: "ABSCOND Vol. II: Morocco" },
  "abscond-vol3-greece": { price: 5000, name: "ABSCOND Vol. III: Greece" },
  "abscond-vol4-italy": { price: 5000, name: "ABSCOND Vol. IV: Italy" },
  "abscond-vol5-brazil": { price: 5000, name: "ABSCOND Vol. V: Brazil" },
  "abscond-vol6-colombia": { price: 5000, name: "ABSCOND Vol. VI: Colombia" },
  // Limited Edition Prints
  "tour-de-eiffel": { price: 269000, name: "Tour de Eiffel - Limited Edition Print" },
  "il-pantheon": { price: 269000, name: "Il Pantheon a Mezzanotte - Limited Edition Print" },
  "sarah-in-london": { price: 269000, name: "Sarah in London - Limited Edition Print" },
  "knight-of-bordeaux": { price: 269000, name: "A Knight of Bordeaux - Limited Edition Print" },
  "chanel-in-paris": { price: 269000, name: "Chanel in Paris - Limited Edition Print" },
  "sarah-in-rome": { price: 269000, name: "Sarah in Rome - Limited Edition Print" },
  "sarah-in-paris": { price: 269000, name: "Sarah in Paris - Limited Edition Print" },
  "sarah-in-prague": { price: 269000, name: "Sarah in Prague - Limited Edition Print" },
  "sarah-in-budapest": { price: 269000, name: "Sarah in Budapest - Limited Edition Print" },
  "sarah-in-barcelona": { price: 269000, name: "Sarah in Barcelona - Limited Edition Print" },
  "sarah-in-athens": { price: 269000, name: "Sarah in Athens - Limited Edition Print" },
  "sarah-in-thessaloniki": { price: 269000, name: "Sarah in Thessaloniki - Limited Edition Print" },
  "sarah-in-marrakech": { price: 269000, name: "Sarah in Marrakech - Limited Edition Print" },
  "sarah-in-tangier": { price: 269000, name: "Sarah in Tangier - Limited Edition Print" },
  "sarah-in-sao-paulo": { price: 269000, name: "Sarah in São Paulo - Limited Edition Print" },
  "sarah-in-medellin": { price: 269000, name: "Sarah in Medellín - Limited Edition Print" },
  "sarah-in-new-york": { price: 269000, name: "Sarah in New York - Limited Edition Print" },
  "sarah-in-miami": { price: 269000, name: "Sarah in Miami - Limited Edition Print" },
  "sarah-in-los-angeles": { price: 269000, name: "Sarah in Los Angeles - Limited Edition Print" },
  "sarah-in-buenos-aires": { price: 269000, name: "Sarah in Buenos Aires - Limited Edition Print" },
};

// Create Express router for Stripe endpoints
export const stripeRouter = Router();

// Webhook endpoint - must use raw body for signature verification
stripeRouter.post(
  "/webhook",
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle test events
    if (event.id.startsWith("evt_test_")) {
      console.log("[Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    // Handle checkout session completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      try {
        // Update order status to paid
        const db = await getDb();
        if (db) {
          await db
            .update(orders)
            .set({ 
              status: "paid",
              stripePaymentIntentId: session.payment_intent as string,
            })
            .where(eq(orders.stripeSessionId, session.id));
        }

        console.log(`[Stripe Webhook] Order ${session.id} marked as paid`);
      } catch (error) {
        console.error("[Stripe Webhook] Error updating order:", error);
      }
    }

    // Handle payment intent succeeded
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`);
    }

    res.json({ received: true });
  }
);

// Create checkout session endpoint
export async function createCheckoutSession(
  productSlug: string,
  customerEmail?: string,
  customerName?: string,
  userId?: number,
  origin?: string
): Promise<{ url: string; sessionId: string }> {
  const product = productPrices[productSlug];
  
  if (!product) {
    throw new Error(`Product not found: ${productSlug}`);
  }

  const baseUrl = origin || "https://www.allenhenson.com";

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: `Purchase of ${product.name} from Allen Henson Productions`,
          },
          unit_amount: product.price,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${baseUrl}/sales/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/sales/${productSlug}`,
    customer_email: customerEmail,
    allow_promotion_codes: true,
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "DE", "FR", "IT", "ES", "AU", "NL", "BE", "AT", "CH"],
    },
    metadata: {
      product_slug: productSlug,
      user_id: userId?.toString() || "",
      customer_name: customerName || "",
    },
    client_reference_id: userId?.toString(),
  });

  // Create order record in database
  const db = await getDb();
  if (db) {
    await db.insert(orders).values({
    userId: userId || null,
    stripeSessionId: session.id,
    customerEmail: customerEmail || "pending@checkout.com",
    customerName: customerName || null,
    productSlug: productSlug,
    productName: product.name,
    amount: product.price,
    currency: "usd",
      status: "pending",
    });
  }

  return {
    url: session.url!,
    sessionId: session.id,
  };
}

// Get order by session ID
export async function getOrderBySessionId(sessionId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeSessionId, sessionId))
    .limit(1);
  
  return result[0] || null;
}
