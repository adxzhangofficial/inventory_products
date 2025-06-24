import bcrypt from 'bcrypt';
import session from 'express-session';
import ConnectSQLite from 'connect-sqlite3';
import { type Express, type Request, type Response, type NextFunction } from 'express';
import { db } from './db';
import { users } from '@shared/sqlite-schema';
import { eq } from 'drizzle-orm';

const SQLiteStore = ConnectSQLite(session);

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      role: string;
    };
  }
}

export function setupAuth(app: Express) {
  app.use(session({
    store: new SQLiteStore({
      db: 'sessions.sqlite',
      table: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export async function createDefaultAdmin() {
  try {
    // Check if admin user exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
    
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await db.insert(users).values({
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Default admin user created (username: admin, password: admin)');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
}

export async function authenticateUser(username: string, password: string) {
  try {
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    
    if (user.length === 0) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user[0].password);
    if (!isValidPassword) {
      return null;
    }

    return {
      id: user[0].id,
      username: user[0].username,
      role: user[0].role
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function changePassword(userId: number, currentPassword: string, newPassword: string) {
  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (user.length === 0) {
      return { success: false, error: 'User not found' };
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user[0].password);
    if (!isValidPassword) {
      return { success: false, error: 'Current password is incorrect' };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashedNewPassword }).where(eq(users.id, userId));
    
    return { success: true };
  } catch (error) {
    console.error('Password change error:', error);
    return { success: false, error: 'Failed to change password' };
  }
}