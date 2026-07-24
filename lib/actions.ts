"use server";

import { prisma } from './db';
import { revalidatePath } from 'next/cache';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths, subWeeks, subYears } from 'date-fns';

import { getSession, createAuditLog } from './auth';

const REVALIDATE_PATHS = ['/', '/expenses', '/reports', '/budget', '/income', '/accounts', '/investments', '/users'];
function revalidateAll() { REVALIDATE_PATHS.forEach(p => revalidatePath(p)); }

async function getUserScope() {
  const session = await getSession();
  if (!session) return { userId: null, isAdmin: false };
  return {
    userId: session.id,
    isAdmin: session.role === 'ADMIN',
  };
}

// ─── SEED HELPERS ────────────────────────────────────────────────────────────
async function ensureDefaults() {
  // Default categories
  const defaultCats = [
    { name: 'Food', icon: '🍔', color: '#f97316' },
    { name: 'Grocery', icon: '🛒', color: '#10b981' },
    { name: 'Travel', icon: '✈️', color: '#8b5cf6' },
    { name: 'Fuel', icon: '⛽', color: '#f59e0b' },
    { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
    { name: 'Entertainment', icon: '🎬', color: '#14b8a6' },
    { name: 'Bills', icon: '📄', color: '#6366f1' },
    { name: 'Rent', icon: '🏠', color: '#0ea5e9' },
    { name: 'Medical', icon: '💊', color: '#ef4444' },
    { name: 'EMI', icon: '💰', color: '#78716c' },
    { name: 'Subscription', icon: '📺', color: '#a855f7' },
    { name: 'Investment', icon: '📈', color: '#22c55e' },
    { name: 'Family', icon: '👨‍👩‍👧', color: '#f43f5e' },
    { name: 'Miscellaneous', icon: '📦', color: '#64748b' },
  ];
  for (const cat of defaultCats) {
    await prisma.category.upsert({ where: { name: cat.name }, update: {}, create: { ...cat, isDefault: true } });
  }

  // Default settings
  const s = await prisma.settings.findFirst();
  if (!s) await prisma.settings.create({ data: {} });

  // Default budget
  const b = await prisma.budget.findFirst();
  if (!b) await prisma.budget.create({ data: { monthlyLimit: 50000, weeklyLimit: 12000, dailyLimit: 1500 } });

  // Default account
  const a = await prisma.account.findFirst();
  if (!a) {
    await prisma.account.create({ data: { name: 'Cash', type: 'cash', balance: 0, color: '#10b981', icon: '💵' } });
    await prisma.account.create({ data: { name: 'Bank Account', type: 'bank', balance: 0, color: '#3b82f6', icon: '🏦' } });
  }
}

async function getCategoryId(name: string): Promise<string> {
  let cat = await prisma.category.findFirst({ where: { name } });
  if (!cat) cat = await prisma.category.create({ data: { name, icon: '📦', color: '#64748b' } });
  return cat.id;
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export async function getSettings() {
  await ensureDefaults();
  const settings = await prisma.settings.findFirst();
  const budget = await prisma.budget.findFirst();
  return { settings: settings!, budget: budget! };
}

export async function updateTheme(theme: string) {
  const s = await prisma.settings.findFirst();
  if (s) await prisma.settings.update({ where: { id: s.id }, data: { theme } });
  revalidatePath('/settings');
}

export async function updateCurrency(currency: string) {
  const s = await prisma.settings.findFirst();
  const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  if (s) await prisma.settings.update({ where: { id: s.id }, data: { currency, currencySymbol: symbols[currency] || currency } });
  revalidatePath('/settings');
}

export async function updateBudget(limits: { monthly?: number; weekly?: number; daily?: number; monthlyLimit?: number; weeklyLimit?: number; dailyLimit?: number }) {
  const b = await prisma.budget.findFirst();
  const m = limits.monthlyLimit ?? limits.monthly;
  const w = limits.weeklyLimit ?? limits.weekly;
  const d = limits.dailyLimit ?? limits.daily;
  const data = { ...(m != null && { monthlyLimit: m }), ...(w != null && { weeklyLimit: w }), ...(d != null && { dailyLimit: d }) };
  if (b) await prisma.budget.update({ where: { id: b.id }, data });
  else await prisma.budget.create({ data: { monthlyLimit: m, weeklyLimit: w, dailyLimit: d } });
  revalidateAll();
}

export async function updateDefaultPaymentMethod(method: string) {
  const s = await prisma.settings.findFirst();
  if (s) await prisma.settings.update({ where: { id: s.id }, data: { defaultPaymentMethod: method } });
  revalidatePath('/settings');
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
export async function getCategories() {
  await ensureDefaults();
  return prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { expenses: true } } } });
}

export async function createCategory(data: { name: string; icon: string; color: string }) {
  try {
    await prisma.category.create({ data });
    revalidateAll();
    return { success: true };
  } catch { return { success: false, error: 'Category with this name already exists.' }; }
}

export async function updateCategory(id: string, data: { name: string; icon: string; color: string }) {
  try {
    await prisma.category.update({ where: { id }, data });
    revalidateAll();
    return { success: true };
  } catch { return { success: false, error: 'Failed to update category.' }; }
}

export async function deleteCategory(id: string) {
  const count = await prisma.expense.count({ where: { categoryId: id } });
  if (count > 0) return { success: false, error: `Cannot delete: ${count} expenses use this category.` };
  await prisma.category.delete({ where: { id } });
  revalidateAll();
  return { success: true };
}

export async function toggleCategory(id: string, enabled: boolean) {
  await prisma.category.update({ where: { id }, data: { enabled } });
  revalidateAll();
  return { success: true };
}

