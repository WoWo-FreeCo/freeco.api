import { NextFunction, Request, Response } from 'express';
import ExampleService from '../services/ExampleService';
import CheckContentService from '../services/CheckContentService';
import httpStatus from 'http-status';

interface CheckContentInSequence {
  index: number;
  video: string | null;
  credit: number;
  isMission: boolean;
}

class CheckContentController {
  async getAll(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const checkContentsInSequence =
        await CheckContentService.getAllCheckContentInSequence();

      const responseData: CheckContentInSequence[] =
        checkContentsInSequence.map((checkContent) => ({
          index: checkContent.index,
          video: checkContent.video,
          credit: checkContent.credit,
          isMission: checkContent.isMission,
        }));
      await ExampleService.example();
      res.status(httpStatus.OK).send({
        data: responseData,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new CheckContentController();
