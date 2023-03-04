import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import MailgunService from '../services/MailgunService';

class MailgunController {
  async testSendMail(req: Request, res: Response, next: NextFunction) {
    try {
      console.log(req);
      const data = await MailgunService.testSendMail();
      res.status(httpStatus.OK).json({ msg: data });
    } catch (err) {
      next(err);
    }
  }
}

export default new MailgunController();
