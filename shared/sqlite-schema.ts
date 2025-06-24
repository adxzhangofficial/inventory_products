import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // hashed
  role: text("role").notNull().default("admin"), // admin, viewer
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Categories table
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  description: text("description"),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Products table
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(),
  price: real("price").notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  description: text("description"),
  details: text("details"),
  brand: text("brand"),
  model: text("model"),
  weight: real("weight"),
  length: real("length"),
  width: real("width"),
  height: real("height"),
  imageUrl: text("image_url"),
  barcodeType: text("barcode_type").notNull().default("code128"),
  barcodeData: text("barcode_data"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
  tags: text("tags"), // JSON string for searchable tags
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Product images table for multiple images
export const productImages = sqliteTable("product_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  alt: text("alt"),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Receipts table
export const receipts = sqliteTable("receipts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  receiptNumber: text("receipt_number").notNull().unique(),
  customerName: text("customer_name"),
  businessName: text("business_name").notNull(),
  businessAddress: text("business_address"),
  businessPhone: text("business_phone"),
  subtotal: real("subtotal").notNull(),
  taxRate: real("tax_rate").notNull(),
  taxAmount: real("tax_amount").notNull(),
  discountRate: real("discount_rate").default(0),
  discountAmount: real("discount_amount").default(0),
  totalAmount: real("total_amount").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Receipt items table
export const receiptItems = sqliteTable("receipt_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  receiptId: integer("receipt_id").notNull().references(() => receipts.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  productSku: text("product_sku").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
});

// Product reviews for catalog
export const productReviews = sqliteTable("product_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  rating: integer("rating").notNull(), // 1-5 stars
  reviewText: text("review_text"),
  isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Wishlist for catalog users
export const wishlist = sqliteTable("wishlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(), // for non-authenticated users
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  price: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseFloat(val) : val
  ),
  stockQuantity: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseInt(val) : val
  ).pipe(z.number().int().min(0)),
  brand: z.string().optional().or(z.literal("")),
  model: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  details: z.string().optional().or(z.literal("")),
  imageUrl: z.string().optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
  weight: z.union([z.string(), z.number()]).optional().transform(val => 
    val ? (typeof val === 'string' ? parseFloat(val) : val) : undefined
  ),
  length: z.union([z.string(), z.number()]).optional().transform(val => 
    val ? (typeof val === 'string' ? parseFloat(val) : val) : undefined
  ),
  width: z.union([z.string(), z.number()]).optional().transform(val => 
    val ? (typeof val === 'string' ? parseFloat(val) : val) : undefined
  ),
  height: z.union([z.string(), z.number()]).optional().transform(val => 
    val ? (typeof val === 'string' ? parseFloat(val) : val) : undefined
  ),
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  createdAt: true,
});

export const insertReceiptItemSchema = createInsertSchema(receiptItems).omit({
  id: true,
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  createdAt: true,
});

export const insertProductImageSchema = createInsertSchema(productImages).omit({
  id: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type ReceiptItem = typeof receiptItems.$inferSelect;
export type InsertReceiptItem = z.infer<typeof insertReceiptItemSchema>;
export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type ProductImage = typeof productImages.$inferSelect;
export type InsertProductImage = z.infer<typeof insertProductImageSchema>;
export type WishlistItem = typeof wishlist.$inferSelect;