import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { initRedis } from './config/redis.js';

async function bootstrap() {
  console.log('🚀 Starting Enterprise Attendance Management System Backend...');

  try {
    await connectDatabase();
    await initRedis();

    const server = app.listen(env.PORT, () => {
      console.log(`\n======================================================`);
      console.log(`  🛡️  ENTERPRISE ATTENDANCE MANAGEMENT SYSTEM`);
      console.log(`  🔗  API Gateway listening at: ${env.APP_URL}`);
      console.log(`  🌐  Web App Origin allowed: ${env.WEB_URL}`);
      console.log(`  📦  Node Environment: ${env.NODE_ENV}`);
      console.log(`======================================================\n`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        const { disconnectDatabase } = await import('./config/database.js');
        await disconnectDatabase();
        console.log('✅ Server and database connections closed cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Fatal error during backend bootstrap:', error);
    process.exit(1);
  }
}

bootstrap();
