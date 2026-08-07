import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { swaggerSpec } from './config/swagger';
import './config/cloudinary';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { apiRateLimiter } from './middlewares/rateLimit.middleware';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://campusconnect-web-taupe.vercel.app',
      ];
      if (!origin || allowedOrigins.includes(origin) || config.cors.origin === '*' || config.cors.origin === origin) {
        callback(null, true);
      } else {
        callback(null, true); // Allow to proceed to prevent browser blockages
      }
    },
    credentials: true,
  })
);
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

app.use(`/api/${config.apiVersion}`, apiRateLimiter, routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
