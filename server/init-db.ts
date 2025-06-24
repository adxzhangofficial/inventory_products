import { db, sqlite } from './db';
import { sql } from 'drizzle-orm';
import { 
  users, 
  categories, 
  products, 
  receipts, 
  receiptItems, 
  productImages, 
  productReviews, 
  wishlist 
} from '@shared/sqlite-schema';

export async function initializeDatabase() {
  try {
    // Create tables directly using better-sqlite3
    
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        description TEXT,
        image TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        details TEXT,
        brand TEXT,
        model TEXT,
        weight REAL,
        length REAL,
        width REAL,
        height REAL,
        image_url TEXT,
        barcode_type TEXT NOT NULL DEFAULT 'code128',
        barcode_data TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_featured INTEGER NOT NULL DEFAULT 0,
        tags TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS product_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        alt TEXT,
        is_primary INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS product_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        rating INTEGER NOT NULL,
        review_text TEXT,
        is_verified INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_number TEXT NOT NULL UNIQUE,
        customer_name TEXT,
        business_name TEXT NOT NULL,
        business_address TEXT,
        business_phone TEXT,
        subtotal REAL NOT NULL,
        tax_rate REAL NOT NULL,
        tax_amount REAL NOT NULL,
        discount_rate REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        total_amount REAL NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS receipt_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        product_sku TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      -- Insert default categories
      INSERT OR IGNORE INTO categories (name, code, description, created_at) VALUES 
        ('Electronics', 'ELC', 'Electronic devices and components', ${Date.now()}),
        ('Clothing', 'CLT', 'Apparel and fashion items', ${Date.now()}),
        ('Food & Beverage', 'FNB', 'Food and drink products', ${Date.now()}),
        ('Home & Garden', 'HOM', 'Home improvement and garden supplies', ${Date.now()}),
        ('Books', 'BKS', 'Books and educational materials', ${Date.now()}),
        ('Toys', 'TOY', 'Toys and games', ${Date.now()});
    `;

    // Execute the SQL
    sqlite.exec(createTablesSQL);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}