// ─── ACCOUNTS ────────────────────────────────────────────────────────────────
export async function getAccounts() {
  await ensureDefaults();
  let accounts: any[] = [];
  try {
    accounts = await prisma.$queryRawUnsafe(`SELECT * FROM "Account" ORDER BY "name" ASC`);
    for (const acc of accounts) {
      const expCount = await prisma.expense.count({ where: { accountId: acc.id } });
      const incCount = await prisma.income.count({ where: { accountId: acc.id } });
      acc._count = { expenses: expCount, incomes: incCount };
      acc.openingBalance = Number(acc.openingBalance ?? acc.opening_balance ?? 0);
    }
  } catch {
    accounts = await prisma.account.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { expenses: true, incomes: true } } },
    });
  }

  // Re-verify live balances from transactions to guarantee accuracy using DB openingBalance
  for (const acc of accounts) {
    const op = Number(acc.openingBalance ?? 0);
    const expSum = await prisma.expense.aggregate({ where: { accountId: acc.id }, _sum: { amount: true } });
    const incSum = await prisma.income.aggregate({ where: { accountId: acc.id }, _sum: { amount: true } });
    const exp = expSum._sum.amount ?? 0;
    const inc = incSum._sum.amount ?? 0;
    const calculated = op + inc - exp;

    if (acc.balance !== calculated) {
      try {
        await prisma.account.update({
          where: { id: acc.id },
          data: { balance: calculated },
        });
      } catch {
        await prisma.$executeRawUnsafe(
          `UPDATE "Account" SET "balance" = ? WHERE "id" = ?`,
          calculated,
          acc.id
        );
      }
      acc.balance = calculated;
    }
  }

  return accounts;
}

export async function createAccount(data: { name: string; type: string; balance?: number; openingBalance?: number; currency?: string; status?: string; color: string; icon: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const opBal = data.openingBalance ?? data.balance ?? 0;
    try {
      await prisma.account.create({
        data: {
          name: data.name,
          type: data.type,
          openingBalance: opBal,
          balance: opBal,
          currency: data.currency || 'INR',
          status: data.status || 'active',
          color: data.color,
          icon: data.icon,
        },
      });
    } catch {
      const id = 'cmr' + Math.random().toString(36).substring(2, 11);
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Account" ("id", "name", "type", "openingBalance", "balance", "currency", "status", "color", "icon", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        id,
        data.name,
        data.type,
        opBal,
        opBal,
        data.currency || 'INR',
        data.status || 'active',
        data.color,
        data.icon
      );
    }
    revalidateAll();
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to create account.' };
  }
}

export async function updateAccount(id: string, data: { name: string; type: string; balance?: number; openingBalance?: number; currency?: string; status?: string; color: string; icon: string }): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx: any) => {
      const acc = await tx.account.findUnique({ where: { id } });
      if (!acc) throw new Error('Account not found');

      const currentOpening = acc.openingBalance ?? 0;
      const rawOpening = data.openingBalance !== undefined && !isNaN(Number(data.openingBalance))
        ? Number(data.openingBalance)
        : (data.balance !== undefined && !isNaN(Number(data.balance)) ? Number(data.balance) : currentOpening);
      const newOpening = isNaN(rawOpening) ? 0 : rawOpening;

      const expSum = await tx.expense.aggregate({ where: { accountId: id }, _sum: { amount: true } });
      const incSum = await tx.income.aggregate({ where: { accountId: id }, _sum: { amount: true } });
      const exp = expSum._sum.amount ?? 0;
      const inc = incSum._sum.amount ?? 0;

      const newBalance = newOpening + inc - exp;
      const currency = data.currency || acc.currency || 'INR';
      const status = data.status || acc.status || 'active';
      const color = data.color || acc.color || '#3b82f6';
      const icon = data.icon || acc.icon || '🏦';

      try {
        await tx.account.update({
          where: { id },
          data: {
            name: data.name,
            type: data.type,
            openingBalance: newOpening,
            balance: newBalance,
            currency,
            status,
            color,
            icon,
          },
        });
      } catch {
        // Fallback to raw SQL if Prisma Client in-memory DMMF rejects new schema arguments like openingBalance
        await tx.$executeRawUnsafe(
          `UPDATE "Account" SET "name" = ?, "type" = ?, "openingBalance" = ?, "balance" = ?, "currency" = ?, "status" = ?, "color" = ?, "icon" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`,
          data.name,
          data.type,
          newOpening,
          newBalance,
          currency,
          status,
          color,
          icon,
          id
        );
      }
    });
    revalidateAll();
    return { success: true };
  } catch (e: any) {
    console.error('Failed to update account:', e);
    return { success: false, error: e?.message || 'Failed to update account.' };
  }
}

export async function deleteAccount(id: string) {
  const expCount = await prisma.expense.count({ where: { accountId: id } });
  const incCount = await prisma.income.count({ where: { accountId: id } });
  const invCount = (prisma as any).investment ? await (prisma as any).investment.count({ where: { accountId: id } }) : 0;
  const totalLinked = expCount + incCount + invCount;
  if (totalLinked > 0) {
    return { success: false, error: `Cannot delete: ${totalLinked} transactions/investments are linked to this account.` };
  }
  await prisma.account.delete({ where: { id } });
  revalidateAll();
  return { success: true };
}

// ─── EXPENSES ────────────────────────────────────────────────────────────────
export type ExpenseInput = {
  amount: number; categoryName: string; expenseDate: string; expenseTime: string;
  paymentMethod: string; notes?: string; merchant?: string; accountId?: string;
};

