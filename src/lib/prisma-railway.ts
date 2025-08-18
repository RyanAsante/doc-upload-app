import { PrismaClient } from '@prisma/client'

// Railway Prisma Client for user operations
const railwayPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.RAILWAY_DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
})

export { railwayPrisma }
