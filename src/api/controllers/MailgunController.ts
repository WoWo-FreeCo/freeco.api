import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import MailgunService from '../services/MailgunService';
import UserService from '../services/UserService';
import config from 'config';

class MailgunController {
  /**
   * 發送郵件
   */
  async sendEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const hashData = await MailgunService.encodeEmail({
        email: req.body.email,
      });
      const host = config.get<string>('HOST');
      const apiPort = config.get<string>('API_PORT');
      const link = `${host}:${apiPort}/api/v1/mail/vaildated-email?email=${hashData}`;
      const details = {
        from: `${config.get<string>(
          'CLIENT_HOST_NAME',
        )} <info@${config.get<string>('MAILGUN_DOMAIN')}>`,
        subject: `${config.get<string>('CLIENT_HOST_NAME')}-驗證信箱連結`,
        html: `
        <html>
        <h1>點擊連結驗證信箱</h1>
           <a href="${link}">
            ${link}
           </a>
       </html>
        `,
      };
      const data = await MailgunService.sendEmail({
        email: req.body.email,
        hashData: hashData,
        details,
      });
      res.status(httpStatus.OK).json({ msg: data });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 加密 email
   * @param req
   * @param res
   * @param next
   */
  async encodeEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const hashData = await MailgunService.encodeEmail({
        email: req.body.email,
      });

      res.status(httpStatus.OK).json({ msg: hashData });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 解密 email 以及更新 email 驗證時間
   * @param req
   * @param res
   * @param next
   */
  async validationEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 解密信箱
      const email = await MailgunService.decipherEmail({
        hashValue: req.query.email as string,
      });
      // 確認信箱是否有使用者
      const user = await UserService.getUserByEmail({ email });
      if (user === null) {
        res.status(httpStatus.NOT_FOUND).send({
          message: 'Email not found',
        });
        return;
      }
      // 更新信箱驗證時間
      try {
        await UserService.vaildationUserEmail({
          email: email,
        });
      } catch (err) {
        // 更新信箱驗證時間失敗
        res.status(httpStatus.BAD_REQUEST).send({
          message: 'Update email validation failed',
        });
      }
      res
        .status(httpStatus.OK)
        .json({ email: user.email, msg: '驗證信箱成功' });
    } catch (err) {
      next(err);
    }
  }
}

export default new MailgunController();
