import { NextFunction, Request, Response } from 'express';
import Logger from '../../utils/logger';
import config from '../../config';
import httpStatus from 'http-status';

type ResponseType = {
  message?: string;
};
export class ErrorMiddleware {
  public static errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction,
  ) {
    const response: ResponseType = {};
    if (err.message) {
      const logs = {
        type: err.name,
        message: err.message,
        method: req.method,
        path: req.path,
        params: req.route.path,
        body: req.body,
        query: req.query,
        stack: err.stack,
      };
      Logger.error(JSON.stringify(logs));
      response.message = config.isDevelopment
        ? err.message
        : 'Internal Server Error';
    }

    res.status(httpStatus.INTERNAL_SERVER_ERROR);
    res.send(response);
  }
}
