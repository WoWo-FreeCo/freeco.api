import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import WebPageService from '../services/WebPageService';

class WebPageController {
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const webPage = await WebPageService.getWebPage({id: parseInt(req.params.id)});
      res.status(httpStatus.OK).send(webPage?.content);
    } catch (err) {
      next(err);
    }
  }
}

export default new WebPageController();
