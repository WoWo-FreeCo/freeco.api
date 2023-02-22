import cors from 'cors';
import express, { Application } from 'express';
import compression from 'compression';
import router from './api/routes/v1';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { ErrorMiddleware } from './api/middlewares/ErrorMiddleware';

export function createServer(): Application {
  const app = express();

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(cookieParser());
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
