import { NextFunction, Request, Response } from 'express';

class ExampleMiddleware {
  example(_req: Request, _res: Response, next: NextFunction) {
    console.log('This is Example Middleware');
    next();
  }
}

export default new ExampleMiddleware();
