# Allen Henson Portfolio - TODO

## Completed Features
- [x] Cinematic Noir design with Mont Blanc font
- [x] Light/dark mode toggle
- [x] Home page with hero video background
- [x] Photos page with 170 portfolio images in masonry gallery
- [x] Journal page with 167 personal/behind-the-scenes images
- [x] Video page with reel player
- [x] About page with biography
- [x] Contact page with form
- [x] Image optimization (296MB → 139MB for photos, 128MB → 118MB for journal)
- [x] Native browser lazy loading
- [x] Lightbox viewer with keyboard navigation
- [x] Scrolling city ticker marquee
- [x] Film grain overlay effect
- [x] Upgrade to full-stack with database support
- [x] Password-protected admin panel at /edit
- [x] Admin authentication API
- [x] Gallery order API (get/save)
- [x] Database schema for image orders
- [x] Unit tests for gallery API

## In Progress
- [ ] Drag-and-drop image reordering UI in Edit page (basic UI complete, needs testing)
- [x] Update Photos page to use saved order from database
- [x] Update Journal page to use saved order from database

## Future Enhancements
- [ ] Allow admin to set custom password via environment variable

- [x] Swap About page image with new photo

- [x] Create blog section with 20 essays on AI and cinematography
- [x] Add blog listing page at /blog
- [x] Add individual blog post pages
- [x] Add blog to navigation
- [x] Select appropriate hero image for blog

- [x] Add social media sharing buttons to blog posts (Twitter, LinkedIn, Facebook, Email, Copy Link)
- [x] Add Open Graph meta tags to blog posts for social media previews
- [x] Fix blog thumbnail and header image cropping to show faces (object-position: top)
- [x] Create /sales section based on editorialontherun.com
- [x] Download and incorporate images from editorialontherun.com
- [x] Replicate text content and product descriptions
- [x] Add purchase/checkout functionality (links to Big Cartel)
- [x] Add Sales to navigation
- [x] Check page load time performance
- [x] Verify full product catalog from editorialontherun.com (24 products)
- [x] Remove all Big Cartel references
- [x] Update purchase buttons to email contact (allen@allenhenson.com)
- [ ] Add all images for each product (image gallery on product detail pages) - deferred

- [x] Audit all 4 product pages from editorialontherun.com (81 products total)
- [x] Download complete product catalog (all pages)
- [x] Add pagination to Sales page (4 pages, 24 products per page)
- [x] Update sold out badges to gold/yellow theme

- [x] Add multi-image galleries for each product
- [x] Scrape all product pages for additional images (352 images from 80 products)
- [x] Download all product gallery images
- [x] Update ProductDetail page with image carousel

- [x] Integrate Stripe for direct checkout
- [x] Add Stripe feature to project
- [x] Configure Stripe products and checkout flow (81 products mapped)
- [x] Update ProductDetail page with Stripe checkout button (BUY NOW)
- [x] Create checkout success page at /sales/success
- [x] Add orders table to database schema
- [x] Create Stripe webhook handler for payment events
- [ ] Test checkout flow with live Stripe account (requires user to claim sandbox)

- [x] Deep assessment of /sales pages
- [x] Create comprehensive site map of /sales segment (docs/sales-sitemap.md)
- [x] Fix all "Product Not Found" errors - added 57 missing products to ProductDetail.tsx
- [x] Ensure slug consistency across Sales.tsx, ProductDetail.tsx, and stripe.ts (81 products synced)
- [x] Test all 81 product pages

- [x] Analyze original site for product variants and pricing structure
- [x] Create comprehensive product spreadsheet (docs/Allen_Henson_Products.xlsx - 81 products with variants, descriptions, assets, pricing)
- [x] Implement variant dropdown system with dynamic pricing on ProductDetail page (21 products with size variants)
- [x] Fix image cropping issues on product pages (changed to object-contain, aspect-ratio 3:4)
- [x] Add proper file extensions to 57 product images missing extensions (.webp, .jpg)

- [x] Create product photography portfolio page at /product-photography
- [x] Generate 10 Watches & Jewelry product images
- [x] Generate 10 Automotive product images
- [x] Generate 10 Spirits/Alcohol product images
- [x] Generate 10 Soda/Beverages product images