export async function addExpense(data: ExpenseInput) {
  try {
    const categoryId = await getCategoryId(data.categoryName);
    await prisma.$transaction(async (tx) => {
      await tx.expense.create({
        data: {
          amount: data.amount,
          categoryId,
          expenseDate: new Date(data.expenseDate),
          expenseTime: data.expenseTime,
          paymentMethod: data.paymentMethod,
          notes: data.notes || null,
          merchant: data.merchant || null,
          accountId: data.accountId || null,
        },
      });

      if (data.accountId) {
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { decrement: data.amount } },
        });
      }
    });
    revalidateAll();
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to add expense.' };
  }
}

export async function updateExpense(id: string, data: ExpenseInput) {
  try {
    const categoryId = await getCategoryId(data.categoryName);
    await prisma.$transaction(async (tx) => {
      const oldExp = await tx.expense.findUnique({ where: { id } });
      if (!oldExp) throw new Error('Expense not found');

      // 1. Reverse old expense impact
      if (oldExp.accountId) {
        await tx.account.update({
          where: { id: oldExp.accountId },
          data: { balance: { increment: oldExp.amount } },
        });
      }

      // 2. Apply new expense impact
      if (data.accountId) {
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { decrement: data.amount } },
        });
      }

      // 3. Update expense
      await tx.expense.update({
        where: { id },
        data: {
          amount: data.amount,
          categoryId,
          expenseDate: new Date(data.expenseDate),
          expenseTime: data.expenseTime,
          paymentMethod: data.paymentMethod,
          notes: data.notes || null,
          merchant: data.merchant || null,
          accountId: data.accountId || null,
        },
      });
    });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update expense.' };
  }
}

export async function deleteExpense(id: string) {
  try {
    let deletedAmount = 0;
    await prisma.$transaction(async (tx) => {
      const exp = await tx.expense.findUnique({ where: { id } });
      if (!exp) return;
      deletedAmount = exp.amount;

      if (exp.accountId) {
        await tx.account.update({
          where: { id: exp.accountId },
          data: { balance: { increment: exp.amount } },
        });
      }

      await tx.expense.delete({ where: { id } });
    });
    await createAuditLog('Expense Deletion', `Deleted expense ID ${id} (Amount: ${deletedAmount})`);
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete expense.' };
  }
}

export async function duplicateExpense(id: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const exp = await tx.expense.findUnique({ where: { id } });
      if (!exp) throw new Error('Expense not found.');

      await tx.expense.create({
        data: {
          amount: exp.amount,
          categoryId: exp.categoryId,
          expenseDate: new Date(),
          expenseTime: new Date().toTimeString().substring(0, 5),
          paymentMethod: exp.paymentMethod,
          notes: exp.notes,
          merchant: exp.merchant,
          accountId: exp.accountId,
        },
      });

      if (exp.accountId) {
        await tx.account.update({
          where: { id: exp.accountId },
          data: { balance: { decrement: exp.amount } },
        });
      }
    });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to duplicate expense.' };
  }
}

export async function bulkDeleteExpenses(ids: string[]) {
  try {
    await prisma.$transaction(async (tx) => {
      const expenses = await tx.expense.findMany({ where: { id: { in: ids } } });
      for (const exp of expenses) {
        if (exp.accountId) {
          await tx.account.update({
            where: { id: exp.accountId },
            data: { balance: { increment: exp.amount } },
          });
        }
      }
      await tx.expense.deleteMany({ where: { id: { in: ids } } });
    });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to bulk delete expenses.' };
  }
}

export type ExpenseFilters = {
  search?: string;
  categoryId?: string;
  paymentMethod?: string;
  accountId?: string;
  month?: string;
  year?: string;
  singleDate?: string;
  dateFrom?: string;
  dateTo?: string;
  quickFilter?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
};

export async function getExpenseYears() {
  await ensureDefaults();
  const expenses = await prisma.expense.findMany({ select: { expenseDate: true } });
  const yearsSet = new Set<number>();
  yearsSet.add(new Date().getFullYear());
  for (const exp of expenses) {
    if (exp.expenseDate) {
      yearsSet.add(exp.expenseDate.getFullYear());
    }
  }
  return Array.from(yearsSet).sort((a, b) => b - a);
}

