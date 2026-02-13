CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(500) NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"heroImage" varchar(500),
	"published" integer DEFAULT 1 NOT NULL,
	"publishedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "image_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"gallery" varchar(50) NOT NULL,
	"imageOrder" text NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"stripeSessionId" varchar(255) NOT NULL,
	"stripePaymentIntentId" varchar(255),
	"customerEmail" varchar(320) NOT NULL,
	"customerName" varchar(255),
	"productSlug" varchar(255) NOT NULL,
	"productName" varchar(500) NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'usd' NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"shippingAddress" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_stripeSessionId_unique" UNIQUE("stripeSessionId")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(500) NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"priceMax" integer,
	"image" varchar(500),
	"category" varchar(100),
	"status" varchar(50) DEFAULT 'available',
	"details" text,
	"galleryImages" text,
	"sortOrder" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
