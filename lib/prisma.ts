/**
 * Prisma Client Singleton
 * 
 * This ensures we reuse the same Prisma Client instance across the app.
 * Works seamlessly with both Supabase and AWS RDS PostgreSQL.
 * 
 * Migration: Just change DATABASE_URL in .env - no code changes needed!
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.warn('DATABASE_URL not found, Prisma client may not work properly')
    return new PrismaClient()
  }

  // Create a PostgreSQL connection pool
  // Explicitly set rejectUnauthorized: false for RDS/cloud databases
  // (sslmode=no-verify in the connection string is not reliably parsed by the pg library)
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  })

  // Create the Prisma adapter
  const adapter = new PrismaPg(pool)

  // Create and return Prisma Client with adapter
  return new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
