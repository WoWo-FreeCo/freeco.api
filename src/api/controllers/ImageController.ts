import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
// import multer from 'multer';

class ImageController {
  async create(req: Request, res: Response, _next: NextFunction): Promise<void> {
    res.status(httpStatus.OK).send(req['file']['filename']);
  }
}

export default new ImageController();
