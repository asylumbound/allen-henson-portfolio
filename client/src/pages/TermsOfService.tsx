/*
 * DESIGN: Cinematic Noir — Legal Page
 * - Clean, readable legal-notice layout
 * - Max-width container for comfortable reading
 * - Matches existing typography and spacing
 */

import { motion } from "framer-motion";
import { useEffect } from "react";
import { Link } from "wouter";

export default function TermsOfService() {
  useEffect(() => {
    document.title = "Terms of Service | Allen Henson Productions";
  }, []);

  return (
    <div className="min-h-screen py-12 md:py-20">
      <div className="container max-w-3xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mb-4">
            Terms of Service
          </h1>
          <p className="text-base font-normal text-foreground/80">
            Allen Henson Productions
          </p>
          <p className="text-base font-normal text-foreground/80">
            Effective Date: February 15, 2026
          </p>
          <div className="w-16 h-px bg-gold mt-8" />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8 text-base font-normal leading-relaxed text-foreground/85"
        >
          <p>
            Welcome to the website of Allen Henson Productions (&ldquo;AHP,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). By accessing or using our website at{" "}
            <a href="https://www.allenhenson.com" className="text-gold hover:text-gold/80 cinematic-transition">
              allenhenson.com
            </a>{" "}
            (the &ldquo;Site&rdquo;), purchasing products, or engaging our services, you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, please do not use the Site.
          </p>

          {/* Use of the Site */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] mb-4">
              1. Use of the Site
            </h2>
            <p className="mb-4">
              You may use the Site for lawful purposes only. You agree not to:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>Use the Site in any way that violates applicable local, state, national, or international law</li>
              <li>Attempt to gain unauthorized access to any portion of the Site, other accounts, or computer systems</li>
              <li>Interfere with or disrupt the integrity or performance of the Site</li>
              <li>Use any automated system, including bots, crawlers, or scrapers, to access the Site without our express written permission</li>
              <li>Reproduce, distribute, modify, or create derivative works from any content on the Site without prior written authorization</li>
            </ul>
          </div>

          {/* Intellectual Property */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] mb-4">
              2. Intellectual Property
            </h2>
            <p className="mb-4">
              All content on this Site — including but not limited to photographs, videos, text, graphics, logos, designs, and other creative works — is the exclusive property of Allen Henson Productions or its licensors and is protected by United States and international copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mb-4">
              <strong>You may not</strong> copy, reproduce, distribute, display, transmit, modify, create derivative works from, sell, or license any content from this Site without the express prior written consent of Allen Henson Productions. Unauthorized use of any content may violate copyright, trademark, and other applicable laws and could result in criminal or civil penalties.
            </p>
            <p>
              Limited, non-commercial use of content for personal reference (such as saving an image for inspiration) is permitted, provided that no content is republished, shared publicly, or used in any commercial context without written authorization.
            </p>
          </div>

          {/* Purchases and Orders */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] mb-4">
              3. Purchases and Orders
            </h2>
            <p className="mb-4">
              When you purchase prints, books, or other products through our Site, you agree to provide accurate and complete payment and shipping information. All prices are listed in U.S. dollars unless otherwise stated.
            </p>
            <p className="mb-4">
              We reserve the right to refuse or cancel any order for any reason, including but not limited to product availability, errors in pricing or product descriptions, or suspected fraudulent activity. If your order is canceled after payment has been processed, we will issue a full refund to your original payment method.
            </p>
            <p>
              Payment processing is handled by Stripe. By completing a purchase, you also agree to Stripe&rsquo;s{" "}
              <a
                href="https://stripe.com/legal/consumer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:text-gold/80 cinematic-transition"
              >
                Terms of Service
              </a>.
            </p>
          </div>

          {/* Shipping and Delivery */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] mb-4">
              4. Shipping and Delivery
            </h2>
            <p className="mb-4">
              Shipping times and costs vary depending on the product and destination. Estimated delivery times are provided at checkout but are not guaranteed. AHP is not responsible for delays caused by shipping carriers, customs, or other factors beyond our control.
            </p>
            <p>
              Risk of loss and title for items purchased pass to you upon delivery to the carrier.
            </p>
          </div>

          {/* Returns and Refunds */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] mb-4">
              5. Returns and Refunds
            </h2>
            <p className="mb-4">
              Due to the nature of fine art prints and limited-edition products, all sales are final unless the item arrives damaged or defective. If you receive a damaged or defective item, please contact us within 14 days of delivery at{" "}
              <a
                href="mailto:support@allenhenson.com"
                className="text-gold hover:text-gold/80 cinematic-transition"
              >
                support@allenhenson.com
              </a>{" "}
              with photographs of the damage. We will arrange a replacement or refund at our discretion.
            </p>
          </div>

          {/* Creative Services */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] mb-4">
              6. Creative Services
            </h2>
            <p className="mb-4">
              Photography, film direction, and other creative services offered by AHP are subject to separate agreements between AHP and the client. These Terms govern use of the Site only. For service-specific terms, including licensing, deliverables, cancellation, and payment schedules, please refer to the applicable service agreement or contact us directly.
            </p>
          </div>

          {/* User Content */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] mb-4">
              7. User Content
            </h2>
            <p>
              If you submit any content to us through the Site (such as messages via the contact form), you grant AHP a non-exclusive, royalty-free, worldwide license to use, reproduce, and display such content solely for the purpose of responding to your inquiry or providing the requested services. You represent that you have the right to submit any content you provide and that it does not infringe on the rights of any third party.
            </p>
          </div>

          {/* Disclaimer of Warranties */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] mb-4">
              8. Disclaimer of Warranties
            </h2>
            <p>
              The Site and all content, products, and services provided through it are offered on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. AHP does not warrant that the Site will be uninterrupted, error-free, or free of viruses or other harmful components.
            </p>
          </div>

          {/* Limitation of Liability */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] mb-4">
              9. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by applicable law, Allen Henson Productions and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising out of or related to your use of the Site, purchase of products, or engagement of services, regardless of the theory of liability. Our total liability for any claim arising under these Terms shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.
            </p>
          </div>

          {/* Indemnification */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] mb-4">
              10. Indemnification
            </h2>
            <p>
              You agree to indemnify, defend, and hold harmless Allen Henson Productions and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys&rsquo; fees) arising out of or in any way connected with your use of the Site, your violation of these Terms, or your violation of any rights of a third party.
            </p>
          </div>

          {/* Governing Law */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] mb-4">
              11. Governing Law
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in Los Angeles County, California.
            </p>
          </div>

          {/* Changes to These Terms */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] mb-4">
              12. Changes to These Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated effective date. Your continued use of the Site after any changes constitutes your acceptance of the revised Terms.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] mb-4">
              13. Contact Us
            </h2>
            <p className="mb-2">
              If you have questions about these Terms, please contact us at:
            </p>
            <p>
              Email:{" "}
              <a
                href="mailto:support@allenhenson.com"
                className="text-gold hover:text-gold/80 cinematic-transition"
              >
                support@allenhenson.com
              </a>
            </p>
            <p>
              Phone:{" "}
              <a
                href="tel:+19176198852"
                className="text-gold hover:text-gold/80 cinematic-transition"
              >
                +1.917.619.8852
              </a>
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <p>
              See also our{" "}
              <Link href="/privacy-policy" className="text-gold hover:text-gold/80 cinematic-transition">
                Privacy Policy
              </Link>.
            </p>
            <p className="mt-4 text-gold font-normal">
              Allen Henson Productions
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
