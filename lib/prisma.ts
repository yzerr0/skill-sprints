import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { env } from 'prisma/config'

const connectionString = env('DATABASE_URL');

if(!connectionString) throw new Error("DATABASE_URL is undefined");

const adapter = new PrismaPg({
    connectionString,
})

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter, }
);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma