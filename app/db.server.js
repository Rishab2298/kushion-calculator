import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// Add connection pool limits to DATABASE_URL for Railway's limited memory
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return url;

  // Add connection pool parameters if not present
  const separator = url.includes('?') ? '&' : '?';
  if (!url.includes('connection_limit')) {
    return `${url}${separator}connection_limit=3&pool_timeout=15`;
  }
  return url;
};

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

  // Graceful shutdown handlers for all termination signals
  const shutdown = async (signal) => {
    console.log(`Received ${signal}, closing database connections...`);
    try {
      await globalForPrisma.prisma.$disconnect();
      console.log("Database connections closed");
    } catch (e) {
      console.error("Error during disconnect:", e);
    }
    process.exit(0);
  };

  process.on("beforeExit", () => shutdown("beforeExit"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle uncaught errors to prevent silent crashes
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  });
}

const prisma = globalForPrisma.prisma;

export default prisma;
