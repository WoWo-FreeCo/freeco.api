import { GoogleUserService } from '../services/googleUserService/index';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
const googleUserService = new GoogleUserService('abc');
class GoogleUserController {
  //   async login(
  //     req: Request,
  //     res: Response,
  //     next: NextFunction,
  //   ): Promise<void> {
  //     try {
  //       const user = await googleUserService.authenticate();
  //       res
  //         .status(httpStatus.OK)
  //         .json({ data: user, testA: googleUserService.testA });
  //     } catch (err) {
  //       next(err);
  //     }
  //   }
}

export default new GoogleUserController();
