import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import MailgunService from '../services/MailgunService';

class MailgunController {
  async sendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const hashData = await MailgunService.createHashEmail({
        email: req.body.email,
      });
      console.log(hashData);
      const data = await MailgunService.sendEmail({
        email: req.body.email,
        hashData: hashData,
      });
      res.status(httpStatus.OK).json({ msg: data });
    } catch (err) {
      next(err);
    }
  }

  async createHashEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const hashData = await MailgunService.createHashEmail({
        email: req.body.email,
      });

      res.status(httpStatus.OK).json({ msg: hashData });
    } catch (err) {
      next(err);
    }
  }

  async validateEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const isMatch = await MailgunService.vaildateEmail({
        hashValue: req.query.email as string,
      });
      res.status(httpStatus.OK).json({ isMatch: isMatch, msg: '驗證信箱成功' });
    } catch (err) {
      next(err);
    }
  }
}

export default new MailgunController();