export async function getExpenses(filters: ExpenseFilters = {}) {
  const where: any = {};
  const now = new Date();

  // Category filter
  if (filters.categoryId && filters.categoryId !== 'all') {
    where.categoryId = filters.categoryId;
  }

  // Payment method filter
  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    where.paymentMethod = filters.paymentMethod;
  }

  // Account filter
  if (filters.accountId && filters.accountId !== 'all') {
    where.accountId = filters.accountId;
  }

  // Min and Max Amount filter
  if (filters.minAmount !== undefined && filters.minAmount !== null && !isNaN(Number(filters.minAmount))) {
    where.amount = { ...(where.amount || {}), gte: Number(filters.minAmount) };
  }
  if (filters.maxAmount !== undefined && filters.maxAmount !== null && !isNaN(Number(filters.maxAmount))) {
    where.amount = { ...(where.amount || {}), lte: Number(filters.maxAmount) };
  }

  // Search filter (Title, Category, Merchant, Notes, Amount, Payment Method, Tags)
  if (filters.search && filters.search.trim() !== '') {
    const term = filters.search.trim();
    const searchNum = Number(term);
    const isNum = !isNaN(searchNum) && term !== '';

    const orConditions: any[] = [
      { notes: { contains: term } },
      { merchant: { contains: term } },
      { paymentMethod: { contains: term } },
      { category: { name: { contains: term } } },
      { account: { name: { contains: term } } },
    ];
    if (isNum) {
      orConditions.push({ amount: searchNum });
    }
    where.AND = where.AND || [];
    where.AND.push({ OR: orConditions });
  }

  // Date filtering logic
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (filters.singleDate && filters.singleDate.trim() !== '') {
    const sd = new Date(filters.singleDate);
    if (!isNaN(sd.getTime())) {
      startDate = startOfDay(sd);
      endDate = endOfDay(sd);
    }
  } else if (filters.quickFilter && filters.quickFilter !== 'all' && filters.quickFilter !== 'custom') {
    const qf = filters.quickFilter.toLowerCase();
    if (qf === 'today') {
      startDate = startOfDay(now);
      endDate = endOfDay(now);
    } else if (qf === 'yesterday') {
      const y = subDays(now, 1);
      startDate = startOfDay(y);
      endDate = endOfDay(y);
    } else if (qf === 'this_week' || qf === 'this week') {
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
    } else if (qf === 'last_week' || qf === 'last week') {
      const lw = subWeeks(now, 1);
      startDate = startOfWeek(lw, { weekStartsOn: 1 });
      endDate = endOfWeek(lw, { weekStartsOn: 1 });
    } else if (qf === 'this_month' || qf === 'this month') {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else if (qf === 'last_month' || qf === 'last month') {
      const lm = subMonths(now, 1);
      startDate = startOfMonth(lm);
      endDate = endOfMonth(lm);
    } else if (qf === 'this_year' || qf === 'this year') {
      startDate = startOfYear(now);
      endDate = endOfYear(now);
    } else if (qf === 'last_year' || qf === 'last year') {
      const ly = subYears(now, 1);
      startDate = startOfYear(ly);
      endDate = endOfYear(ly);
    } else if (qf === 'last_7_days' || qf === 'last 7 days') {
      startDate = startOfDay(subDays(now, 6));
      endDate = endOfDay(now);
    } else if (qf === 'last_30_days' || qf === 'last 30 days') {
      startDate = startOfDay(subDays(now, 29));
      endDate = endOfDay(now);
    } else if (qf === 'last_90_days' || qf === 'last 90 days') {
      startDate = startOfDay(subDays(now, 89));
      endDate = endOfDay(now);
    }
  } else if (filters.dateFrom || filters.dateTo) {
    if (filters.dateFrom && filters.dateFrom.trim() !== '') {
      const df = new Date(filters.dateFrom);
      if (!isNaN(df.getTime())) startDate = startOfDay(df);
    }
    if (filters.dateTo && filters.dateTo.trim() !== '') {
      const dt = new Date(filters.dateTo);
      if (!isNaN(dt.getTime())) endDate = endOfDay(dt);
    }
  } else if (filters.month || filters.year) {
    let targetYear = now.getFullYear();
    if (filters.year && filters.year !== 'all') {
      const yNum = parseInt(filters.year, 10);
      if (!isNaN(yNum)) targetYear = yNum;
    }

    if (filters.month && filters.month !== 'all') {
      const mStr = filters.month.toLowerCase();
      let monthIndex: number | undefined;

      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];

      if (mStr === 'current') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      } else if (mStr === 'previous') {
        const pm = subMonths(now, 1);
        startDate = startOfMonth(pm);
        endDate = endOfMonth(pm);
      } else {
        const foundIdx = monthNames.indexOf(mStr);
        if (foundIdx !== -1) {
          monthIndex = foundIdx;
        } else {
          const parsed = parseInt(filters.month, 10);
          if (!isNaN(parsed)) {
            monthIndex = parsed >= 1 && parsed <= 12 ? parsed - 1 : (parsed >= 0 && parsed <= 11 ? parsed : undefined);
          }
        }
        if (monthIndex !== undefined) {
          const monthDate = new Date(targetYear, monthIndex, 1);
          startDate = startOfMonth(monthDate);
          endDate = endOfMonth(monthDate);
        }
      }
    } else if (filters.year && filters.year !== 'all') {
      const yearDate = new Date(targetYear, 0, 1);
      startDate = startOfYear(yearDate);
      endDate = endOfYear(yearDate);
    }
  }

  if (startDate || endDate) {
    where.expenseDate = {};
    if (startDate) where.expenseDate.gte = startDate;
    if (endDate) where.expenseDate.lte = endDate;
  }

  // Sorting maps
  const sortMap: Record<string, any> = {
    newest: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
    oldest: [{ expenseDate: 'asc' }, { createdAt: 'asc' }],
    highest: { amount: 'desc' },
    lowest: { amount: 'asc' },
    cat_asc: { category: { name: 'asc' } },
    cat_desc: { category: { name: 'desc' } },
    merchant_asc: { merchant: 'asc' },
    merchant_desc: { merchant: 'desc' },
  };
  const orderBy = sortMap[filters.sortBy || 'newest'] || [{ expenseDate: 'desc' }, { createdAt: 'desc' }];

  const expenses = await prisma.expense.findMany({
    where,
    orderBy,
    include: { category: true, account: true },
  });

  // Group by date
  const groups: Record<string, any[]> = {};
  for (const exp of expenses) {
    const key = exp.expenseDate.toISOString().split('T')[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push({
      id: exp.id,
      title: exp.merchant || exp.notes || exp.category.name,
      category: exp.category.name,
      categoryColor: exp.category.color,
      categoryIcon: exp.category.icon,
      amount: exp.amount,
      time: exp.expenseTime,
      method: exp.paymentMethod,
      notes: exp.notes,
      merchant: exp.merchant,
      accountName: exp.account?.name || null,
      categoryId: exp.categoryId,
      accountId: exp.accountId || null,
      date: key
    });
  }
  return Object.entries(groups).map(([date, items]) => ({
    date,
    items,
    total: items.reduce((s, i) => s + i.amount, 0)
  }));
}

