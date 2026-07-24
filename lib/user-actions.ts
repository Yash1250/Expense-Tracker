'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from './db';
import { getSession, hashPassword, createAuditLog, createSessionToken, setSessionCookie } from './auth';

export async function getUsers(query?: string, roleFilter?: string, statusFilter?: string) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    throw new Error('Unauthorized access');
  }

  let users: any[] = [];
  try {
    users = await prisma.$queryRawUnsafe(`SELECT "id", "fullName", "email", "phone", "role", "status", "currency", "profileImage", "lastLogin", "createdAt", "updatedAt" FROM "User" ORDER BY "createdAt" DESC`);
  } catch {
    users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        currency: true,
        profileImage: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  let filtered = users;
  if (query && query.trim()) {
    const term = query.trim().toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.phone && u.phone.toLowerCase().includes(term))
    );
  }

  if (roleFilter && roleFilter !== 'all') {
    filtered = filtered.filter((u) => u.role === roleFilter);
  }

  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter((u) => u.status === statusFilter);
  }

  return filtered;
}

export async function createUser(data: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role: 'ADMIN' | 'USER';
  status?: string;
  currency?: string;
}) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized. Admin privilege required.' };
  }

  const email = data.email.trim().toLowerCase();
  if (!data.fullName.trim() || !email || !data.password) {
    return { success: false, error: 'Full Name, Email, and Password are required.' };
  }

  // Check unique email
  let existing: any = null;
  try {
    const raw: any[] = await prisma.$queryRawUnsafe(`SELECT "id" FROM "User" WHERE LOWER("email") = ? LIMIT 1`, email);
    existing = raw[0];
  } catch {
    existing = await prisma.user.findUnique({ where: { email } });
  }

  if (existing) {
    return { success: false, error: 'A user with this email address already exists.' };
  }

  const passwordHash = await hashPassword(data.password);
  const userId = 'usr_' + Math.random().toString(36).substring(2, 11);

  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "User" ("id", "fullName", "email", "phone", "passwordHash", "role", "status", "currency", "mustChangePassword", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      userId,
      data.fullName.trim(),
      email,
      data.phone?.trim() || null,
      passwordHash,
      data.role || 'USER',
      data.status || 'active',
      data.currency || 'INR'
    );
  } catch {
    await prisma.user.create({
      data: {
        id: userId,
        fullName: data.fullName.trim(),
        email,
        phone: data.phone?.trim() || null,
        passwordHash,
        role: data.role || 'USER',
        status: data.status || 'active',
        currency: data.currency || 'INR',
        mustChangePassword: true,
      },
    });
  }

  await createAuditLog('User Created', `Admin created new user ${email} (${data.role})`);
  revalidatePath('/users');
  return { success: true };
}

export async function updateUser(
  id: string,
  data: {
    fullName: string;
    email: string;
    phone?: string;
    role: 'ADMIN' | 'USER';
    status: string;
    currency?: string;
  }
) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized. Admin privilege required.' };
  }

  const email = data.email.trim().toLowerCase();
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "fullName" = ?, "email" = ?, "phone" = ?, "role" = ?, "status" = ?, "currency" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`,
      data.fullName.trim(),
      email,
      data.phone?.trim() || null,
      data.role,
      data.status,
      data.currency || 'INR',
      id
    );
  } catch {
    await prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName.trim(),
        email,
        phone: data.phone?.trim() || null,
        role: data.role,
        status: data.status,
        currency: data.currency || 'INR',
      },
    });
  }

  await createAuditLog('User Updated', `Admin updated user details for ${email}`);
  revalidatePath('/users');
  return { success: true };
}

export async function toggleUserStatus(id: string, status: string) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized. Admin privilege required.' };
  }

  if (id === session.id) {
    return { success: false, error: 'You cannot deactivate your own account.' };
  }

  try {
    await prisma.$executeRawUnsafe(`UPDATE "User" SET "status" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`, status, id);
  } catch {
    await prisma.user.update({ where: { id }, data: { status } });
  }

  await createAuditLog('User Status Changed', `Admin changed user ${id} status to ${status}`);
  revalidatePath('/users');
  return { success: true };
}

export async function resetUserPassword(id: string, newPassword: string) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized. Admin privilege required.' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  const passwordHash = await hashPassword(newPassword);
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "passwordHash" = ?, "mustChangePassword" = 1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`,
      passwordHash,
      id
    );
  } catch {
    await prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    });
  }

  await createAuditLog('Password Reset', `Admin reset password for user ${id}`);
  revalidatePath('/users');
  return { success: true };
}

export async function deleteUser(id: string) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized. Admin privilege required.' };
  }

  if (id === session.id) {
    return { success: false, error: 'You cannot delete your own admin account.' };
  }

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "User" WHERE "id" = ?`, id);
  } catch {
    await prisma.user.delete({ where: { id } });
  }

  await createAuditLog('User Deleted', `Admin deleted user ${id}`);
  revalidatePath('/users');
  return { success: true };
}

export async function getAuditLogs() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    throw new Error('Unauthorized access');
  }

  try {
    const logs: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 200`);
    return logs;
  } catch {
    return await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}

export async function updateProfile(data: { fullName: string; phone?: string; currency?: string; theme?: string }) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Not authenticated.' };
  }

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "fullName" = ?, "phone" = ?, "currency" = ?, "theme" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`,
      data.fullName.trim(),
      data.phone?.trim() || null,
      data.currency || 'INR',
      data.theme || 'light',
      session.id
    );
  } catch {
    await prisma.user.update({
      where: { id: session.id },
      data: {
        fullName: data.fullName.trim(),
        phone: data.phone?.trim() || null,
        currency: data.currency || 'INR',
        theme: data.theme || 'light',
      },
    });
  }

  // Update active session cookie
  const updatedPayload = {
    ...session,
    fullName: data.fullName.trim(),
    currency: data.currency || session.currency,
  };
  const token = await createSessionToken(updatedPayload, true);
  await setSessionCookie(token, true);

  await createAuditLog('Profile Updated', `User updated profile information`, { id: session.id, fullName: session.fullName });

  revalidatePath('/profile');
  return { success: true };
}
