'use server';

import { redirect } from 'next/navigation';
import { prisma } from './db';
import {
  verifyPassword,
  hashPassword,
  createSessionToken,
  setSessionCookie,
  destroySession,
  getSession,
  ensureAdminUser,
  createAuditLog,
} from './auth';

export async function loginAction(formData: { email: string; password: string; rememberMe?: boolean }) {
  await ensureAdminUser();

  const email = formData.email?.trim().toLowerCase();
  const password = formData.password;

  if (!email || !password) {
    return { success: false, error: 'Email and Password are required.' };
  }

  let user: any = null;
  try {
    user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });
  } catch {
    user = await prisma.user.findUnique({ where: { email } });
  }

  if (!user) {
    return { success: false, error: 'Invalid email or password.' };
  }

  if (user.status === 'inactive') {
    await createAuditLog('Login Failed', `Inactive user account login attempt for ${email}`, {
      id: user.id,
      fullName: user.fullName,
    });
    return { success: false, error: 'Your account is deactivated. Please contact administrator.' };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    await createAuditLog('Login Failed', `Invalid password for ${email}`, { id: user.id, fullName: user.fullName });
    return { success: false, error: 'Invalid email or password.' };
  }

  // Update last login timestamp
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
  } catch {}

  const sessionPayload = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role as 'ADMIN' | 'USER',
    status: user.status,
    currency: user.currency || 'INR',
    mustChangePassword: Boolean(user.mustChangePassword),
  };

  const token = await createSessionToken(sessionPayload, formData.rememberMe);
  await setSessionCookie(token, formData.rememberMe);

  await createAuditLog('User Login', `Logged in successfully from web interface`, {
    id: user.id,
    fullName: user.fullName,
  });

  if (Boolean(user.mustChangePassword)) {
    return { success: true, redirect: '/change-password' };
  }

  return { success: true, redirect: '/' };
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await createAuditLog('User Logout', `User logged out`, { id: session.id, fullName: session.fullName });
  }
  await destroySession();
  redirect('/login');
}

export async function changePasswordAction(formData: { oldPassword?: string; newPassword: string; confirmPassword: string }) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Not authenticated.' };
  }

  if (!formData.newPassword || formData.newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters.' };
  }

  if (formData.newPassword !== formData.confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }

  let user: any = null;
  try {
    user = await prisma.user.findUnique({ where: { id: session.id } });
  } catch {
    return { success: false, error: 'User not found.' };
  }

  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  if (!session.mustChangePassword && formData.oldPassword) {
    const isOldValid = await verifyPassword(formData.oldPassword, user.passwordHash);
    if (!isOldValid) {
      return { success: false, error: 'Current password is incorrect.' };
    }
  }

  const newHash = await hashPassword(formData.newPassword);
  try {
    await prisma.user.update({
      where: { id: session.id },
      data: { passwordHash: newHash, mustChangePassword: false },
    });
  } catch {
    return { success: false, error: 'Failed to update password.' };
  }

  // Update session cookie with mustChangePassword = false
  const updatedPayload = { ...session, mustChangePassword: false };
  const newToken = await createSessionToken(updatedPayload, true);
  await setSessionCookie(newToken, true);

  await createAuditLog('Password Changed', `User changed their password`, { id: session.id, fullName: session.fullName });

  return { success: true };
}

export async function forgotPasswordAction(email: string) {
  const trimmed = email.trim().toLowerCase();
  let user: any = null;
  try {
    const rawUsers: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "User" WHERE LOWER("email") = ? LIMIT 1`, trimmed);
    user = rawUsers[0];
  } catch {}

  if (user) {
    await createAuditLog('Forgot Password Requested', `Password reset token requested for ${trimmed}`, {
      id: user.id,
      fullName: user.fullName,
    });
  }

  return {
    success: true,
    message: 'If an account exists with this email, password reset instructions have been sent.',
  };
}
