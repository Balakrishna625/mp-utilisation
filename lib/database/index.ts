/**
 * Database Utility Functions
 * 
 * Provides helper functions for database operations.
 * Database-agnostic: Works with both Supabase and AWS RDS.
 */

import prisma from '@/lib/prisma'

/**
 * Test database connection
 */
export async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    return { success: true, message: 'Connected to database' }
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message)
    return { success: false, error: error.message }
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Get database provider info
 */
export async function getDatabaseInfo() {
  const provider = process.env.DATABASE_URL?.includes('supabase') 
    ? 'Supabase PostgreSQL' 
    : process.env.DATABASE_URL?.includes('rds.amazonaws.com')
    ? 'AWS RDS PostgreSQL'
    : 'PostgreSQL'

  return {
    provider,
    isProduction: process.env.NODE_ENV === 'production',
    connectionPooling: process.env.DATABASE_URL?.includes('pooler') ? 'Enabled' : 'Disabled'
  }
}

/**
 * Health check endpoint data
 */
export async function getHealthStatus() {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start

    return {
      status: 'healthy',
      database: 'connected',
      latency: `${latency}ms`,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    return {
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

export default prisma
