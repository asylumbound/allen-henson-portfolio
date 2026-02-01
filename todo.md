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
- [ ] Generate 10 Soda/Beverages product images
