import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users, businesses } from '../db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hackathon_key';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role, businessName, contactName } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Email, password, and role are required' });
    }

    if (!['admin', 'business', 'agent'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    let finalBusinessId = null;
    if (role === 'business') {
      if (!businessName) {
        return res.status(400).json({ success: false, error: 'Business name is required' });
      }
      finalBusinessId = `BIZ-${Math.floor(Math.random() * 9000) + 1000}`;
      await db.insert(businesses).values({
        id: finalBusinessId,
        name: businessName,
        contactInfo: contactName || '',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Generate an ID similar to our mock data for ease of integration
    const id = `USR-${role.toUpperCase()}-${Math.floor(Math.random() * 900) + 100}`;

    await db.insert(users).values({
      id,
      email,
      passwordHash,
      role,
      businessId: finalBusinessId,
    });

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const userArray = await db
      .select({
        user: users,
        business: businesses,
      })
      .from(users)
      .leftJoin(businesses, eq(users.businessId, businesses.id))
      .where(eq(users.email, email))
      .limit(1);
      
    if (userArray.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const { user, business } = userArray[0];

    // Check role matches requested portal role
    if (role && user.role !== role) {
      return res.status(403).json({ success: false, error: `Account exists but is not registered as a ${role}` });
    }

    // Intentional, scoped demo-login shortcut for named live-judging accounts only
    const DEMO_ALLOWLIST = ['admin@karwaan.in', 'logistics@sahyadri.in', 'agent1@karwaan.in'];
    const isAllowedDemoUser = DEMO_ALLOWLIST.includes(user.email) && password === 'demo-access-2026';

    if (isAllowedDemoUser) {
      // Bypass bcrypt for the demo accounts
    } else {
      let isMatch = false;
      try {
        isMatch = await bcrypt.compare(password, user.passwordHash);
      } catch (e) {
        // Fallback if passwordHash is invalid format (e.g. 'hashed_pw' seed)
        isMatch = false;
      }
      
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    }

    const payload = {
      userId: user.id,
      role: user.role,
      businessId: user.businessId,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
        businessName: business?.name,
        name: business?.contactInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  // Stateless JWTs mean logout is primarily a client-side removal of the token
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    
    const userArray = await db
      .select({
        user: users,
        business: businesses,
      })
      .from(users)
      .leftJoin(businesses, eq(users.businessId, businesses.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (userArray.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { user, business } = userArray[0];
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
        businessName: business?.name,
        name: business?.contactInfo,
      }
    });
  } catch (error) {
    next(error);
  }
};
