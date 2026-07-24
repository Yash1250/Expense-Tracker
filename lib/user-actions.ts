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
  } catch (e) {
    console.error('Failed to fetch users:', e);
    users = [];
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
    existing = await prisma.user.findUnique({ where: { email } });
  } catch {
    existing = null;
  }

  if (existing) {
    return { success: false, error: 'A user with this email address already exists.' };
  }

  const passwordHash = await hashPassword(data.password);
  const userId = 'usr_' + Math.random().toString(36).substring(2, 11);

  try {
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
  } catch (e) {
    console.error('Failed to create user:', e);
    return { success: false, error: 'Failed to create user account.' };
  }

  await createAuditLog('User Created', `Admin created new user account: ${email}`);
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
  } catch (e) {
    console.error('Failed to update user:', e);
    return { success: false, error: 'Failed to update user account.' };
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
    await prisma.user.update({
      where: { id },
      data: { status },
    });
  } catch (e) {
    console.error('Failed to toggle user status:', e);
    return { success: false, error: 'Failed to update status.' };
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
    await prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    });
  } catch (e) {
    console.error('Failed to reset user password:', e);
    return { success: false, error: 'Failed to reset password.' };
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
    await prisma.user.delete({
      where: { id },
    });
  } catch (e) {
    console.error('Failed to delete user:', e);
    return { success: false, error: 'Failed to delete user.' };
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
    return await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  } catch (e) {
    console.error('Failed to fetch audit logs:', e);
    return [];
  }
}

export async function updateProfile(data: { fullName: string; phone?: string; currency?: string; theme?: string }) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Not authenticated.' };
  }

  try {
    await prisma.user.update({
      where: { id: session.id },
      data: {
        fullName: data.fullName.trim(),
        phone: data.phone?.trim() || null,
        currency: data.currency || 'INR',
        theme: data.theme || 'light',
      },
    });
  } catch (e) {
    console.error('Failed to update profile:', e);
    return { success: false, error: 'Failed to update profile.' };
  }

  // Refresh user session cookie with updated values
  const updated = {
    ...session,
    fullName: data.fullName.trim(),
    currency: data.currency || 'INR',
  };
  const token = await createSessionToken(updated, true);
  await setSessionCookie(token, true);

  await createAuditLog('Profile Updated', `User updated their profile details`);
  revalidatePath('/profile');
  return { success: true };
}

export async function getSystemStats() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    throw new Error('Unauthorized access');
  }

  const [totalUsers, activeUsers, totalExpenses, totalIncomes, totalInvestments, totalAuditLogs] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'active' } }),
    prisma.expense.count(),
    prisma.income.count(),
    prisma.investment.count(),
    prisma.auditLog.count(),
  ]);

  return {
    totalUsers,
    activeUsers,
    totalExpenses,
    totalIncomes,
    totalInvestments,
    totalAuditLogs,
  };
}
