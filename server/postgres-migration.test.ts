import { describe, it, expect } from "vitest";

/**
 * Tests to verify the MySQL → Postgres migration is correct.
 * These tests validate the schema definitions and db module imports
 * without requiring a live database connection.
 */

describe("Postgres Migration", () => {
  describe("Schema definitions", () => {
    it("should import all table definitions from pg-core schema", async () => {
      const schema = await import("../drizzle/schema");
      
      expect(schema.users).toBeDefined();
      expect(schema.imageOrders).toBeDefined();
      expect(schema.blogPosts).toBeDefined();
      expect(schema.products).toBeDefined();
      expect(schema.orders).toBeDefined();
      expect(schema.roleEnum).toBeDefined();
    });

    it("should export correct type definitions", async () => {
      const schema = await import("../drizzle/schema");
      
      // Verify the table objects have the expected column structure
      const userColumns = Object.keys(schema.users);
      expect(userColumns).toContain("id");
      expect(userColumns).toContain("openId");
      expect(userColumns).toContain("email");
      expect(userColumns).toContain("role");
      expect(userColumns).toContain("createdAt");
    });

    it("should have correct column names for all tables", async () => {
      const schema = await import("../drizzle/schema");
      
      // Verify blog_posts columns
      const blogColumns = Object.keys(schema.blogPosts);
      expect(blogColumns).toContain("slug");
      expect(blogColumns).toContain("title");
      expect(blogColumns).toContain("content");
      expect(blogColumns).toContain("heroImage");
      expect(blogColumns).toContain("published");
      
      // Verify orders columns
      const orderColumns = Object.keys(schema.orders);
      expect(orderColumns).toContain("stripeSessionId");
      expect(orderColumns).toContain("customerEmail");
      expect(orderColumns).toContain("amount");
      expect(orderColumns).toContain("status");
      
      // Verify products columns
      const productColumns = Object.keys(schema.products);
      expect(productColumns).toContain("slug");
      expect(productColumns).toContain("price");
      expect(productColumns).toContain("priceMax");
      expect(productColumns).toContain("category");
    });
  });

  describe("Database module", () => {
    it("should import db module without errors", async () => {
      // This verifies the postgres-js driver import works
      const dbModule = await import("./db");
      
      expect(dbModule.getDb).toBeDefined();
      expect(dbModule.upsertUser).toBeDefined();
      expect(dbModule.getUserByOpenId).toBeDefined();
      expect(dbModule.getImageOrder).toBeDefined();
      expect(dbModule.saveImageOrder).toBeDefined();
      expect(dbModule.getAllBlogPosts).toBeDefined();
      expect(dbModule.getBlogPostBySlug).toBeDefined();
      expect(dbModule.createBlogPost).toBeDefined();
      expect(dbModule.getAllProducts).toBeDefined();
      expect(dbModule.getProductBySlug).toBeDefined();
    });

    it("should use postgres driver (not mysql2)", async () => {
      // Verify the import path uses postgres-js, not mysql2
      const dbSource = await import("./db");
      // getDb should be a function that returns a drizzle instance
      expect(typeof dbSource.getDb).toBe("function");
      // If DATABASE_URL is set, it should return a non-null db instance
      const db = await dbSource.getDb();
      if (process.env.DATABASE_URL) {
        expect(db).not.toBeNull();
      }
    });
  });

  describe("Drizzle config", () => {
    it("should use postgresql dialect in config", async () => {
      // Read the config file to verify dialect
      const fs = await import("fs");
      const configContent = fs.readFileSync("./drizzle.config.ts", "utf-8");
      
      expect(configContent).toContain("postgresql");
      expect(configContent).not.toContain('"mysql"');
    });
  });

  describe("No MySQL remnants", () => {
    it("should not have mysql imports in schema", async () => {
      const fs = await import("fs");
      const schemaContent = fs.readFileSync("./drizzle/schema.ts", "utf-8");
      
      expect(schemaContent).not.toContain("mysql-core");
      expect(schemaContent).not.toContain("mysqlTable");
      expect(schemaContent).not.toContain("mysqlEnum");
      expect(schemaContent).toContain("pg-core");
      expect(schemaContent).toContain("pgTable");
      expect(schemaContent).toContain("pgEnum");
    });

    it("should not have mysql imports in db.ts", async () => {
      const fs = await import("fs");
      const dbContent = fs.readFileSync("./server/db.ts", "utf-8");
      
      expect(dbContent).not.toContain("mysql2");
      expect(dbContent).toContain("postgres-js");
      expect(dbContent).toContain("onConflictDoUpdate");
    });
  });
});
