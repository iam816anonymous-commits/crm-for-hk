import { signToken, AuthenticatedUser } from './middleware/auth.js';
import { organizations, users, sessions } from './db/schema.js';
import { eq } from 'drizzle-orm';

export async function createTestAuthUser(customDb: any, overrides?: Partial<AuthenticatedUser>) {
  const orgId = overrides?.organizationId || 'test-org-id-5678';
  const userId = overrides?.id || 'test-user-id-1234';
  const email = overrides?.email || 'testuser@example.com';
  const role = overrides?.role || 'ADMIN';
  const fullName = overrides?.fullName || 'Test User';
  const orgName = overrides?.organizationName || 'Test Organization';

  // Ensure organization exists
  try {
    customDb.insert(organizations).values({
      id: orgId,
      name: orgName,
    }).run();
  } catch {
    // ignore if already exists
  }

  // Ensure user exists
  const existingUser = customDb.select().from(users).where(eq(users.id, userId)).get();
  let actualUserId = userId;
  if (!existingUser) {
    try {
      customDb.insert(users).values({
        id: userId,
        organizationId: orgId,
        email: email,
        passwordHash: 'hash',
        fullName: fullName,
        role: role,
        isActive: true,
      }).run();
    } catch {
      // ignore constraint error if concurrent
    }
  } else {
    actualUserId = existingUser.id;
  }

  const authenticatedUser: AuthenticatedUser = {
    id: actualUserId,
    email,
    fullName,
    role,
    organizationId: orgId,
    organizationName: orgName,
  };

  const token = signToken(authenticatedUser);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Insert session
  try {
    customDb.insert(sessions).values({
      userId: actualUserId,
      token: token,
      expiresAt,
    }).run();
  } catch {
    // ignore if session already exists
  }

  return { token, user: authenticatedUser };
}
