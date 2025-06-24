import {
  users,
  categories,
  products,
  receipts,
  receiptItems,
  productImages,
  productReviews,
  wishlist,
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type Receipt,
  type InsertReceipt,
  type ReceiptItem,
  type InsertReceiptItem,
  type ProductImage,
  type InsertProductImage,
  type ProductReview,
  type InsertProductReview,
  type WishlistItem,
} from "@shared/sqlite-schema";
import { db } from "./db";
import { eq, desc, like, or, and, sql, asc, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  getCategoryByCode(code: string): Promise<Category | undefined>;
  getCategoriesWithProductCount(): Promise<Array<Category & { productCount: number }>>;
  
  // Product methods
  getProducts(search?: string, category?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  generateSku(category: string): Promise<string>;
  
  // Catalog methods
  getCatalogProducts(filters: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    featured?: boolean;
    sortBy?: 'name' | 'price' | 'created' | 'rating';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<Product[]>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  getProductWithImages(id: number): Promise<(Product & { images: ProductImage[]; reviews: ProductReview[] }) | undefined>;
  
  // Product images methods
  getProductImages(productId: number): Promise<ProductImage[]>;
  addProductImage(image: InsertProductImage): Promise<ProductImage>;
  deleteProductImage(id: number): Promise<boolean>;
  
  // Product reviews methods
  getProductReviews(productId: number): Promise<ProductReview[]>;
  addProductReview(review: InsertProductReview): Promise<ProductReview>;
  getAverageRating(productId: number): Promise<number>;
  
  // Wishlist methods
  getWishlist(sessionId: string): Promise<WishlistItem[]>;
  addToWishlist(sessionId: string, productId: number): Promise<WishlistItem>;
  removeFromWishlist(sessionId: string, productId: number): Promise<boolean>;
  
  // Receipt methods
  getReceipts(): Promise<Receipt[]>;
  getReceipt(id: number): Promise<Receipt | undefined>;
  createReceipt(receipt: InsertReceipt, items: InsertReceiptItem[]): Promise<Receipt>;
  getReceiptItems(receiptId: number): Promise<ReceiptItem[]>;
  
  // Analytics methods
  getProductStats(): Promise<{
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    categoriesCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const user = await db.select().from(users).where(eq(users.id, id)).get();
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await db.select().from(users).where(eq(users.username, username)).get();
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning().get();
    return result;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name).all();
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const newCategory = await db
      .insert(categories)
      .values(category)
      .returning()
      .get();
    return newCategory;
  }

  async getCategoryByCode(code: string): Promise<Category | undefined> {
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.code, code))
      .get();
    return category || undefined;
  }

  async getCategoriesWithProductCount(): Promise<Array<Category & { productCount: number }>> {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        code: categories.code,
        description: categories.description,
        image: categories.image,
        createdAt: categories.createdAt,
        productCount: sql<number>`count(${products.id})`.as('productCount'),
      })
      .from(categories)
      .leftJoin(products, and(eq(categories.code, products.category), eq(products.isActive, true)))
      .groupBy(categories.id)
      .orderBy(categories.name)
      .all();
    
    return result;
  }

  // Product methods
  async getProducts(search?: string, category?: string): Promise<Product[]> {
    let query = db.select().from(products);
    
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.sku, `%${search}%`),
          like(products.description, `%${search}%`)
        )
      );
    }
    
    if (category) {
      conditions.push(eq(products.category, category));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query
      .orderBy(desc(products.createdAt))
      .limit(100)
      .all();
  }

  async getCatalogProducts(filters: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    featured?: boolean;
    sortBy?: 'name' | 'price' | 'created' | 'rating';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    let query = db.select().from(products);
    
    const conditions = [eq(products.isActive, true)];
    
    if (filters.search) {
      conditions.push(
        or(
          like(products.name, `%${filters.search}%`),
          like(products.sku, `%${filters.search}%`),
          like(products.description, `%${filters.search}%`),
          like(products.brand, `%${filters.search}%`),
          like(products.tags, `%${filters.search}%`)
        )
      );
    }
    
    if (filters.category) {
      conditions.push(eq(products.category, filters.category));
    }
    
    if (filters.minPrice !== undefined) {
      conditions.push(gte(products.price, filters.minPrice));
    }
    
    if (filters.maxPrice !== undefined) {
      conditions.push(lte(products.price, filters.maxPrice));
    }
    
    if (filters.inStock) {
      conditions.push(sql`${products.stockQuantity} > 0`);
    }
    
    if (filters.featured) {
      conditions.push(eq(products.isFeatured, true));
    }
    
    query = query.where(and(...conditions));
    
    // Sorting
    const sortOrder = filters.sortOrder === 'desc' ? desc : asc;
    switch (filters.sortBy) {
      case 'price':
        query = query.orderBy(sortOrder(products.price));
        break;
      case 'created':
        query = query.orderBy(sortOrder(products.createdAt));
        break;
      case 'name':
      default:
        query = query.orderBy(sortOrder(products.name));
        break;
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query.all();
  }

  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .all();
  }

  async getProductWithImages(id: number): Promise<(Product & { images: ProductImage[]; reviews: ProductReview[] }) | undefined> {
    const product = await db.select().from(products).where(eq(products.id, id)).get();
    if (!product) return undefined;
    
    const images = await this.getProductImages(id);
    const reviews = await this.getProductReviews(id);
    
    return { ...product, images, reviews };
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const product = await db.select().from(products).where(eq(products.id, id)).get();
    return product || undefined;
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const product = await db.select().from(products).where(eq(products.sku, sku)).get();
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct = await db
      .insert(products)
      .values(product)
      .returning()
      .get();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const updatedProduct = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning()
      .get();
    return updatedProduct || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).run();
    return result.changes > 0;
  }

  async generateSku(category: string): Promise<string> {
    const year = new Date().getFullYear();
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.category, category))
      .get();
    
    const nextNumber = (result?.count || 0) + 1;
    return `${category}-${String(nextNumber).padStart(3, '0')}-${year}`;
  }

  // Product images methods
  async getProductImages(productId: number): Promise<ProductImage[]> {
    return await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(productImages.sortOrder)
      .all();
  }

  async addProductImage(image: InsertProductImage): Promise<ProductImage> {
    return await db.insert(productImages).values(image).returning().get();
  }

  async deleteProductImage(id: number): Promise<boolean> {
    const result = await db.delete(productImages).where(eq(productImages.id, id)).run();
    return result.changes > 0;
  }

  // Product reviews methods
  async getProductReviews(productId: number): Promise<ProductReview[]> {
    return await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.productId, productId))
      .orderBy(desc(productReviews.createdAt))
      .all();
  }

  async addProductReview(review: InsertProductReview): Promise<ProductReview> {
    return await db.insert(productReviews).values(review).returning().get();
  }

  async getAverageRating(productId: number): Promise<number> {
    const result = await db
      .select({ avg: sql<number>`avg(${productReviews.rating})` })
      .from(productReviews)
      .where(eq(productReviews.productId, productId))
      .get();
    
    return result?.avg || 0;
  }

  // Wishlist methods
  async getWishlist(sessionId: string): Promise<WishlistItem[]> {
    return await db
      .select()
      .from(wishlist)
      .where(eq(wishlist.sessionId, sessionId))
      .orderBy(desc(wishlist.createdAt))
      .all();
  }

  async addToWishlist(sessionId: string, productId: number): Promise<WishlistItem> {
    // Check if already exists
    const existing = await db
      .select()
      .from(wishlist)
      .where(and(eq(wishlist.sessionId, sessionId), eq(wishlist.productId, productId)))
      .get();
    
    if (existing) {
      return existing;
    }

    return await db
      .insert(wishlist)
      .values({ sessionId, productId })
      .returning()
      .get();
  }

  async removeFromWishlist(sessionId: string, productId: number): Promise<boolean> {
    const result = await db
      .delete(wishlist)
      .where(and(eq(wishlist.sessionId, sessionId), eq(wishlist.productId, productId)))
      .run();
    
    return result.changes > 0;
  }

  // Receipt methods
  async getReceipts(): Promise<Receipt[]> {
    return await db.select().from(receipts).orderBy(desc(receipts.createdAt)).all();
  }

  async getReceipt(id: number): Promise<Receipt | undefined> {
    const receipt = await db.select().from(receipts).where(eq(receipts.id, id)).get();
    return receipt || undefined;
  }

  async createReceipt(receipt: InsertReceipt, items: InsertReceiptItem[]): Promise<Receipt> {
    const newReceipt = await db
      .insert(receipts)
      .values(receipt)
      .returning()
      .get();

    // Insert receipt items
    for (const item of items) {
      await db.insert(receiptItems).values({
        ...item,
        receiptId: newReceipt.id,
      });
    }

    return newReceipt;
  }

  async getReceiptItems(receiptId: number): Promise<ReceiptItem[]> {
    return await db
      .select()
      .from(receiptItems)
      .where(eq(receiptItems.receiptId, receiptId))
      .all();
  }

  // Analytics methods
  async getProductStats(): Promise<{
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    categoriesCount: number;
  }> {
    const totalProducts = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .get();

    const totalValue = await db
      .select({ total: sql<number>`sum(${products.price} * ${products.stockQuantity})` })
      .from(products)
      .get();

    const lowStockCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(sql`${products.stockQuantity} <= 10`)
      .get();

    const categoriesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .get();

    return {
      totalProducts: totalProducts?.count || 0,
      totalValue: totalValue?.total || 0,
      lowStockCount: lowStockCount?.count || 0,
      categoriesCount: categoriesCount?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();