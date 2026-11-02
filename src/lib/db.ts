import { PrismaClient } from "@prisma/client";

// Reaproveita a mesma instância em desenvolvimento (hot reload cria módulos novos).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