export async function getExpenseById(id: string) {
  return prisma.expense.findUnique({ where: { id }, include: { category: true, account: true } });
}

// ─── INCOME ──────────────────────────────────────────────────────────────────
export async function getIncomes() {
  const incomes = await prisma.income.findMany({ orderBy: { incomeDate: 'desc' }, include: { account: true } });
  const groups: Record<string, any[]> = {};
  for (const inc of incomes) {
    const key = inc.incomeDate.toISOString().split('T')[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push({ id: inc.id, amount: inc.amount, source: inc.source, description: inc.description, date: key, accountName: inc.account?.name || null, accountId: inc.accountId });
  }
  return Object.entries(groups).map(([date, items]) => ({ date, items, total: items.reduce((s: number, i: any) => s + i.amount, 0) }));
}

export async function addIncome(data: { amount: number; source: string; description?: string; incomeDate: string; accountId?: string }) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.income.create({
        data: {
          amount: data.amount,
          source: data.source,
          description: data.description || null,
          incomeDate: new Date(data.incomeDate),
          accountId: data.accountId || null,
        },
      });

      if (data.accountId) {
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { increment: data.amount } },
        });
      }
    });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to add income.' };
  }
}

export async function updateIncome(id: string, data: { amount: number; source: string; description?: string; incomeDate: string; accountId?: string }) {
  try {
    await prisma.$transaction(async (tx) => {
      const oldInc = await tx.income.findUnique({ where: { id } });
      if (!oldInc) throw new Error('Income not found');

      // 1. Reverse old income impact
      if (oldInc.accountId) {
        await tx.account.update({
          where: { id: oldInc.accountId },
          data: { balance: { decrement: oldInc.amount } },
        });
      }

      // 2. Apply new income impact
      if (data.accountId) {
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { increment: data.amount } },
        });
      }

      // 3. Update income
      await tx.income.update({
        where: { id },
        data: {
          amount: data.amount,
          source: data.source,
          description: data.description || null,
          incomeDate: new Date(data.incomeDate),
          accountId: data.accountId || null,
        },
      });
    });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update income.' };
  }
}

export async function deleteIncome(id: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const inc = await tx.income.findUnique({ where: { id } });
      if (!inc) return;

      if (inc.accountId) {
        await tx.account.update({
          where: { id: inc.accountId },
          data: { balance: { decrement: inc.amount } },
        });
      }

      await tx.income.delete({ where: { id } });
    });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete income.' };
  }
}

