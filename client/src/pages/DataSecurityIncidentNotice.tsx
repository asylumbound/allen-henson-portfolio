/*
 * DESIGN: Cinematic Noir — Legal Notice
 * - Clean, readable legal-notice layout
 * - Max-width container for comfortable reading
 * - Matches existing typography and spacing
 */

import { motion } from "framer-motion";
import { useEffect } from "react";

export default function DataSecurityIncidentNotice() {
  useEffect(() => {
    document.title = "Data Security Incident Notice | Allen Henson Productions";
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
            Data Security Incident Notice
          </h1>
          <p className="text-base font-light text-foreground/80">
            Allen Henson Productions
          </p>
          <p className="text-base font-light text-foreground/80">
            Date: January 17, 2025
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
            Allen Henson Productions (&ldquo;AHP,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is providing notice of a data security incident that may have involved information stored on a shared server used in connection with our business operations.
          </p>

          {/* What Happened */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              What Happened
            </h2>
            <p className="mb-4">
              On or about January 17, 2025, AHP discovered that a shared physical server associated with our operations was compromised and physically removed from our premises (the &ldquo;Incident&rdquo;). Because we have lost positive control of the physical server, we cannot rule out the possibility that data stored on the server may have been accessed, acquired, or viewed by an unauthorized individual.
            </p>
            <p>
              At this time, we do not have confirmation that any internal data was accessed or exfiltrated. However, due to the server&rsquo;s removal and the resulting loss of custody, we are providing this notice out of an abundance of caution.
            </p>
          </div>

          {/* What Information May Be Involved */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              What Information May Be Involved
            </h2>
            <p className="mb-4">
              Depending on the specific services provided and the nature of the files stored, the server may have contained client information, which could include one or more of the following:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>Names and contact information (e.g., email address, phone number)</li>
              <li>Project-related materials, files, communications, and deliverables</li>
              <li>Digital media content, including photographs, video files, audio recordings, and related production assets (including edited and unedited content, drafts, exports, and associated metadata where applicable)</li>
              <li>Business records and related correspondence</li>
            </ul>
            <p className="mt-4">
              <strong>Important:</strong> We have not concluded that any particular individual&rsquo;s information was accessed. This notice is being provided because potential exposure is possible given the loss of physical control over the server.
            </p>
          </div>

          {/* What We Are Doing */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              What We Are Doing
            </h2>
            <p className="mb-4">
              Upon learning of the Incident, we took steps intended to contain and address it, including:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>Securing and reviewing associated systems and credentials where applicable</li>
              <li>Initiating an internal review to assess the scope of data potentially affected</li>
              <li>Implementing additional safeguards to reduce the risk of further unauthorized access</li>
            </ul>
            <p className="mt-4">
              We will continue to evaluate the situation and take additional actions as appropriate based on what we learn.
            </p>
          </div>

          {/* What You Can Do */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              What You Can Do
            </h2>
            <p className="mb-4">
              As a precaution, we recommend that clients and partners consider taking the following steps:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>Be alert for suspicious emails, messages, or requests for sensitive information</li>
              <li>Do not click unknown links or download unexpected attachments</li>
              <li>If you reuse passwords across services, consider changing passwords associated with accounts used to communicate with us</li>
              <li>Monitor accounts for unusual activity where applicable</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              Contact
            </h2>
            <p className="mb-2">
              If you have questions about this notice or believe your information may be affected, please contact us at:
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
              We regret any concern this Incident may cause and appreciate your understanding.
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
