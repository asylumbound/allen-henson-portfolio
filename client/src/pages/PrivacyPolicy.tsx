/*
 * DESIGN: Cinematic Noir — Legal Page
 * - Clean, readable legal-notice layout
 * - Max-width container for comfortable reading
 * - Matches existing typography and spacing
 */

import { motion } from "framer-motion";
import { useEffect } from "react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy | Allen Henson Productions";
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
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-base font-light text-foreground/80">
            Allen Henson Productions
          </p>
          <p className="text-base font-light text-foreground/80">
            Effective Date: February 15, 2026
          </p>
          <div className="w-16 h-px bg-gold mt-8" />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8 text-base font-light leading-relaxed text-foreground/85"
        >
          <p>
            Allen Henson Productions (&ldquo;AHP,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at{" "}
            <a href="https://www.allenhenson.com" className="text-gold hover:text-gold/80 cinematic-transition">
              allenhenson.com
            </a>{" "}
            (the &ldquo;Site&rdquo;), purchase products, or engage our services.
          </p>

          {/* Information We Collect */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              1. Information We Collect
            </h2>

            <h3 className="text-lg font-medium mb-3 text-foreground/90">
              Information You Provide Directly
            </h3>
            <p className="mb-4">
              We may collect personal information that you voluntarily provide when you:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2 mb-6">
              <li>Submit a contact form or inquiry</li>
              <li>Purchase prints, books, or other products through our shop</li>
              <li>Subscribe to our newsletter or mailing list</li>
              <li>Engage us for photography, film, or creative services</li>
              <li>Create an account on our Site</li>
            </ul>
            <p className="mb-4">
              This information may include your name, email address, phone number, mailing address, payment information, and any other details you choose to provide.
            </p>

            <h3 className="text-lg font-medium mb-3 text-foreground/90">
              Information Collected Automatically
            </h3>
            <p className="mb-4">
              When you visit our Site, we may automatically collect certain information, including:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>IP address and approximate geographic location</li>
              <li>Browser type, operating system, and device information</li>
              <li>Pages viewed, time spent on pages, and navigation paths</li>
              <li>Referring website or search terms that led you to our Site</li>
            </ul>
          </div>

          {/* How We Use Your Information */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              2. How We Use Your Information
            </h2>
            <p className="mb-4">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>To process and fulfill orders, including shipping and payment processing</li>
              <li>To respond to inquiries, comments, and requests</li>
              <li>To provide, maintain, and improve our Site and services</li>
              <li>To send promotional communications, where you have opted in to receive them</li>
              <li>To detect, prevent, and address technical issues or fraudulent activity</li>
              <li>To comply with legal obligations and enforce our terms</li>
            </ul>
          </div>

          {/* Payment Processing */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              3. Payment Processing
            </h2>
            <p>
              All payment transactions are processed through Stripe, a third-party payment processor. We do not store your full credit card number, expiration date, or CVV on our servers. Stripe&rsquo;s use of your personal information is governed by their{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:text-gold/80 cinematic-transition"
              >
                Privacy Policy
              </a>
              . We retain only a transaction reference identifier for order fulfillment and record-keeping purposes.
            </p>
          </div>

          {/* Sharing of Information */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              4. Sharing of Information
            </h2>
            <p className="mb-4">
              We do not sell, rent, or trade your personal information to third parties. We may share your information in the following limited circumstances:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li><strong>Service Providers:</strong> We may share information with trusted third-party vendors who assist us with payment processing, shipping, email delivery, analytics, and website hosting. These providers are contractually obligated to protect your information and use it only for the services they provide to us.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law, or in response to valid requests by public authorities (e.g., a court order or government agency).</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of all or a portion of our assets, your personal information may be transferred as part of that transaction.</li>
            </ul>
          </div>

          {/* Cookies and Tracking */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              5. Cookies and Tracking Technologies
            </h2>
            <p className="mb-4">
              Our Site may use cookies and similar tracking technologies to enhance your experience. Cookies are small data files stored on your device that help us remember your preferences and understand how you interact with our Site.
            </p>
            <p>
              You can control cookie preferences through your browser settings. Disabling cookies may affect certain features of the Site.
            </p>
          </div>

          {/* Data Retention */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              6. Data Retention
            </h2>
            <p>
              We retain your personal information only for as long as necessary to fulfill the purposes described in this Privacy Policy, unless a longer retention period is required or permitted by law. Order and transaction records are retained for accounting and legal compliance purposes.
            </p>
          </div>

          {/* Your Rights */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              7. Your Rights
            </h2>
            <p className="mb-4">
              Depending on your jurisdiction, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
              <li><strong>Correction:</strong> Request that we correct inaccurate or incomplete information.</li>
              <li><strong>Deletion:</strong> Request that we delete your personal information, subject to certain exceptions.</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time by using the unsubscribe link in our emails or by contacting us directly.</li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, please contact us using the information provided below.
            </p>
          </div>

          {/* Third-Party Links */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              8. Third-Party Links
            </h2>
            <p>
              Our Site may contain links to third-party websites, including social media platforms and partner sites. We are not responsible for the privacy practices or content of those sites. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </div>

          {/* Children's Privacy */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              9. Children&rsquo;s Privacy
            </h2>
            <p>
              Our Site and services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child under 18, we will take steps to delete that information promptly.
            </p>
          </div>

          {/* Security */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              10. Security
            </h2>
            <p>
              We implement reasonable administrative, technical, and physical safeguards to protect your personal information from unauthorized access, use, or disclosure. However, no method of transmission over the Internet or electronic storage is completely secure, and we cannot guarantee absolute security.
            </p>
          </div>

          {/* Changes to This Policy */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              11. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date. We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              12. Contact Us
            </h2>
            <p className="mb-2">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
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
              <Link href="/terms-of-service" className="text-gold hover:text-gold/80 cinematic-transition">
                Terms of Service
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
