import cors from 'cors';
import express, { Application } from 'express';
import compression from 'compression';
import router from './api/routes/v1';
import { ErrorMiddleware } from './api/middlewares/ErrorMiddleware';

export function createServer(): Application {
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: '*',
    }),
  );
  app.use(compression());
  app.use('/api/v1', router);
  app.use(ErrorMiddleware.errorHandler);
  return app;
}