export async function getAccountDetails(accountId: string) {
  await ensureDefaults();
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      expenses: { include: { category: true }, orderBy: { expenseDate: 'asc' } },
      incomes: { orderBy: { incomeDate: 'asc' } },
    },
  });

  if (!account) return null;

  // Build combined chronological transactions list
  const transactions: Array<{
    id: string;
    type: 'income' | 'expense';
    amount: number;
    title: string;
    category: string;
    categoryIcon?: string;
    categoryColor?: string;
    description: string;
    date: Date;
    dateStr: string;
  }> = [];

  for (const exp of account.expenses) {
    transactions.push({
      id: exp.id,
      type: 'expense',
      amount: exp.amount,
      title: exp.merchant || exp.notes || exp.category.name,
      category: exp.category.name,
      categoryIcon: exp.category.icon,
      categoryColor: exp.category.color,
      description: exp.notes || exp.merchant || '',
      date: exp.expenseDate,
      dateStr: exp.expenseDate.toISOString().split('T')[0],
    });
  }

  for (const inc of account.incomes) {
    transactions.push({
      id: inc.id,
      type: 'income',
      amount: inc.amount,
      title: inc.source,
      category: 'Income',
      categoryIcon: '💰',
      categoryColor: '#22c55e',
      description: inc.description || '',
      date: inc.incomeDate,
      dateStr: inc.incomeDate.toISOString().split('T')[0],
    });
  }

  // Sort chronologically ascending to compute running balance statement
  transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

  const rawAccList: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "Account" WHERE "id" = ?`, accountId);
  const opBalance = Number(rawAccList[0]?.openingBalance ?? rawAccList[0]?.opening_balance ?? (account as any).openingBalance ?? 0);
  let running = opBalance;
  const ledger = transactions.map((t) => {
    if (t.type === 'income') {
      running += t.amount;
    } else {
      running -= t.amount;
    }
    return {
      ...t,
      runningBalance: running,
    };
  });

  const totalIncome = account.incomes.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpense = account.expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const currentBalance = opBalance + totalIncome - totalExpense;

  // Sync actual account balance in DB if drifted
  if (account.balance !== currentBalance) {
    try {
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: currentBalance },
      });
    } catch {
      await prisma.$executeRawUnsafe(
        `UPDATE "Account" SET "balance" = ? WHERE "id" = ?`,
        currentBalance,
        accountId
      );
    }
  }

  return {
    account: {
      ...account,
      openingBalance: opBalance,
      balance: currentBalance,
    },
    totalIncome,
    totalExpense,
    transactionCount: ledger.length,
    ledger: ledger.slice().reverse(), // Most recent first for statement view
  };
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export async function getDashboardStats() {
  await ensureDefaults();
  const now = new Date();

  const [allExpenses, allIncomes, budget, settings, accounts, investments] = await Promise.all([
    prisma.expense.findMany({ include: { category: true }, orderBy: { expenseDate: 'desc' } }),
    prisma.income.findMany(),
    prisma.budget.findFirst(),
    prisma.settings.findFirst(),
    getAccounts(),
    (prisma as any).investment ? (prisma as any).investment.findMany() : Promise.resolve([]),
  ]);

  const todayStart = startOfDay(now), todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }), weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now), monthEnd = endOfMonth(now);
  const yearStart = startOfYear(now), yearEnd = endOfYear(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1)), prevMonthEnd = endOfMonth(subMonths(now, 1));

  const inRange = (d: Date, s: Date, e: Date) => d >= s && d <= e;

  let todayTotal = 0, weekTotal = 0, monthTotal = 0, yearTotal = 0, prevMonthTotal = 0;
  const categoryTotals: Record<string, { value: number; color: string; icon: string }> = {};
  const weeklyTrend: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (const exp of allExpenses) {
    const d = exp.expenseDate;
    if (inRange(d, todayStart, todayEnd)) todayTotal += exp.amount;
    if (inRange(d, weekStart, weekEnd)) { weekTotal += exp.amount; weeklyTrend[dayNames[d.getDay()]] = (weeklyTrend[dayNames[d.getDay()]] || 0) + exp.amount; }
    if (inRange(d, monthStart, monthEnd)) monthTotal += exp.amount;
    if (inRange(d, yearStart, yearEnd)) yearTotal += exp.amount;
    if (inRange(d, prevMonthStart, prevMonthEnd)) prevMonthTotal += exp.amount;
    if (!categoryTotals[exp.category.name]) categoryTotals[exp.category.name] = { value: 0, color: exp.category.color, icon: exp.category.icon };
    categoryTotals[exp.category.name].value += exp.amount;
  }

  const totalIncome = allIncomes.reduce((s, i) => s + i.amount, 0);
  const totalAvailableBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const currentPortfolioValue = (investments as any[]).reduce((s: number, i: any) => s + (i.currentValue || 0), 0);
  const totalInvestedAmount = (investments as any[]).reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const netWorth = totalAvailableBalance + currentPortfolioValue;

  const monthlyLimit = budget?.monthlyLimit || 50000;
  const pieData = Object.entries(categoryTotals).map(([name, d]) => ({ name, value: d.value, color: d.color, icon: d.icon })).sort((a, b) => b.value - a.value);
  const lineData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(n => ({ name: n, amount: weeklyTrend[n] || 0 }));

  return {
    todayTotal, weekTotal, monthTotal, yearTotal, prevMonthTotal, totalIncome, totalAvailableBalance, accounts,
    currentPortfolioValue, totalInvestedAmount, netWorth, investments,
    netSavings: totalIncome - monthTotal, monthlyLimit,
    currency: settings?.currencySymbol || '₹',
    budgetUsedPct: monthlyLimit > 0 ? Math.round((monthTotal / monthlyLimit) * 100) : 0,
    pieData, lineData,
    recent: allExpenses.slice(0, 5).map(e => ({ id: e.id, title: e.merchant || e.notes || e.category.name, category: e.category.name, categoryColor: e.category.color, amount: e.amount, time: e.expenseTime, method: e.paymentMethod })),
    topCategories: pieData.slice(0, 5),
    stats: { totalExpenses: allExpenses.length, avgExpense: allExpenses.length > 0 ? allExpenses.reduce((s, e) => s + e.amount, 0) / allExpenses.length : 0, highestExpense: allExpenses.length > 0 ? Math.max(...allExpenses.map(e => e.amount)) : 0 },
  };
}

// ─── INVESTMENTS ─────────────────────────────────────────────────────────────
export type InvestmentInput = {
  investmentType: string;
  investmentName: string;
  broker?: string;
  accountId?: string;
  investmentDate: string;
  amount: number;
  units?: number;
  purchasePrice?: number;
  currentPrice?: number;
  currentValue?: number;
  brokerCharges?: number;
  tax?: number;
  notes?: string;
  tags?: string;
  status?: string;
};

export async function addInvestment(data: InvestmentInput): Promise<{ success: boolean; error?: string }> {
  try {
    const totalDeduction = data.amount + (data.brokerCharges || 0) + (data.tax || 0);

    if (data.accountId) {
      const acc = await prisma.account.findUnique({ where: { id: data.accountId } });
      if (!acc) return { success: false, error: 'Selected Account not found.' };
      if (acc.balance < totalDeduction) {
        return {
          success: false,
          error: `Insufficient account balance in ${acc.name}. Available: ${acc.currency || '₹'}${acc.balance.toLocaleString()}, Required: ${acc.currency || '₹'}${totalDeduction.toLocaleString()}`,
        };
      }
    }

    const cValue = data.currentValue !== undefined && !isNaN(data.currentValue) ? data.currentValue : (data.units && data.currentPrice ? data.units * data.currentPrice : data.amount);

    await prisma.$transaction(async (tx) => {
      await tx.investment.create({
        data: {
          investmentType: data.investmentType,
          investmentName: data.investmentName,
          broker: data.broker || null,
          accountId: data.accountId || null,
          investmentDate: new Date(data.investmentDate),
          amount: data.amount,
          units: data.units || null,
          purchasePrice: data.purchasePrice || null,
          currentPrice: data.currentPrice || null,
          currentValue: cValue,
          brokerCharges: data.brokerCharges || 0,
          tax: data.tax || 0,
          notes: data.notes || null,
          tags: data.tags || null,
          status: data.status || 'active',
        },
      });

      if (data.accountId) {
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { decrement: totalDeduction } },
        });
      }
    });

    revalidateAll();
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to add investment.' };
  }
}

export async function updateInvestment(id: string, data: InvestmentInput): Promise<{ success: boolean; error?: string }> {
  try {
    const newOutlay = data.amount + (data.brokerCharges || 0) + (data.tax || 0);
    const cValue = data.currentValue !== undefined && !isNaN(data.currentValue) ? data.currentValue : (data.units && data.currentPrice ? data.units * data.currentPrice : data.amount);

    await prisma.$transaction(async (tx) => {
      const oldInv = await tx.investment.findUnique({ where: { id } });
      if (!oldInv) throw new Error('Investment not found');

      const oldOutlay = oldInv.amount + (oldInv.brokerCharges || 0) + (oldInv.tax || 0);

      // 1. Reverse old outlay on old account
      if (oldInv.accountId) {
        await tx.account.update({
          where: { id: oldInv.accountId },
          data: { balance: { increment: oldOutlay } },
        });
      }

      // 2. Apply new outlay to new account
      if (data.accountId) {
        const targetAcc = await tx.account.findUnique({ where: { id: data.accountId } });
        if (!targetAcc) throw new Error('Target account not found');
        if (targetAcc.balance < newOutlay) {
          throw new Error(`Insufficient balance in ${targetAcc.name}. Available: ₹${targetAcc.balance}`);
        }
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { decrement: newOutlay } },
        });
      }

      // 3. Update investment
      await tx.investment.update({
        where: { id },
        data: {
          investmentType: data.investmentType,
          investmentName: data.investmentName,
          broker: data.broker || null,
          accountId: data.accountId || null,
          investmentDate: new Date(data.investmentDate),
          amount: data.amount,
          units: data.units || null,
          purchasePrice: data.purchasePrice || null,
          currentPrice: data.currentPrice || null,
          currentValue: cValue,
          brokerCharges: data.brokerCharges || 0,
          tax: data.tax || 0,
          notes: data.notes || null,
          tags: data.tags || null,
          status: data.status || 'active',
        },
      });
    });

    revalidateAll();
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to update investment.' };
  }
}

export async function deleteInvestment(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    let invName = '';
    await prisma.$transaction(async (tx) => {
      const inv = await tx.investment.findUnique({ where: { id } });
      if (!inv) return;
      invName = inv.investmentName;

      const outlay = inv.amount + (inv.brokerCharges || 0) + (inv.tax || 0);

      if (inv.accountId) {
        await tx.account.update({
          where: { id: inv.accountId },
          data: { balance: { increment: outlay } },
        });
      }

      await tx.investment.delete({ where: { id } });
    });
    await createAuditLog('Investment Deletion', `Deleted investment ${invName || id}`);
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete investment.' };
  }
}

export type InvestmentFilters = {
  search?: string;
  type?: string;
  broker?: string;
  accountId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  month?: string;
  year?: string;
  minAmount?: number;
  maxAmount?: number;
  profitLoss?: 'profit' | 'loss';
  sortBy?: string;
};

export async function getInvestments(filters: InvestmentFilters = {}) {
  await ensureDefaults();
  const where: any = {};
  const now = new Date();

  if (filters.type && filters.type !== 'all') {
    where.investmentType = filters.type;
  }
  if (filters.broker && filters.broker !== 'all') {
    where.broker = filters.broker;
  }
  if (filters.accountId && filters.accountId !== 'all') {
    where.accountId = filters.accountId;
  }
  if (filters.status && filters.status !== 'all') {
    where.status = filters.status;
  }

  if (filters.minAmount !== undefined && filters.minAmount !== null && !isNaN(Number(filters.minAmount))) {
    where.amount = { ...(where.amount || {}), gte: Number(filters.minAmount) };
  }
  if (filters.maxAmount !== undefined && filters.maxAmount !== null && !isNaN(Number(filters.maxAmount))) {
    where.amount = { ...(where.amount || {}), lte: Number(filters.maxAmount) };
  }

  if (filters.search && filters.search.trim() !== '') {
    const term = filters.search.trim();
    where.OR = [
      { investmentName: { contains: term } },
      { broker: { contains: term } },
      { notes: { contains: term } },
      { tags: { contains: term } },
      { investmentType: { contains: term } },
    ];
  }

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (filters.dateFrom || filters.dateTo) {
    if (filters.dateFrom) startDate = startOfDay(new Date(filters.dateFrom));
    if (filters.dateTo) endDate = endOfDay(new Date(filters.dateTo));
  } else if (filters.month || filters.year) {
    let y = now.getFullYear();
    if (filters.year && filters.year !== 'all') y = parseInt(filters.year, 10);

    if (filters.month && filters.month !== 'all') {
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const idx = monthNames.indexOf(filters.month.toLowerCase());
      if (idx !== -1) {
        startDate = startOfMonth(new Date(y, idx, 1));
        endDate = endOfMonth(new Date(y, idx, 1));
      }
    } else if (filters.year && filters.year !== 'all') {
      startDate = startOfYear(new Date(y, 0, 1));
      endDate = endOfYear(new Date(y, 0, 1));
    }
  }

  if (startDate || endDate) {
    where.investmentDate = {};
    if (startDate) where.investmentDate.gte = startDate;
    if (endDate) where.investmentDate.lte = endDate;
  }

  const sortMap: Record<string, any> = {
    newest: [{ investmentDate: 'desc' }, { createdAt: 'desc' }],
    oldest: [{ investmentDate: 'asc' }, { createdAt: 'asc' }],
    highest_amount: { amount: 'desc' },
    lowest_amount: { amount: 'asc' },
    highest_value: { currentValue: 'desc' },
    name_asc: { investmentName: 'asc' },
    name_desc: { investmentName: 'desc' },
  };

  const orderBy = sortMap[filters.sortBy || 'newest'] || [{ investmentDate: 'desc' }, { createdAt: 'desc' }];

  let investments = (prisma as any).investment ? await (prisma as any).investment.findMany({
    where,
    orderBy,
    include: { account: true },
  }) : [];

  if (filters.profitLoss === 'profit') {
    investments = investments.filter((i: any) => i.currentValue > i.amount);
  } else if (filters.profitLoss === 'loss') {
    investments = investments.filter((i: any) => i.currentValue < i.amount);
  }

  return investments;
}

export async function getInvestmentStats() {
  await ensureDefaults();
  const investments = (prisma as any).investment ? await (prisma as any).investment.findMany({ include: { account: true } }) : [];

  const totalInvested = (investments as any[]).reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const currentPortfolioValue = (investments as any[]).reduce((s: number, i: any) => s + (i.currentValue || 0), 0);
  const totalProfitLoss = currentPortfolioValue - totalInvested;
  const returnPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  let bestPerformer: any = null;
  let worstPerformer: any = null;

  for (const inv of (investments as any[])) {
    const pl = inv.currentValue - inv.amount;
    const plPct = inv.amount > 0 ? (pl / inv.amount) * 100 : 0;
    const itemWithPct = { ...inv, profitLoss: pl, returnPct: plPct };

    if (!bestPerformer || plPct > bestPerformer.returnPct) {
      bestPerformer = itemWithPct;
    }
    if (!worstPerformer || plPct < worstPerformer.returnPct) {
      worstPerformer = itemWithPct;
    }
  }

  const typeMap: Record<string, { invested: number; currentValue: number }> = {};
  const brokerMap: Record<string, number> = {};

  for (const inv of (investments as any[])) {
    const t = inv.investmentType;
    if (!typeMap[t]) typeMap[t] = { invested: 0, currentValue: 0 };
    typeMap[t].invested += inv.amount;
    typeMap[t].currentValue += inv.currentValue;

    const b = inv.broker || 'Other';
    brokerMap[b] = (brokerMap[b] || 0) + inv.amount;
  }

  const typeData = Object.entries(typeMap).map(([type, d]) => ({
    type,
    invested: d.invested,
    currentValue: d.currentValue,
    profitLoss: d.currentValue - d.invested,
  })).sort((a, b) => b.currentValue - a.currentValue);

  const brokerData = Object.entries(brokerMap).map(([broker, amount]) => ({
    broker,
    amount,
  })).sort((a, b) => b.amount - a.amount);

  const brokers = Array.from(new Set((investments as any[]).map((i: any) => i.broker).filter(Boolean))) as string[];
  const years = Array.from(new Set((investments as any[]).map((i: any) => new Date(i.investmentDate).getFullYear()))) as number[];
  if (!years.includes(new Date().getFullYear())) years.push(new Date().getFullYear());
  years.sort((a: number, b: number) => b - a);

  return {
    totalInvested,
    currentPortfolioValue,
    totalProfitLoss,
    returnPercentage,
    activeCount: (investments as any[]).filter((i: any) => i.status === 'active').length,
    totalCount: (investments as any[]).length,
    bestPerformer,
    worstPerformer,
    typeData,
    brokerData,
    brokers,
    years,
  };
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
export async function getReportData(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly', dateFrom?: string, dateTo?: string) {
  const now = new Date();
  let start: Date, end: Date;

  if (dateFrom && dateTo) { start = new Date(dateFrom); end = endOfDay(new Date(dateTo)); }
  else if (period === 'daily') { start = startOfDay(now); end = endOfDay(now); }
  else if (period === 'weekly') { start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfWeek(now, { weekStartsOn: 1 }); }
  else if (period === 'monthly') { start = startOfMonth(now); end = endOfMonth(now); }
  else { start = startOfYear(now); end = endOfYear(now); }

  const expenses = await prisma.expense.findMany({ where: { expenseDate: { gte: start, lte: end } }, include: { category: true, account: true }, orderBy: { expenseDate: 'desc' } });

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory: Record<string, { value: number; color: string; count: number }> = {};
  const byMethod: Record<string, number> = {};
  const byDate: Record<string, number> = {};

  for (const exp of expenses) {
    if (!byCategory[exp.category.name]) byCategory[exp.category.name] = { value: 0, color: exp.category.color, count: 0 };
    byCategory[exp.category.name].value += exp.amount;
    byCategory[exp.category.name].count++;
    byMethod[exp.paymentMethod] = (byMethod[exp.paymentMethod] || 0) + exp.amount;
    const dk = exp.expenseDate.toISOString().split('T')[0];
    byDate[dk] = (byDate[dk] || 0) + exp.amount;
  }

  const categoryData = Object.entries(byCategory).map(([name, d]) => ({ name, value: d.value, color: d.color, count: d.count })).sort((a, b) => b.value - a.value);
  const methodData = Object.entries(byMethod).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const trendData = Object.entries(byDate).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date));

  return { total, count: expenses.length, average: expenses.length > 0 ? total / expenses.length : 0, highest: expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0, categoryData, methodData, trendData, expenses: expenses.map(e => ({ id: e.id, amount: e.amount, category: e.category.name, date: e.expenseDate.toISOString().split('T')[0], time: e.expenseTime, method: e.paymentMethod, notes: e.notes, merchant: e.merchant })) };
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────
export async function getExportData(filters: ExpenseFilters = {}) {
  const grouped = await getExpenses(filters);
  return grouped.flatMap(g => g.items);
}