- [x] Run site-wide load time analysis (docs/site-audit-report.md)
- [x] Audit responsiveness across mobile, tablet, desktop (all breakpoints pass)
- [x] Optimize product photography images (219MB → 11MB, 95% reduction)
- [x] Remove AI generation metadata from all 40 product images
- [x] Convert product images to WebP format for web performance

- [x] Remove "and the quiet revolution of AI. Hunter Thompson meets the Queen's English." from Journal/Blog page
- [x] Implement lazy loading for all below-fold images site-wide (already implemented on most, added to ImageGallery thumbnails)
- [x] Convert and optimize /sales images to WebP format (72MB → 51MB, 29% reduction)

- [x] Implement responsive image srcset for faster mobile loading
- [x] Create reusable ResponsiveImage component with srcset support
- [x] Generate multiple image sizes (400w, 800w, 1200w) for product images (40 product + 59 sales = 99 images)
- [x] Update Sales, ProductDetail, and ProductPhotography pages to use srcset
- [x] Test responsive images across mobile, tablet, and desktop viewports (40 images with srcset verified)

- [x] Update homepage "A Witness to Light" section with hero image from About page (allen-about-hero.webp)

- [x] Create admin-protected edit page with password authentication (already exists at /edit)
- [x] Implement drag-and-drop image reordering UI on edit page (Photos and Journal galleries)
- [x] Test and verify contact form functionality (now sends notifications to owner)
- [x] Test and verify Stripe checkout flow (redirects to Stripe checkout successfully)

- [x] Create branded 404 page matching cinematic noir aesthetic (camera icon, film strip motif, gold accents)

- [x] Add image upload functionality to /edit admin page (S3 storage with base64 encoding)
- [x] Add image delete functionality to /edit admin page (removes from gallery order)
- [x] Create backend API endpoints for upload and delete (gallery.uploadImage, gallery.deleteImage)
- [x] Update Edit page UI with upload dropzone and delete buttons (green upload button, red trash icons)

- [ ] Configure Stripe with allen@allenhenson.com account
- [ ] Test Stripe checkout flow functionality
- [ ] Verify webhook configuration and order processing

- [x] Fix coupon code input to allow lowercase characters (handled by Stripe - use uppercase code)
- [x] Audit codebase for bloat and unused code
- [x] Analyze bundle size and dependencies
- [x] Remove hardcoded Stripe keys (use platform env vars)
- [x] Optimize and remove unnecessary code (removed streamdown, deleted unused components)

- [x] Add Rolex watch image to product photography page (web optimized)
- [x] Verify all product images are properly assigned in product detail galleries (reference editorialontherun.com)

- [x] Re-render ABSCOND box set with photorealistic AI images (library desk, marble flat lay, stacked volumes)

- [x] Generate 10 Tech/Fashion/Consumer Icons product images (Apple iPhone, Leica, Sony, B&O, Nike, Adidas, Ray-Ban, LV, Aesop, Dyson)

- [x] Update ProductPhotography page to show uncropped full images (no cropping)
- [x] Shuffle product images to mix categories together (not batched)
- [x] Add zoom-on-hover feature for all product images
- [x] Create password-protected /product_edit admin page (password: &&77VAnguard)

- [x] Fix product_edit page to save image order to database (password validation fixed, loads saved order on page load)

- [x] Fix success page to show correct discounted amount (fetches actual amount from Stripe session)
- [x] Fix success page to show buyer's actual email (fetches from Stripe customer_details)
- [x] Add owner notification on successful purchase (customer email requires external email service integration)

- [x] Add automatic responsive image generation when uploading new images (Sharp integration)
- [x] Update ProductPhotography page to handle missing responsive variants gracefully (fallback to original)

- [x] Disable zoom feature on product photography page (replaced ZoomableImage with ProductImage)
- [x] Integrate SendGrid for email services (server/email.ts)
- [x] Add order confirmation email to customers after successful purchase (sent via Stripe webhook)
- [x] Update contact form to send emails via SendGrid (with auto-reply to submitter)

- [x] Remove Red Bull, Fanta, and Gatorade images from product photography
- [x] Rename PHOTOS to EDITORIAL in navigation menu
- [x] Update Photos page hero and title from Photography to Editorial
