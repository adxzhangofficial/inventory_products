import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  description: text("description"),
  details: text("details"),
  brand: text("brand"),
  model: text("model"),
  weight: decimal("weight", { precision: 8, scale: 2 }),
  length: decimal("length", { precision: 8, scale: 2 }),
  width: decimal("width", { precision: 8, scale: 2 }),
  height: decimal("height", { precision: 8, scale: 2 }),
  imageUrl: text("image_url"),
  barcodeType: text("barcode_type").notNull().default("code128"),
  barcodeData: text("barcode_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  receiptNumber: text("receipt_number").notNull().unique(),
  customerName: text("customer_name"),
  businessName: text("business_name").notNull(),
  businessAddress: text("business_address"),
  businessPhone: text("business_phone"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 4 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  discountRate: decimal("discount_rate", { precision: 5, scale: 4 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const receiptItems = pgTable("receipt_items", {
  id: serial("id").primaryKey(),
  receiptId: integer("receipt_id").notNull().references(() => receipts.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  productSku: text("product_sku").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
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
}).extend({
  subtotal: z.string().transform(val => parseFloat(val)),
  taxRate: z.string().transform(val => parseFloat(val)),
  taxAmount: z.string().transform(val => parseFloat(val)),
  discountRate: z.string().optional().transform(val => val ? parseFloat(val) : 0),
  discountAmount: z.string().optional().transform(val => val ? parseFloat(val) : 0),
  total: z.string().transform(val => parseFloat(val)),
});

export const insertReceiptItemSchema = createInsertSchema(receiptItems).omit({
  id: true,
}).extend({
  quantity: z.number().int().min(1),
  unitPrice: z.string().transform(val => parseFloat(val)),
  totalPrice: z.string().transform(val => parseFloat(val)),
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receipts.$inferSelect;
export type InsertReceiptItem = z.infer<typeof insertReceiptItemSchema>;
export type ReceiptItem = typeof receiptItems.$inferSelect;

// Legacy user schema (keeping for compatibility)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Category schema
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
