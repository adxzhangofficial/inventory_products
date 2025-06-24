import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./sqlite-storage";
import { insertProductSchema, insertReceiptSchema, insertReceiptItemSchema, insertCategorySchema } from "@shared/sqlite-schema";
import { requireAuth, requireAdmin, authenticateUser, changePassword } from "./auth";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const user = await authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.user = user;
      res.json({ success: true, user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (req.session.user) {
      res.json(req.session.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.session.user?.id;

      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await changePassword(userId, currentPassword, newPassword);
      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Catalog routes (public)
  app.get("/api/catalog/categories", async (req, res) => {
    try {
      const categoriesWithCount = await storage.getCategoriesWithProductCount();
      res.json(categoriesWithCount);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/catalog/products", async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        category: req.query.category as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        inStock: req.query.inStock === 'true',
        featured: req.query.featured === 'true',
        sortBy: (req.query.sortBy as any) || 'name',
        sortOrder: (req.query.sortOrder as any) || 'asc',
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const products = await storage.getCatalogProducts(filters);
      res.json(products);
    } catch (error) {
      console.error("Error fetching catalog products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/catalog/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProductWithImages(productId);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.get("/api/catalog/wishlist", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }

      const wishlist = await storage.getWishlist(sessionId);
      res.json(wishlist);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });

  app.post("/api/catalog/wishlist", async (req, res) => {
    try {
      const { sessionId, productId } = req.body;
      if (!sessionId || !productId) {
        return res.status(400).json({ error: "Session ID and product ID required" });
      }

      const item = await storage.addToWishlist(sessionId, productId);
      res.json(item);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/catalog/wishlist/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }

      const success = await storage.removeFromWishlist(sessionId, productId);
      res.json({ success });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ error: "Failed to remove from wishlist" });
    }
  });

  // Admin routes (protected)
  app.get("/api/categories", requireAdmin, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      
      // Check if category code already exists
      const existingCategory = await storage.getCategoryByCode(categoryData.code);
      if (existingCategory) {
        return res.status(409).json({ error: "Category code already exists" });
      }
      
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // Product routes (admin)
  app.get("/api/products", requireAdmin, async (req, res) => {
    try {
      const { search, category } = req.query;
      const products = await storage.getProducts(
        search as string,
        category as string
      );
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", requireAdmin, upload.single("image"), async (req, res) => {
    try {
      // Transform string numbers to actual numbers
      const transformedData = {
        ...req.body,
        price: parseFloat(req.body.price) || 0,
        stockQuantity: parseInt(req.body.stockQuantity) || 0,
        weight: req.body.weight ? parseFloat(req.body.weight) : undefined,
        length: req.body.length ? parseFloat(req.body.length) : undefined,
        width: req.body.width ? parseFloat(req.body.width) : undefined,
        height: req.body.height ? parseFloat(req.body.height) : undefined,
      };
      
      const productData = insertProductSchema.parse(transformedData);
      
      // Generate SKU if not provided
      if (!productData.sku) {
        productData.sku = await storage.generateSku(productData.category);
      }
      
      // Handle image upload
      if (req.file) {
        productData.imageUrl = `/uploads/${req.file.filename}`;
      }
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", upload.single("image"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      
      // Handle image upload
      if (req.file) {
        productData.imageUrl = `/uploads/${req.file.filename}`;
      }
      
      const product = await storage.updateProduct(id, productData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // SKU generation route
  app.post("/api/generate-sku", requireAdmin, async (req, res) => {
    try {
      const { category } = req.body;
      if (!category) {
        return res.status(400).json({ error: "Category is required" });
      }
      const sku = await storage.generateSku(category);
      res.json({ sku });
    } catch (error) {
      console.error("Error generating SKU:", error);
      res.status(500).json({ error: "Failed to generate SKU" });
    }
  });

  // Receipt routes
  app.get("/api/receipts", requireAdmin, async (req, res) => {
    try {
      const receipts = await storage.getReceipts();
      res.json(receipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.status(500).json({ error: "Failed to fetch receipts" });
    }
  });

  app.get("/api/receipts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const receipt = await storage.getReceipt(id);
      if (!receipt) {
        return res.status(404).json({ error: "Receipt not found" });
      }
      const items = await storage.getReceiptItems(id);
      res.json({ ...receipt, items });
    } catch (error) {
      console.error("Error fetching receipt:", error);
      res.status(500).json({ error: "Failed to fetch receipt" });
    }
  });

  app.post("/api/receipts", requireAdmin, async (req, res) => {
    try {
      const { receipt: receiptData, items: itemsData } = req.body;
      
      const validatedReceipt = insertReceiptSchema.parse(receiptData);
      const validatedItems = itemsData.map((item: any) => 
        insertReceiptItemSchema.parse(item)
      );
      
      const receipt = await storage.createReceipt(validatedReceipt, validatedItems);
      res.status(201).json(receipt);
    } catch (error) {
      console.error("Error creating receipt:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create receipt" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const stats = await storage.getProductStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(process.cwd(), "uploads", req.path);
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).json({ error: "File not found" });
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
