import app from './app';
import { prisma } from './lib/prisma';

const PORT = parseInt(process.env.PORT ?? '4000', 10);

async function main() {
  // Verify DB connection before starting
  await prisma.$connect();
  console.log('[db] Connected to PostgreSQL');

  app.listen(PORT, () => {
    console.log(`[api] PeerSphere API running on http://localhost:${PORT}`);
    console.log(`[api] Environment: ${process.env.NODE_ENV ?? 'development'}`);
  });
}

main().catch((err) => {
  console.error('[startup] Fatal error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
