/**
 * Prisma Client Singleton
 * 
 * Standard PrismaClient using DATABASE_URL env var.
 * SSL is handled by NODE_TLS_REJECT_UNAUTHORIZED=0 set in Amplify env vars.
 * This is simpler and more reliable than the driver adapter approach in Lambda.
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Cache globally in ALL environments to avoid creating multiple connections.

export default prisma
