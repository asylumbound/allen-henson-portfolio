/*
 * DESIGN: Cinematic Noir
 * - Elegant contact form
 * - Split layout with info and form
 * - Gold accents for interactive elements
 * - Minimal, focused design
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Send, Instagram, Mail, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const submitContact = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success("Message sent successfully! I'll get back to you soon.");
      setFormData({ name: "", email: "", message: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    submitContact.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen py-12 md:py-20">
      <div className="container">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-24"
        >
          <p className="text-xs tracking-wide-cinematic text-gold font-light mb-4">
            LET'S CONNECT
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Contact Me
          </h1>
          <div className="w-16 h-px bg-gold mx-auto mb-6" />
          <p className="max-w-xl mx-auto text-base font-light leading-relaxed text-muted-foreground">
            Ready to bring your vision to life? Whether it's a commercial campaign, 
            editorial shoot, or creative collaboration, I'd love to hear from you.
          </p>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 max-w-5xl mx-auto">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="space-y-10">
              {/* Email */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Mail className="w-5 h-5 text-gold" />
                  <p className="text-xs tracking-wide-cinematic text-gold font-light">
                    EMAIL
                  </p>
                </div>
                <a
                  href="mailto:contact@allenhenson.la"
                  className="text-lg font-light text-foreground hover:text-gold cinematic-transition gold-underline"
                >
                  contact@allenhenson.la
                </a>
              </div>

              {/* Locations */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-gold" />
                  <p className="text-xs tracking-wide-cinematic text-gold font-light">
                    LOCATIONS
                  </p>
                </div>
                <div className="space-y-2 text-lg font-light text-foreground/80">
                  <p>Los Angeles, CA</p>
                  <p>New York, NY</p>
                  <p>Berlin, Germany</p>
                </div>
              </div>

              {/* Social */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Instagram className="w-5 h-5 text-gold" />
                  <p className="text-xs tracking-wide-cinematic text-gold font-light">
                    SOCIAL
                  </p>
                </div>
                <a
                  href="https://www.instagram.com/allenhenson"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-light text-foreground hover:text-gold cinematic-transition gold-underline"
                >
                  @allenhenson
                </a>
              </div>

              {/* Availability */}
              <div className="pt-6 border-t border-border">
                <p className="text-sm font-light text-muted-foreground leading-relaxed">
                  Currently accepting projects for Q2 2026 and beyond. 
                  For urgent inquiries, please indicate timeline in your message.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs tracking-wide-cinematic text-muted-foreground font-light mb-3"
                >
                  NAME
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-b border-border py-3 text-foreground font-light focus:border-gold focus:outline-none cinematic-transition placeholder:text-muted-foreground/50"
                  placeholder="Your name"
                />
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs tracking-wide-cinematic text-muted-foreground font-light mb-3"
                >
                  EMAIL
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-b border-border py-3 text-foreground font-light focus:border-gold focus:outline-none cinematic-transition placeholder:text-muted-foreground/50"
                  placeholder="your@email.com"
                />
              </div>

              {/* Message Field */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-xs tracking-wide-cinematic text-muted-foreground font-light mb-3"
                >
                  MESSAGE
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full bg-transparent border-b border-border py-3 text-foreground font-light focus:border-gold focus:outline-none cinematic-transition resize-none placeholder:text-muted-foreground/50"
                  placeholder="Tell me about your project..."
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitContact.isPending}
                  className="group flex items-center gap-3 px-8 py-3 bg-gold text-background font-medium tracking-cinematic text-sm hover:bg-gold/90 cinematic-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitContact.isPending ? (
                    "SENDING..."
                  ) : (
                    <>
                      SEND MESSAGE
                      <Send className="w-4 h-4 group-hover:translate-x-1 cinematic-transition" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
