import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';

class ImageController {
  async create(req: Request, res: Response, _next: NextFunction): Promise<void> {
    if (req['files']) {
      res.status(httpStatus.OK).json({filenames: req['files'].map(file => '/images/upload/' + file['filename'])});
    } else if (req['file']) {
      res.status(httpStatus.OK).send('/images/upload/' + req['file']['filename']);
    } else {
      res.status(httpStatus.BAD_REQUEST);
    }
  }
}

export default new ImageController();
