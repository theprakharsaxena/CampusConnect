import http from 'http';
import app from './app';
import { config } from './config';
import { connectDatabase } from './config/database';
import { initializeSocket } from './sockets';

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const httpServer = http.createServer(app);
  initializeSocket(httpServer);

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
