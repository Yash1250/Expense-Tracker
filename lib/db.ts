import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

if (globalForPrisma.prisma && !(globalForPrisma.prisma as any).investment) {
  delete globalForPrisma.prisma;
}

export const prisma =
  globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
