import http from 'http';
import app from './app';
import { config } from './config';
import { connectDatabase } from './config/database';
import { initializeSocket } from './sockets';
import { startDailyChallengeNotification } from './cron/dailyChallenge';

const startServer = async (): Promise<void> => {
  await connectDatabase();

  // Run legacy data migration
  try {
    const { User, Post, Event, Opportunity, Conversation, Challenge, VersionConfig } = await import('./models');
    await Promise.all([
      User.updateMany({ college: { $exists: false } }, { $set: { college: 'Bareilly College' } }),
      Post.updateMany({ college: { $exists: false } }, { $set: { college: 'Bareilly College' } }),
      Event.updateMany({ college: { $exists: false } }, { $set: { college: 'Bareilly College' } }),
      Opportunity.updateMany({ college: { $exists: false } }, { $set: { college: 'Bareilly College' } }),
      Conversation.updateMany({ college: { $exists: false } }, { $set: { college: 'Bareilly College' } }),
      Challenge.updateMany({ college: { $exists: false } }, { $set: { college: 'Bareilly College' } }),
    ]);

    // Ensure the default version config exists with 1.0.0 -> quickLogin: true
    const configExists = await VersionConfig.findOne();
    if (!configExists) {
      await VersionConfig.create({
        versions: [{ version: '1.0.0', quickLogin: true }],
      });
      console.log('VersionConfig seeded: version 1.0.0 initialized with quickLogin: true.');
    } else {
      // If version 1.0.0 is not in the list, push it
      const hasVersion100 = configExists.versions.some(v => v.version === '1.0.0');
      if (!hasVersion100) {
        configExists.versions.push({ version: '1.0.0', quickLogin: true });
        await configExists.save();
        console.log('Added version 1.0.0 to VersionConfig with quickLogin: true.');
      }
    }

    console.log('Database migration completed successfully (default college set to Bareilly College).');
  } catch (err) {
    console.error('Database migration failed:', err);
  }

  const httpServer = http.createServer(app);
  initializeSocket(httpServer);

  // Start cron jobs
  startDailyChallengeNotification();

  httpServer.listen(config.port, () => {
    console.log(`CampusConnect API running on port ${config.port}`);
    console.log(`Environment: ${config.env}`);
    console.log(`API Docs: http://localhost:${config.port}/api-docs`);
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
