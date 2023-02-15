import { NextFunction, Request, Response } from 'express';
import Logger from '../../utils/logger';

class ExampleMiddleware {
  example(_req: Request, _res: Response, next: NextFunction) {
    Logger.debug('This is Example Middleware');
    next();
  }
}

export default new ExampleMiddleware();
