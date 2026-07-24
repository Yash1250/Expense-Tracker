import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'expense_tracker_secret_key_2026_super_secure_9988'
);

const COOKIE_NAME = 'et_auth_session';

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'USER';
  status: string;
  currency: string;
  mustChangePassword: boolean;
};

export async function hashPassword(plain: string): Promise<string> {
  return await bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plain, hash);
}

export async function createSessionToken(user: SessionUser, rememberMe?: boolean): Promise<string> {
  const duration = rememberMe ? '30d' : '1d';
  return await new SignJWT({
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    currency: user.currency,
    mustChangePassword: user.mustChangePassword,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(duration)
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.userId as string,
      fullName: payload.fullName as string,
      email: payload.email as string,
      role: payload.role as 'ADMIN' | 'USER',
      status: payload.status as string,
      currency: (payload.currency as string) || 'INR',
      mustChangePassword: Boolean(payload.mustChangePassword),
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  } catch {}
}

export async function setSessionCookie(token: string, rememberMe?: boolean) {
  const cookieStore = await cookies();
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

export async function createAuditLog(action: string, details: string, userOverride?: { id: string; fullName: string }) {
  try {
    let userId = userOverride?.id;
    let userName = userOverride?.fullName;

    if (!userId) {
      const session = await getSession();
      if (session) {
        userId = session.id;
        userName = session.fullName;
      }
    }

    try {
      await prisma.auditLog.create({
        data: {
          action,
          details,
          performedByUserId: userId || null,
          performedByName: userName || 'System',
        },
      });
    } catch {
      const id = 'aud_' + Math.random().toString(36).substring(2, 11);
      await prisma.$executeRawUnsafe(
        `INSERT INTO "AuditLog" ("id", "action", "details", "performedByUserId", "performedByName", "createdAt") VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        id,
        action,
        details,
        userId || null,
        userName || 'System'
      );
    }
  } catch (e) {
    console.error('Failed to write audit log:', e);
  }
}

export async function ensureAdminUser() {
  let usersCount = 0;
  try {
    const rawCount: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "User"`);
    usersCount = Number(rawCount[0]?.count ?? 0);
  } catch {
    try {
      usersCount = await prisma.user.count();
    } catch {
      usersCount = 0;
    }
  }

  if (usersCount === 0) {
    const hashed = await hashPassword('Admin@123');
    const adminId = 'admin_user_001';

    try {
      await prisma.user.create({
        data: {
          id: adminId,
          fullName: 'System Admin',
          email: 'admin@example.com',
          passwordHash: hashed,
          role: 'ADMIN',
          status: 'active',
          currency: 'INR',
          mustChangePassword: true,
        },
      });
    } catch {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "User" ("id", "fullName", "email", "passwordHash", "role", "status", "currency", "mustChangePassword", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        adminId,
        'System Admin',
        'admin@example.com',
        hashed,
        'ADMIN',
        'active',
        'INR',
        1
      );
    }

    // Attach any pre-existing orphan records to Admin so no user data is lost!
    const tables = ['Expense', 'Income', 'Investment', 'Account', 'Category', 'Budget', 'Settings'];
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`UPDATE "${table}" SET "userId" = ? WHERE "userId" IS NULL`, adminId);
      } catch {}
    }

    await createAuditLog(
      'System Initialize',
      'Initial Admin user (admin@example.com) seeded automatically with orphan data linked.',
      { id: adminId, fullName: 'System Admin' }
    );
  }
}
