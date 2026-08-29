import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db as defaultDb } from '../db/index.js';
import { users, organizations, sessions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'BROKER' | 'STAFF' | 'VIEWER' | string;
  organizationId: string;
  organizationName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      organizationId?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'rental_crm_default_jwt_secret_key_change_in_production_8910';

export function signToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      jti: crypto.randomUUID(),
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): AuthenticatedUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.sub,
      email: decoded.email,
      fullName: decoded.fullName,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
}

export function requireAuth(customDb = defaultDb) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let token: string | undefined;

      // Check Authorization Bearer header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }

      // Check Cookie if header is missing
      if (!token && req.headers.cookie) {
        const cookies = req.headers.cookie.split(';').reduce((acc: Record<string, string>, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        token = cookies['session_token'];
      }

      if (!token) {
        res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
        return;
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
        return;
      }

      // Validate session existence in DB
      const session = customDb.select().from(sessions).where(eq(sessions.token, token)).get();
      if (!session || new Date(session.expiresAt) < new Date()) {
        res.status(401).json({ success: false, error: 'Unauthorized: Session expired or revoked' });
        return;
      }

      // Fetch user & organization to ensure user/tenant is active
      const user = customDb.select().from(users).where(eq(users.id, decoded.id)).get();
      if (!user || !user.isActive) {
        res.status(401).json({ success: false, error: 'Unauthorized: User inactive or disabled' });
        return;
      }

      if (!user.organizationId) {
        res.status(403).json({ success: false, error: 'Forbidden: User not assigned to an organization' });
        return;
      }

      const org = customDb.select().from(organizations).where(eq(organizations.id, user.organizationId)).get();

      req.user = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: org?.name,
      };
      req.organizationId = user.organizationId;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Insufficient permissions (${req.user.role} role does not have access)`,
      });
      return;
    }

    next();
  };
}
