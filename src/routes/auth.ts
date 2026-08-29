import { Router, Request, Response, NextFunction } from 'express';
import { db as defaultDb } from '../db/index.js';
import { users, organizations, sessions, invitations, auditLogs } from '../db/schema.js';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/auth.js';
import { signToken, requireAuth, requireRole } from '../middleware/auth.js';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export function createAuthRouter(customDb = defaultDb) {
  const router = Router();

  // POST /api/auth/register-org — Signup endpoint to create new organization & ADMIN user
  router.post('/register-org', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationName, fullName, email, password } = req.body;

      if (!organizationName || !fullName || !email || !password) {
        res.status(400).json({ success: false, error: 'organizationName, fullName, email, and password are required' });
        return;
      }

      const passVal = validatePasswordStrength(password);
      if (!passVal.valid) {
        res.status(400).json({ success: false, error: passVal.message });
        return;
      }

      const existingUser = customDb.select().from(users).where(eq(users.email, email.toLowerCase().trim())).get();
      if (existingUser) {
        res.status(409).json({ success: false, error: 'User with this email already exists' });
        return;
      }

      const passwordHash = await hashPassword(password);

      const result = customDb.transaction((tx: any) => {
        const [org] = tx.insert(organizations).values({
          name: organizationName,
        }).returning().all();

        const [newUser] = tx.insert(users).values({
          organizationId: org.id,
          email: email.toLowerCase().trim(),
          passwordHash,
          fullName,
          role: 'ADMIN',
          isActive: true,
        }).returning().all();

        // Audit log
        tx.insert(auditLogs).values({
          organizationId: org.id,
          tableName: 'users',
          recordId: newUser.id,
          action: 'REGISTER_ORGANIZATION',
          performedBy: newUser.id,
          newValues: JSON.stringify({ email: newUser.email, role: newUser.role, orgName: org.name }),
        }).run();

        return { org, user: newUser };
      });

      const token = signToken({
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
        organizationId: result.org.id,
        organizationName: result.org.name,
      });

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      customDb.insert(sessions).values({
        userId: result.user.id,
        token,
        expiresAt,
      }).run();

      res.cookie('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role,
          organizationId: result.org.id,
          organizationName: result.org.name,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/auth/login
  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
      }

      const user = customDb.select().from(users).where(eq(users.email, email.toLowerCase().trim())).get();
      if (!user) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, error: 'Account is deactivated' });
        return;
      }

      const passwordMatch = await verifyPassword(password, user.passwordHash);
      if (!passwordMatch) {
        // Audit log login failure
        customDb.insert(auditLogs).values({
          organizationId: user.organizationId || null,
          tableName: 'users',
          recordId: user.id,
          action: 'LOGIN_FAILURE',
          performedBy: user.id,
          newValues: JSON.stringify({ email: user.email, reason: 'Invalid password' }),
        }).run();

        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      const org = user.organizationId
        ? customDb.select().from(organizations).where(eq(organizations.id, user.organizationId)).get()
        : null;

      const authenticatedUser = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId || '',
        organizationName: org?.name,
      };

      const token = signToken(authenticatedUser);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      customDb.transaction((tx: any) => {
        tx.insert(sessions).values({
          userId: user.id,
          token,
          expiresAt,
        }).run();

        tx.update(users)
          .set({ lastLoginAt: new Date().toISOString() })
          .where(eq(users.id, user.id))
          .run();

        tx.insert(auditLogs).values({
          organizationId: user.organizationId || null,
          tableName: 'users',
          recordId: user.id,
          action: 'LOGIN_SUCCESS',
          performedBy: user.id,
          newValues: JSON.stringify({ email: user.email }),
        }).run();
      });

      res.cookie('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        token,
        user: authenticatedUser,
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/auth/logout
  router.post('/logout', requireAuth(customDb), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

      if (!token && req.headers.cookie) {
        const cookies = req.headers.cookie.split(';').reduce((acc: Record<string, string>, c) => {
          const [k, v] = c.trim().split('=');
          acc[k] = v;
          return acc;
        }, {});
        token = cookies['session_token'];
      }

      if (token) {
        customDb.delete(sessions).where(eq(sessions.token, token)).run();
      }

      if (req.user) {
        customDb.insert(auditLogs).values({
          organizationId: req.user.organizationId || null,
          tableName: 'users',
          recordId: req.user.id,
          action: 'LOGOUT',
          performedBy: req.user.id,
          newValues: JSON.stringify({ email: req.user.email }),
        }).run();
      }

      res.clearCookie('session_token');
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/auth/me
  router.get('/me', requireAuth(customDb), (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  });

  // POST /api/auth/invitation (ADMIN only)
  router.post('/invitation', requireAuth(customDb), requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, role } = req.body;

      if (!email || !role) {
        res.status(400).json({ success: false, error: 'Email and role are required' });
        return;
      }

      const validRoles = ['ADMIN', 'BROKER', 'STAFF', 'VIEWER'];
      if (!validRoles.includes(role)) {
        res.status(400).json({ success: false, error: `Invalid role. Must be one of ${validRoles.join(', ')}` });
        return;
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const [invitation] = customDb.insert(invitations).values({
        organizationId: req.user!.organizationId,
        email: email.toLowerCase().trim(),
        role,
        token,
        status: 'PENDING',
        expiresAt,
        invitedBy: req.user!.id,
      }).returning().all();

      customDb.insert(auditLogs).values({
        organizationId: req.user!.organizationId || null,
        tableName: 'invitations',
        recordId: invitation.id,
        action: 'INVITATION_CREATED',
        performedBy: req.user!.id,
        newValues: JSON.stringify({ email, role, token }),
      }).run();

      res.status(201).json({
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          token: invitation.token,
          expiresAt: invitation.expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/auth/accept-invitation
  router.post('/accept-invitation', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, fullName, password } = req.body;

      if (!token || !fullName || !password) {
        res.status(400).json({ success: false, error: 'token, fullName, and password are required' });
        return;
      }

      const passVal = validatePasswordStrength(password);
      if (!passVal.valid) {
        res.status(400).json({ success: false, error: passVal.message });
        return;
      }

      const invitation = customDb
        .select()
        .from(invitations)
        .where(and(eq(invitations.token, token), eq(invitations.status, 'PENDING')))
        .get();

      if (!invitation || new Date(invitation.expiresAt) < new Date()) {
        res.status(400).json({ success: false, error: 'Invalid or expired invitation token' });
        return;
      }

      const existingUser = customDb.select().from(users).where(eq(users.email, invitation.email)).get();
      if (existingUser) {
        res.status(409).json({ success: false, error: 'User with this email already exists' });
        return;
      }

      const passwordHash = await hashPassword(password);

      const result = customDb.transaction((tx: any) => {
        const [newUser] = tx.insert(users).values({
          organizationId: invitation.organizationId,
          email: invitation.email,
          passwordHash,
          fullName,
          role: invitation.role,
          isActive: true,
        }).returning().all();

        tx.update(invitations)
          .set({ status: 'ACCEPTED' })
          .where(eq(invitations.id, invitation.id))
          .run();

        tx.insert(auditLogs).values({
          organizationId: invitation.organizationId || null,
          tableName: 'users',
          recordId: newUser.id,
          action: 'INVITATION_ACCEPTED',
          performedBy: newUser.id,
          newValues: JSON.stringify({ email: newUser.email, role: newUser.role }),
        }).run();

        const org = tx.select().from(organizations).where(eq(organizations.id, invitation.organizationId)).get();

        return { user: newUser, org };
      });

      const sessionToken = signToken({
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
        organizationId: result.user.organizationId!,
        organizationName: result.org?.name,
      });

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      customDb.insert(sessions).values({
        userId: result.user.id,
        token: sessionToken,
        expiresAt,
      }).run();

      res.cookie('session_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        token: sessionToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role,
          organizationId: result.user.organizationId,
          organizationName: result.org?.name,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export default createAuthRouter();
