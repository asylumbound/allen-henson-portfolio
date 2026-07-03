/*
 * CHECKOUT SUCCESS PAGE
 * Displayed after successful Stripe payment
 */

import { Link, useSearch } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Package, Mail, ArrowRight, Tag } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { useEffect } from "react";

export default function CheckoutSuccess() {
  // Prevent search engine indexing of checkout success page
  useEffect(() => {
    // Add noindex meta tag
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);
    
    return () => {
      // Clean up on unmount
      document.head.removeChild(metaRobots);
    };
  }, []);

  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const sessionId = params.get("session_id");

  const { data: order, isLoading } = trpc.checkout.getOrder.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gold">Loading order details...</div>
      </div>
    );
  }

  // Calculate if discount was applied
  // The order object may have additional properties from Stripe API
  const orderWithExtras = order as typeof order & { discountAmount?: number; originalAmount?: number };
  const hasDiscount = orderWithExtras?.discountAmount && orderWithExtras.discountAmount > 0;
  const originalAmount = orderWithExtras?.originalAmount || order?.amount || 0;
  const amountPaid = order?.amount || 0;
  const discountAmount = orderWithExtras?.discountAmount || 0;

  return (
    <>
      <SEOHead
        title="Order Confirmed | Allen Henson"
        description="Thank you for your purchase"
        url="https://www.allenhenson.com/sales/success"
        type="website"
      />

      <div className="min-h-screen py-20 md:py-32">
        <div className="container max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Success Icon */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/10">
                <CheckCircle className="w-10 h-10 text-gold" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mb-4">
              Thank You for Your Order!
            </h1>

            <div className="w-16 h-px bg-gold mx-auto mb-8" />

            {order ? (
              <>
                {/* Order Details */}
                <div className="bg-secondary/30 rounded-lg p-6 md:p-8 mb-8 text-left">
                  <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-gold" />
                    Order Details
                  </h2>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Product:</span>
                      <span className="font-medium text-right max-w-[60%]">{order.productName}</span>
                    </div>
                    
                    {hasDiscount && (
                      <>
                        <div className="flex justify-between text-foreground/50">
                          <span>Original Price:</span>
                          <span className="line-through">
                            ${(originalAmount / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between text-green-500">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            Discount Applied:
                          </span>
                          <span>
                            -${(discountAmount / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </>
                    )}
                    
                    <div className="flex justify-between border-t border-border/30 pt-3">
                      <span className="text-foreground/60 font-medium">Amount Paid:</span>
                      <span className="font-semibold text-gold text-lg">
                        ${(amountPaid / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Status:</span>
                      <span className={`font-medium capitalize ${order.status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>
                        {order.status === 'paid' ? 'Confirmed' : order.status}
                      </span>
                    </div>
                    
                    {order.customerEmail && order.customerEmail !== "pending@checkout.com" && (
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Confirmation sent to:</span>
                        <span className="font-medium">{order.customerEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-foreground/80 mb-8">
                Your payment has been processed successfully. You will receive a confirmation email shortly.
              </p>
            )}

            {/* What's Next */}
            <div className="text-left bg-secondary/20 rounded-lg p-6 md:p-8 mb-8">
              <h3 className="text-lg font-medium mb-4">What Happens Next?</h3>
              <ul className="space-y-3 text-sm text-foreground/80">
                <li className="flex items-start gap-3">
                  <span className="text-gold font-medium">1.</span>
                  <span>You'll receive an order confirmation email with your receipt.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold font-medium">2.</span>
                  <span>For prints, Allen will personally prepare your order with care.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold font-medium">3.</span>
                  <span>You'll receive a shipping notification once your order is on its way.</span>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <p className="text-sm text-foreground/60 mb-8">
              Questions about your order?{" "}
              <a
                href="mailto:allen@allenhenson.com"
                className="text-gold hover:underline inline-flex items-center gap-1"
              >
                <Mail className="w-3 h-3" />
                allen@allenhenson.com
              </a>
            </p>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sales"
                className="inline-flex items-center gap-2 px-8 py-3 border border-foreground/30 text-foreground nav-text hover:border-gold hover:text-gold cinematic-transition"
              >
                CONTINUE SHOPPING
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-background font-semibold tracking-[0.02em] text-base hover:bg-gold/90 cinematic-transition"
              >
                BACK TO HOME
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
